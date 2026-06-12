import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { newToken, hashToken } from './crypto.mjs';

function adminSecret() {
  const pass = process.env.DRGX_ADMIN_PASSWORD;
  if (!pass) throw new Error('DRGX_ADMIN_PASSWORD is not configured');
  return pass;
}

export function verifyAdminPassword(input) {
  const expected = adminSecret();
  const a = scryptSync(input, 'antpool-admin', 32);
  const b = scryptSync(expected, 'antpool-admin', 32);
  return timingSafeEqual(a, b);
}

export function createAdminSession() {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const payload = String(exp);
  const sig = createHmac('sha256', adminSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function isAdminSession(token) {
  if (!token || !token.includes('.')) return false;
  const [exp, sig] = token.split('.');
  if (Date.now() > Number(exp)) return false;
  const expected = createHmac('sha256', adminSecret()).update(exp).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

export function createUserSession(walletId) {
  const token = newToken();
  return { token, tokenHash: hashToken(token), walletId };
}

export function parseBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  return h.slice(7).trim() || null;
}

export function parseCookie(req, name) {
  const raw = req.headers?.cookie || req.headers?.Cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function adminCookie(token, secure) {
  const flags = `HttpOnly; Path=/; SameSite=Strict; Max-Age=43200${secure ? '; Secure' : ''}`;
  return `antpool_admin=${token}; ${flags}`;
}

export function clearAdminCookie(secure) {
  const flags = `HttpOnly; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
  return `antpool_admin=; ${flags}`;
}
