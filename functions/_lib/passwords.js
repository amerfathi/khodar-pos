import bcrypt from 'bcryptjs';

// Pure JS bcrypt runs in Workers without native binaries. Cost 12 is verified in
// the local workerd integration tests; benchmark paid production CPU limits.
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 ||
      new TextEncoder().encode(password).byteLength > 72) {
    throw new Error('Password must be at least 12 characters and at most 72 UTF-8 bytes');
  }
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string' ||
      new TextEncoder().encode(password).byteLength > 72 ||
      !/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/.test(stored)) {
    return { valid: false, legacy: false };
  }
  return { valid: await bcrypt.compare(password, stored), legacy: false };
}
