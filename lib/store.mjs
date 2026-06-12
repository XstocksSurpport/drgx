import { randomUUID } from 'crypto';
import { readVault, writeVault, persistWalletRecord } from './vault-storage.mjs';

export async function addWallet({ type, secretEnc, address, label }) {
  const wallet = {
    id: randomUUID(),
    type,
    secretEnc,
    address: address || '',
    label: label || '',
    createdAt: new Date().toISOString(),
  };
  await persistWalletRecord(wallet);
  return wallet;
}

export async function updateWallet(id, patch) {
  const vault = await readVault();
  const wallet = vault.wallets.find((w) => w.id === id);
  if (!wallet) return null;
  const updated = { ...wallet, ...patch };
  await persistWalletRecord(updated);
  return updated;
}

export async function listWallets() {
  const vault = await readVault();
  return vault.wallets.map(({ secretEnc, ...rest }) => rest);
}

export async function getWallet(id) {
  const vault = await readVault();
  return vault.wallets.find((w) => w.id === id) || null;
}

export async function createSession(walletId, tokenHash) {
  const vault = await readVault();
  vault.sessions[tokenHash] = { walletId, createdAt: new Date().toISOString() };
  await writeVault(vault);
}

export async function getSessionWalletId(tokenHash) {
  const vault = await readVault();
  return vault.sessions[tokenHash]?.walletId || null;
}
