// Local unlock for the 24-hour offline cashier grant.
//
// The offline grant is a signed, server-issued envelope. This module binds that
// envelope to the previously verified cashier's login credential without ever
// retaining the plaintext password or a reusable bearer token. When a cashier
// first authenticates online, `enrollOfflineGrant` verifies the grant and
// stores it next to a salted PBKDF2 verifier of the password. Later, while
// disconnected, `unlockOfflineGrant` re-checks the password and the signature
// and re-asserts the 24-hour scope/expiry policy before releasing a verified
// handle. First-time offline login (no stored record), a wrong password, a
// tampered envelope, a wrong device/branch/cashier/tenant, and an expired grant
// all fail closed. Server revocation cannot reach a disconnected device, so the
// accepted local revocation window is the same 24-hour expiry (see the design).
import { verifySignedOfflineGrant, assertVerifiedOfflineGrant } from './verifiedOfflineGrant.js';
import { OFFLINE_GRANT_PUBLIC_JWK } from '../config/offlineGrantPublicKey.js';

const encoder = new TextEncoder();
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('بيانات قفل العمل دون اتصال تالفة');
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(raw, char => char.charCodeAt(0));
};

async function deriveVerifier(password, saltBytes) {
  if (typeof password !== 'string' || !password) throw new Error('يلزم إدخال كلمة المرور');
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  return new Uint8Array(bits);
}

export async function derivePasswordVerifier(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: b64u(salt), hash: b64u(await deriveVerifier(password, salt)) };
}

export async function verifyPasswordVerifier(password, salt, expectedHash) {
  const hash = await deriveVerifier(password, unb64u(salt));
  const expected = unb64u(expectedHash);
  if (hash.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < hash.length; index += 1) diff |= hash[index] ^ expected[index];
  return diff === 0;
}

export async function enrollOfflineGrant(input) {
  const { envelope, password, tenantId, cashierId, deviceId, branchId, at = new Date().toISOString() } = input;
  const pinnedPublicJwk = input.pinnedPublicJwk ?? OFFLINE_GRANT_PUBLIC_JWK;
  const handle = await verifySignedOfflineGrant(envelope, pinnedPublicJwk);
  assertVerifiedOfflineGrant(handle, { tenantId, cashierId, deviceId, branchId }, at);
  const verifier = await derivePasswordVerifier(password);
  return { envelope: structuredClone(envelope), salt: verifier.salt, hash: verifier.hash };
}

export async function unlockOfflineGrant(record, input) {
  const { password, tenantId, cashierId, deviceId, branchId, at = new Date().toISOString() } = input;
  const pinnedPublicJwk = input.pinnedPublicJwk ?? OFFLINE_GRANT_PUBLIC_JWK;
  if (!record?.envelope || !record?.salt || !record?.hash)
    throw new Error('لا يوجد تحقق سابق عبر الإنترنت لهذا المحاسب على هذا الجهاز');
  if (!(await verifyPasswordVerifier(password, record.salt, record.hash)))
    throw new Error('كلمة المرور غير صحيحة للعمل دون اتصال');
  const handle = await verifySignedOfflineGrant(record.envelope, pinnedPublicJwk);
  assertVerifiedOfflineGrant(handle, { tenantId, cashierId, deviceId, branchId }, at);
  return handle;
}
