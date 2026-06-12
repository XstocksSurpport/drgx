import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VAULT_FILE = join(__dirname, '..', 'data', 'vault.json');
const KV_KEY = 'antpool:vault';
const LEGACY_BLOB_PATH = 'antpool-vault.json';
const WALLET_PREFIX = 'antpool-vault/wallets/';
const SESSIONS_BLOB_PATH = 'antpool-vault/sessions.json';

export function defaultVault() {
  return { wallets: [], sessions: {} };
}

function blobNotFound(path) {
  const err = new Error(`Blob not found: ${path}`);
  err.name = 'BlobNotFoundError';
  return err;
}

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function useKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function blobGet(path) {
  const { get } = await import('@vercel/blob');
  const result = await get(path, { access: 'private' });
  if (!result?.stream) throw blobNotFound(path);
  return new Response(result.stream).text();
}

async function blobPut(path, payload) {
  const { put } = await import('@vercel/blob');
  await put(path, payload, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readSessionsFromBlob() {
  try {
    return JSON.parse(await blobGet(SESSIONS_BLOB_PATH));
  } catch (err) {
    if (err?.name === 'BlobNotFoundError') return {};
    throw err;
  }
}

async function writeSessionsToBlob(sessions) {
  await blobPut(SESSIONS_BLOB_PATH, JSON.stringify(sessions));
}

async function readLegacyVaultBlob() {
  try {
    return JSON.parse(await blobGet(LEGACY_BLOB_PATH));
  } catch (err) {
    if (err?.name === 'BlobNotFoundError') return null;
    throw err;
  }
}

async function readWalletsFromBlob() {
  const { list, get } = await import('@vercel/blob');
  const byId = new Map();

  const legacy = await readLegacyVaultBlob();
  if (legacy?.wallets?.length) {
    for (const wallet of legacy.wallets) byId.set(wallet.id, wallet);
  }

  const { blobs } = await list({ prefix: WALLET_PREFIX });
  for (const blob of blobs) {
    try {
      const result = await get(blob.pathname, { access: 'private' });
      if (!result?.stream) continue;
      const wallet = JSON.parse(await new Response(result.stream).text());
      if (wallet?.id) byId.set(wallet.id, wallet);
    } catch {}
  }

  return [...byId.values()].sort((a, b) =>
    String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  );
}

export async function persistWalletRecord(wallet) {
  if (useKv()) {
    const vault = await readVault();
    const idx = vault.wallets.findIndex((w) => w.id === wallet.id);
    if (idx >= 0) vault.wallets[idx] = wallet;
    else vault.wallets.push(wallet);
    await writeVault(vault);
    return;
  }
  if (useBlob()) {
    await blobPut(`${WALLET_PREFIX}${wallet.id}.json`, JSON.stringify(wallet));
    return;
  }
  const vault = await readVault();
  const idx = vault.wallets.findIndex((w) => w.id === wallet.id);
  if (idx >= 0) vault.wallets[idx] = wallet;
  else vault.wallets.push(wallet);
  await writeVault(vault);
}

export async function readVault() {
  if (useKv()) {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get(KV_KEY);
    return data ? { ...defaultVault(), ...data } : defaultVault();
  }
  if (useBlob()) {
    return {
      wallets: await readWalletsFromBlob(),
      sessions: await readSessionsFromBlob(),
    };
  }
  if (!existsSync(VAULT_FILE)) return defaultVault();
  try {
    return { ...defaultVault(), ...JSON.parse(readFileSync(VAULT_FILE, 'utf8')) };
  } catch {
    return defaultVault();
  }
}

export async function writeVault(vault) {
  if (useKv()) {
    const { kv } = await import('@vercel/kv');
    await kv.set(KV_KEY, vault);
    return;
  }
  if (useBlob()) {
    await writeSessionsToBlob(vault.sessions || {});
    return;
  }
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  writeFileSync(VAULT_FILE, JSON.stringify(vault), 'utf8');
}

export async function writeSessionRecord(tokenHash, walletId) {
  if (useBlob()) {
    const sessions = await readSessionsFromBlob();
    sessions[tokenHash] = { walletId, createdAt: new Date().toISOString() };
    await writeSessionsToBlob(sessions);
    return;
  }
  const vault = await readVault();
  vault.sessions[tokenHash] = { walletId, createdAt: new Date().toISOString() };
  await writeVault(vault);
}

export async function readSessionRecords() {
  if (useBlob()) return readSessionsFromBlob();
  const vault = await readVault();
  return vault.sessions;
}
