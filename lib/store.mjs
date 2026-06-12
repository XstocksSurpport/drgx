import { randomUUID } from 'node:crypto';
import { readVault, writeVault } from './vault-storage.mjs';

export async function addWallet({ type, secretEnc, address, label }) {
  const vault = await readVault();
  const wallet = {
    id: randomUUID(),
    type,
    secretEnc,
    address: address || '',
    label: label || '',
    createdAt: new Date().toISOString(),
  };
  vault.wallets.push(wallet);
  await writeVault(vault);
  return wallet;
}

export async function updateWallet(id, patch) {
  const vault = await readVault();
  const wallet = vault.wallets.find((w) => w.id === id);
  if (!wallet) return null;
  Object.assign(wallet, patch);
  await writeVault(vault);
  return wallet;
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
