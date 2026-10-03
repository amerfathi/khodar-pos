// A stable per-device identity plus a 64-hex possession proof. The identity is
// created once and stored durably; it is not an authorization credential, but
// the server stores only a salted hash of the proof, so a caller must hold the
// same device to register it or obtain an offline grant.
import { OfflineGrantStore } from './offlineGrantStore.js';

const proofPattern = /^[a-f0-9]{64}$/;
const deviceProof = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');

export async function ensureOfflineDeviceIdentity(store) {
  if (!(store instanceof OfflineGrantStore)) throw new Error('تخزين هوية الجهاز غير متاح');
  const existing = await store.loadDeviceIdentity();
  if (existing?.deviceId && proofPattern.test(existing.deviceProof || '')) return existing;
  const identity = { deviceId: crypto.randomUUID(), deviceProof: deviceProof(), createdAt: new Date().toISOString() };
  await store.saveDeviceIdentity(identity);
  return identity;
}
