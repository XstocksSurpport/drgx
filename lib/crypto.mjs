import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGO = 'aes-256-gcm';

function vaultKey() {
  const secret = process.env.DRGX_VAULT_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('DRGX_VAULT_KEY is not configured');
  }
  return scryptSync(secret, 'antpool-vault', 32);
}

export function encryptSecret(plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, vaultKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decryptSecret(payload) {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('invalid payload');
  const decipher = createDecipheriv(ALGO, vaultKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

export function hashToken(token) {
  return scryptSync(token, 'antpool-token', 32).toString('hex');
}

export function newToken() {
  return randomBytes(32).toString('hex');
}
