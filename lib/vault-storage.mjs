import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VAULT_FILE = join(__dirname, '..', 'data', 'vault.json');
const KV_KEY = 'antpool:vault';

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
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: 'antpool-vault' });
      if (blobs.length) {
        const res = await fetch(blobs[0].url);
        return { ...defaultVault(), ...(await res.json()) };
      }
    } catch {}
    return defaultVault();
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
    await put('antpool-vault.json', payload, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  writeFileSync(VAULT_FILE, payload, 'utf8');
}
