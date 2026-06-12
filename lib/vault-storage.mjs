import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VAULT_FILE = join(__dirname, '..', 'data', 'vault.json');
const KV_KEY = 'antpool:vault';
const VAULT_BLOB_PATH = 'antpool-vault.json';

export function defaultVault() {
  return { wallets: [], sessions: {} };
}

export async function readVault() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get(KV_KEY);
    return data ? { ...defaultVault(), ...data } : defaultVault();
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { get } = await import('@vercel/blob');
      const { stream } = await get(VAULT_BLOB_PATH, { access: 'private' });
      const text = await new Response(stream).text();
      return { ...defaultVault(), ...JSON.parse(text) };
    } catch (err) {
      if (err?.name === 'BlobNotFoundError') return defaultVault();
      return defaultVault();
    }
  }
  if (!existsSync(VAULT_FILE)) return defaultVault();
  try {
    return { ...defaultVault(), ...JSON.parse(readFileSync(VAULT_FILE, 'utf8')) };
  } catch {
    return defaultVault();
  }
}

export async function writeVault(vault) {
  const payload = JSON.stringify(vault);
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import('@vercel/kv');
    await kv.set(KV_KEY, vault);
    return;
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    await put(VAULT_BLOB_PATH, payload, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  writeFileSync(VAULT_FILE, payload, 'utf8');
}
