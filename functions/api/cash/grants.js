import { authenticateRequest, requireTenant } from '../../_lib/auth.js';
import { badRequest, forbidden, json, options, readJson } from '../../_lib/http.js';
import { canSync } from '../../_lib/syncPolicy.js';
import { hashCashDeviceProof } from '../../_lib/cashDeviceProof.js';
import { issueSignedOfflineGrant } from '../../_lib/offlineGrantSignature.js';

export const onRequestOptions = options;
const text = (value, limit) => typeof value === 'string' && value.trim() && value.length <= limit;
const deviceProofPattern = /^[a-f0-9]{64}$/;

// Branch scope is derived exclusively from trusted server state, never from the
// caller. Owners and platform administrators whose scope is "all" are expanded
// to the tenant's active branches; staff keep their explicit assignments.
async function authorizedBranchIds(env, tenantId, principal) {
  const ids = Array.isArray(principal.branchIds) ? principal.branchIds : [];
  if (ids.includes('all')) {
    const rows = await env.DB.prepare("SELECT id FROM branches WHERE tenant_id = ? AND status = 'active' ORDER BY id")
      .bind(tenantId).all();
    return rows.results.map(row => row.id);
  }
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = await env.DB.prepare(`SELECT id FROM branches WHERE tenant_id = ? AND status = 'active' AND id IN (${placeholders}) ORDER BY id`)
    .bind(tenantId, ...ids).all();
  return rows.results.map(row => row.id);
}

// Issues a signed, login-bound, device-bound 24-hour offline grant. The cashier,
// tenant, and branch permissions come from the authenticated session and the
// database; the verification time is the server clock. Caller-supplied grant
// claims and public keys are ignored by construction.
export async function onRequestPost({ request, env }) {
  const auth = await authenticateRequest(request, env);
  if (auth.error) return auth.error;
  try {
    const input = await readJson(request);
    const denied = requireTenant(auth, input.tenantId);
    if (denied) return denied;
    if (!canSync(auth.principal, 'invoice', 'create')) return forbidden('Offline cashier access denied');
    if (!text(input.deviceId, 128) || !deviceProofPattern.test(input.deviceProof || ''))
      return badRequest('Invalid device identity');
    let eventPublicJwk;
    if (input.eventPublicJwk) {
      const proposed=input.eventPublicJwk;
      if (proposed.kty!=='EC'||proposed.crv!=='P-256'||proposed.d||
          !/^[A-Za-z0-9_-]{43}$/.test(proposed.x||'')||!/^[A-Za-z0-9_-]{43}$/.test(proposed.y||''))
        return badRequest('Invalid event signing public key');
      eventPublicJwk={kty:'EC',crv:'P-256',x:proposed.x,y:proposed.y};
      try { await crypto.subtle.importKey('jwk',eventPublicJwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']); }
      catch { return badRequest('Invalid event signing public key'); }
    }
    const device = await env.DB.prepare('SELECT device_proof_hash, revoked_at FROM cash_devices WHERE tenant_id = ? AND id = ?')
      .bind(auth.principal.tenantId, input.deviceId).first();
    if (!device || device.revoked_at) return forbidden('Device is not registered');
    if (device.device_proof_hash !== await hashCashDeviceProof(env.AUTH_SECRET, input.deviceProof))
      return forbidden('Device proof mismatch');
    const branchIds = await authorizedBranchIds(env, auth.principal.tenantId, auth.principal);
    let privateJwk = null;
    try { privateJwk = JSON.parse(env.OFFLINE_GRANT_PRIVATE_JWK || ''); } catch { privateJwk = null; }
    if (!privateJwk) return json({ success: false, error: 'Offline grants are not configured' }, 503);
    const claims = {
      tenantId: auth.principal.tenantId,
      cashierId: auth.principal.id,
      deviceId: input.deviceId,
      branchIds,
      ...(eventPublicJwk?{eventPublicJwk}:{}),
      onlineVerifiedAt: new Date().toISOString()
    };
    const grant = await issueSignedOfflineGrant(privateJwk, claims);
    return json({ success: true, grant });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest('Invalid JSON');
    return badRequest(error.message);
  }
}
