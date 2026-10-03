import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as signer from '../functions/_lib/offlineGrantSignature.js';
import { enrollOfflineGrant, unlockOfflineGrant, verifyPasswordVerifier } from '../src/services/offlineUnlock.js';
import { assertVerifiedOfflineGrant } from '../src/services/verifiedOfflineGrant.js';

const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const privateJwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
const publicJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);

const claims = () => ({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: 'device-1',
  branchIds: ['branch-1'], onlineVerifiedAt: '2026-10-01T08:00:00Z' });
const context = () => ({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: 'device-1', branchId: 'branch-1' });
const grant = async (overrides = {}) => signer.issueSignedOfflineGrant(privateJwk, { ...claims(), ...overrides });

test('a previously enrolled cashier unlocks offline with their password', async () => {
  const record = await enrollOfflineGrant({ envelope: await grant(), password: 'secret-pass', ...context(), at: '2026-10-01T09:00:00Z', pinnedPublicJwk: publicJwk });
  assert.equal(typeof record.salt, 'string');
  assert.equal(record.envelope.claims.cashierId, 'cashier-a');
  const handle = await unlockOfflineGrant(record, { password: 'secret-pass', ...context(), at: '2026-10-01T10:00:00Z', pinnedPublicJwk: publicJwk });
  assert.equal(assertVerifiedOfflineGrant(handle, context(), '2026-10-01T10:00:00Z'), true);
});

test('first-time offline login has no stored record and fails closed', async () => {
  await assert.rejects(unlockOfflineGrant(null, { password: 'secret-pass', ...context(), pinnedPublicJwk: publicJwk }), /تحقق سابق/);
});

test('a wrong password cannot unlock a valid grant', async () => {
  const record = await enrollOfflineGrant({ envelope: await grant(), password: 'right-pass', ...context(), at: '2026-10-01T09:00:00Z', pinnedPublicJwk: publicJwk });
  await assert.rejects(unlockOfflineGrant(record, { password: 'wrong-pass', ...context(), at: '2026-10-01T10:00:00Z', pinnedPublicJwk: publicJwk }), /كلمة المرور/);
  assert.equal(await verifyPasswordVerifier('wrong-pass', record.salt, record.hash), false);
  assert.equal(await verifyPasswordVerifier('right-pass', record.salt, record.hash), true);
});

test('an expired grant cannot be unlocked even with the correct password', async () => {
  const record = await enrollOfflineGrant({ envelope: await grant(), password: 'secret-pass', ...context(), at: '2026-10-01T09:00:00Z', pinnedPublicJwk: publicJwk });
  await assert.rejects(unlockOfflineGrant(record, { password: 'secret-pass', ...context(), at: '2026-10-02T09:00:00Z', pinnedPublicJwk: publicJwk }), /انتهت صلاحية/);
});

test('the grant cannot be unlocked for another device, branch, cashier, or tenant', async () => {
  const record = await enrollOfflineGrant({ envelope: await grant(), password: 'secret-pass', ...context(), at: '2026-10-01T09:00:00Z', pinnedPublicJwk: publicJwk });
  for (const [field, value] of [['deviceId', 'device-2'], ['branchId', 'branch-2'], ['cashierId', 'cashier-b'], ['tenantId', 'tenant-b']])
    await assert.rejects(unlockOfflineGrant(record, { password: 'secret-pass', ...context(), [field]: value, at: '2026-10-01T10:00:00Z', pinnedPublicJwk: publicJwk }), /تصريح/);
});

test('a tampered stored envelope cannot be unlocked', async () => {
  const record = await enrollOfflineGrant({ envelope: await grant(), password: 'secret-pass', ...context(), at: '2026-10-01T09:00:00Z', pinnedPublicJwk: publicJwk });
  record.envelope.claims.cashierId = 'attacker';
  await assert.rejects(unlockOfflineGrant(record, { password: 'secret-pass', ...context(), at: '2026-10-01T10:00:00Z', pinnedPublicJwk: publicJwk }), /توقيع/);
});

test('an already-expired grant cannot be enrolled', async () => {
  await assert.rejects(enrollOfflineGrant({ envelope: await grant(), password: 'secret-pass', ...context(), at: '2026-10-02T09:00:00Z', pinnedPublicJwk: publicJwk }), /انتهت صلاحية/);
});

test('enrollment rejects a grant whose claims do not match the device scope', async () => {
  await assert.rejects(enrollOfflineGrant({ envelope: await grant({ deviceId: 'other-device' }), password: 'secret-pass', ...context(), at: '2026-10-01T09:00:00Z', pinnedPublicJwk: publicJwk }), /تصريح/);
});
