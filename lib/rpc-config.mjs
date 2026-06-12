import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

function parseConf(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function readDragonConf() {
  const paths = [
    join(process.env.APPDATA || '', 'Hush', 'DRAGONX', 'DRAGONX.conf'),
    join(process.env.APPDATA || '', 'hush', 'DRAGONX', 'DRAGONX.conf'),
    join(homedir(), '.hush', 'DRAGONX', 'DRAGONX.conf'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      return parseConf(readFileSync(p, 'utf8'));
    } catch {}
  }
  return {};
}

export function getRpcConfig() {
  const conf = readDragonConf();
  return {
    host: process.env.DRGX_RPC_HOST || conf.rpcconnect?.split(':')[0] || '127.0.0.1',
    port: Number(process.env.DRGX_RPC_PORT || conf.rpcport || 21769),
    user: process.env.DRGX_RPC_USER || conf.rpcuser || '',
    pass: process.env.DRGX_RPC_PASS || conf.rpcpassword || '',
  };
}
