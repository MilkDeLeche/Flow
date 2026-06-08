// AES-256-GCM encryption for secrets at rest (users' BYOK API keys).
// The key comes from APP_ENCRYPTION_KEY (32 bytes, as 64 hex chars or base64).
// Generate one with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// If APP_ENCRYPTION_KEY is missing, derive a stable key from the server-only
// Supabase service role key so BYOK storage still works without exposing
// plaintext keys to the browser.
import * as crypto from 'crypto';

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY || '';
  if (!raw) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!serviceRoleKey)
      throw new Error('APP_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required.');
    return crypto.createHash('sha256').update(`flow-byok:${serviceRoleKey}`).digest();
  }
  const buf = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (buf.length !== 32)
    throw new Error('APP_ENCRYPTION_KEY must decode to 32 bytes (64 hex chars).');
  return buf;
}

/** Returns a self-describing string: v1.<iv>.<tag>.<ciphertext> (all base64). */
export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

/** Inverse of encryptSecret. Throws if the payload is tampered with. */
export function decryptSecret(payload: string): string {
  const key = getKey();
  const [v, ivB64, tagB64, ctB64] = payload.split('.');
  if (v !== 'v1' || !ivB64 || !tagB64 || !ctB64)
    throw new Error('Malformed ciphertext.');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivB64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** Safe masked preview for the UI, e.g. "sk-ant…AB12". Never reveals the key. */
export function maskKey(key: string): string {
  const k = key.trim();
  return k.length <= 8 ? '••••' : `${k.slice(0, 6)}…${k.slice(-4)}`;
}
