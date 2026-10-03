import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as signer from '../functions/_lib/offlineGrantSignature.js';
import { OfflineGrantStore, memoryBackend, offlineGrantRecordKey } from '../src/services/offlineGrantStore.js';
import { ensureOfflineDeviceIdentity } from '../src/services/offlineDeviceIdentity.js';
import { enrollOnline, unlockOffline } from '../src/services/offlineGrantEnrollment.js';
import { assertVerifiedOfflineGrant } from '../src/services/verifiedOfflineGrant.js';

const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const privateJwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
const publicJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);

const user = { id: 'cashier-a', tenantId: 'tenant-a', branchId: 'branch-1', branchIds: ['branch-1', 'branch-2'] };
const ok = body => ({ ok: true, status: 200, json: async () => body });

const fakeFetch = async (url, init) => {
  const body = JSON.parse(init.body);
  if (url.endsWith('/api/cash/devices')) return ok({ success: true, deviceId: body.deviceId });
  if (url.endsWith('/api/cash/grants')) {
    const grant = await signer.issueSignedOfflineGrant(privateJwk, {
      tenantId: body.tenantId, cashierId: 'cashier-a', deviceId: body.deviceId,
      branchIds: ['branch-1', 'branch-2'], onlineVerifiedAt: new Date().toISOString()
    });
    return ok({ success: true, grant });
  }
  return { ok: false, status: 404, json: async () => ({ success: false, error: 'not found' }) };
};

test('device identity is generated once and reused', async () => {
  const store = new OfflineGrantStore(memoryBackend());
  const first = await ensureOfflineDeviceIdentity(store);
  const second = await ensureOfflineDeviceIdentity(store);
  assert.equal(second.deviceId, first.deviceId);
  assert.equal(second.deviceProof, first.deviceProof);
  assert.match(first.deviceProof, /^[a-f0-9]{64}$/);
});

test('offline grant records are device-scoped and durable', async () => {
  const backend = memoryBackend();
  const store = new OfflineGrantStore(backend);
  await store.saveRecord({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: 'device-1' }, { marker: 1 });
  const reopened = new OfflineGrantStore(backend);
  assert.deepEqual(await reopened.loadRecord({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: 'device-1' }), { marker: 1 });
  assert.equal(await reopened.loadRecord({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: 'device-2' }), null);
  await reopened.clearRecord({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: 'device-1' });
  assert.equal(await reopened.loadRecord({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: 'device-1' }), null);
  assert.equal(offlineGrantRecordKey({ tenantId: 't', cashierId: 'c', deviceId: 'd' }), 'braka:offline_grant:t:c:d');
});

test('online enrollment registers the device, obtains a grant, and persists it', async () => {
  const store = new OfflineGrantStore(memoryBackend());
  const { deviceId, record } = await enrollOnline({
    store, fetchFn: fakeFetch, apiBaseUrl: 'https://test.invalid', token: 'tok',
    user, password: 'secret-pass', pinnedPublicJwk: publicJwk
  });
  assert.equal(typeof deviceId, 'string');
  assert.equal(record.envelope.claims.cashierId, 'cashier-a');
  const saved = await store.loadRecord({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId });
  assert.deepEqual(saved.envelope.claims, record.envelope.claims);
});

test('an enrolled cashier unlocks offline on their own device and branch', async () => {
  const store = new OfflineGrantStore(memoryBackend());
  await enrollOnline({ store, fetchFn: fakeFetch, apiBaseUrl: 'https://test.invalid', token: 'tok', user, password: 'secret-pass', pinnedPublicJwk: publicJwk });
  const handle = await unlockOffline({ store, user, password: 'secret-pass', branchId: 'branch-2', pinnedPublicJwk: publicJwk });
  assert.equal(assertVerifiedOfflineGrant(handle, { tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: (await ensureOfflineDeviceIdentity(store)).deviceId, branchId: 'branch-2' }), true);
});

test('offline unlock fails closed for a wrong password or an unenrolled device', async () => {
  const store = new OfflineGrantStore(memoryBackend());
  await assert.rejects(unlockOffline({ store, user, password: 'secret-pass', branchId: 'branch-1', pinnedPublicJwk: publicJwk }), /تحقق سابق/);
  await enrollOnline({ store, fetchFn: fakeFetch, apiBaseUrl: 'https://test.invalid', token: 'tok', user, password: 'secret-pass', pinnedPublicJwk: publicJwk });
  await assert.rejects(unlockOffline({ store, user, password: 'wrong-pass', branchId: 'branch-1', pinnedPublicJwk: publicJwk }), /كلمة المرور/);
  await assert.rejects(unlockOffline({ store, user, password: 'secret-pass', branchId: 'foreign-branch', pinnedPublicJwk: publicJwk }), /تصريح/);
});

test('enrollment propagates server errors instead of persisting a half-finished grant', async () => {
  const store = new OfflineGrantStore(memoryBackend());
  const failing = async (url, init) => ({ ok: false, status: 403, json: async () => ({ success: false, error: 'Device proof mismatch' }) });
  await assert.rejects(enrollOnline({ store, fetchFn: failing, apiBaseUrl: 'https://test.invalid', token: 'tok', user, password: 'secret-pass', pinnedPublicJwk: publicJwk }), /Device proof mismatch/);
  const device = await ensureOfflineDeviceIdentity(store);
  assert.equal(await store.loadRecord({ tenantId: 'tenant-a', cashierId: 'cashier-a', deviceId: device.deviceId }), null);
});
