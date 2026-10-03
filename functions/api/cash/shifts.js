import { authenticateRequest, requireTenant } from '../../_lib/auth.js';
import { badRequest, forbidden, json, options, readJson } from '../../_lib/http.js';
import { canAccessBranch } from '../../../src/services/branchAccess.js';
import { canSync } from '../../_lib/syncPolicy.js';
import { accountingDate } from '../../../src/services/cashShiftEngine.js';
import { hashCashDeviceProof } from '../../_lib/cashDeviceProof.js';

export const onRequestOptions = options;
const text = (value, limit) => typeof value === 'string' && value.trim() && value.length <= limit;

export async function onRequestGet({request,env}) {
  const auth=await authenticateRequest(request,env);
  if (auth.error) return auth.error;
  const url=new URL(request.url),tenantId=url.searchParams.get('tenantId'),branchId=url.searchParams.get('branchId');
  const denied=requireTenant(auth,tenantId);
  if (denied) return denied;
  if (!text(branchId,128) || !canAccessBranch(auth.principal,branchId)) return forbidden('Branch access denied');
  const rows=await env.DB.prepare(`SELECT id,tenant_id,branch_id,drawer_id,opened_by,offline_device_id,time_zone,
    accounting_date,opened_at,opening_cash_cents,status,closed_at,closed_by,counted_cash_cents,expected_cash_cents,variance_cents
    FROM cash_shifts WHERE tenant_id=? AND branch_id=? ORDER BY opened_at DESC,id DESC LIMIT 200`)
    .bind(tenantId,branchId).all();
  return json({success:true,shifts:rows.results});
}

export async function onRequestPost({request,env}) {
  const auth=await authenticateRequest(request,env);
  if (auth.error) return auth.error;
  let input;
  try {
    input=await readJson(request);
    const denied=requireTenant(auth,input.tenantId);
    if (denied) return denied;
    if (!canSync(auth.principal,'invoice','create') || !canAccessBranch(auth.principal,input.branchId)) return forbidden('Shift opening denied');
    if (![input.id,input.branchId,input.drawerId,input.offlineDeviceId].every(value=>text(value,128)) ||
        !text(input.timeZone,80)) return badRequest('Invalid shift identity');
    const openingCash=Number(input.openingCash);
    if (!Number.isFinite(openingCash) || openingCash < 0 ||
        Math.abs(openingCash*100-Math.round(openingCash*100))>1e-6) return badRequest('Invalid opening cash');
    const drawer=await env.DB.prepare("SELECT id FROM cash_drawers WHERE id=? AND tenant_id=? AND branch_id=? AND status='active'")
      .bind(input.drawerId,input.tenantId,input.branchId).first();
    if (!drawer) return badRequest('Unknown active drawer');
    const openedAt=new Date().toISOString();
    const day=accountingDate(openedAt,input.timeZone);
    const proofHash=await hashCashDeviceProof(env.AUTH_SECRET,input.deviceProof);
    await env.DB.prepare(`INSERT INTO cash_shifts
      (id,tenant_id,branch_id,drawer_id,opened_by,offline_device_id,time_zone,accounting_date,opened_at,opening_cash_cents,status,device_proof_hash)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(input.id,input.tenantId,input.branchId,input.drawerId,auth.principal.id,input.offlineDeviceId,input.timeZone,
        day,openedAt,Math.round(openingCash*100),'open',proofHash).run();
    return json({success:true,id:input.id,openedAt,accountingDate:day},201);
  } catch(error) {
    if (input && /UNIQUE constraint failed/.test(error.message)) {
      const old=await env.DB.prepare('SELECT * FROM cash_shifts WHERE id=? AND tenant_id=?').bind(input.id,input.tenantId).first();
      if (old && old.branch_id===input.branchId && old.drawer_id===input.drawerId &&
          old.opened_by===auth.principal.id && old.offline_device_id===input.offlineDeviceId &&
          old.time_zone===input.timeZone && old.opening_cash_cents===Math.round(Number(input.openingCash)*100) &&
          old.device_proof_hash===await hashCashDeviceProof(env.AUTH_SECRET,input.deviceProof))
        return json({success:true,id:old.id,openedAt:old.opened_at,accountingDate:old.accounting_date},200);
      return json({success:false,error:'Drawer has an open shift or shift ID exists'},409);
    }
    return badRequest(error.message);
  }
}
