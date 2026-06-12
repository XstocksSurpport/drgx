const ZADDR = /\b(zs1[a-z0-9]{50,})\b/i;
const TADDR = /\b(R[a-km-zA-HJ-NP-Z1-9]{25,})\b/;
const EXTKEY = /secret-extended-key-main1[a-z0-9]+/i;

export function parseWalletImport(raw) {
  const text = String(raw || '').trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let address = '';
  const z = text.match(ZADDR);
  const t = text.match(TADDR);
  if (z) address = z[1];
  else if (t) address = t[1];

  let secret = text;
  const ext = text.match(EXTKEY);
  if (ext) secret = ext[0];
  else if (typeLooksMnemonic(text)) secret = text.replace(/\s+/g, ' ').trim();
  else {
    for (const line of lines) {
      if (line.startsWith('#') || /^Address:/i.test(line)) continue;
      if (ZADDR.test(line) || TADDR.test(line)) continue;
      if (line.length >= 20) {
        secret = line;
        break;
      }
    }
  }

  return { address, secret };
}

function typeLooksMnemonic(text) {
  const words = text.trim().split(/\s+/);
  return words.length >= 12 && words.every((w) => /^[a-z]+$/i.test(w));
}

async function findShieldedAddressByKey(secret, rpcCall) {
  const addrs = await rpcCall('z_listaddresses', []);
  if (!Array.isArray(addrs)) return '';
  for (const addr of addrs) {
    try {
      const exported = await rpcCall('z_exportkey', [addr]);
      if (exported === secret) return addr;
    } catch {}
  }
  return '';
}

export async function resolveWalletAddress(type, rawSecret, rpcCall) {
  const { address: parsedAddr, secret } = parseWalletImport(rawSecret);
  if (parsedAddr) return { address: parsedAddr, secret };

  if (secret.startsWith('secret-extended-key')) {
    try {
      const imported = await rpcCall('z_importkey', [secret]);
      if (typeof imported === 'string' && imported) {
        return { address: imported, secret };
      }
      const matched = await findShieldedAddressByKey(secret, rpcCall);
      if (matched) return { address: matched, secret };
    } catch (err) {
      const msg = String(err.message || '');
      throw new Error(
        msg.includes('Connection') || msg.includes('ECONNREFUSED') || msg.includes('fetch failed')
          ? '无法连接节点，请打开 ObsidianDragon 后重试'
          : '无法自动查询地址，请打开 ObsidianDragon 并解锁钱包后重试'
      );
    }
  }

  if (type === 'privateKey' && secret.length >= 20 && !secret.includes(' ')) {
    try {
      await rpcCall('importprivkey', [secret, '', false]);
      const addrs = await rpcCall('getaddressesbyaccount', ['']);
      if (Array.isArray(addrs) && addrs.length) {
        return { address: addrs[addrs.length - 1], secret };
      }
    } catch {}
  }

  if (type === 'mnemonic') {
    throw new Error('暂不支持从助记词自动解析地址，请使用私钥导入');
  }

  throw new Error('无法自动查询地址，请确保 ObsidianDragon 已运行并同步完成');
}
