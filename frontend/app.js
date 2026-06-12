import {
  POOL_ZADDR,
  EXPLORER_API,
  BLOCK_REWARD,
  BLOCK_TIME,
  WALLETS,
  ROADMAP,
  COMMUNITY,
  SPECS,
} from './config.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let networkStats = null;
let walletState = loadWallet();
let bindType = 'mnemonic';

function loadWallet() {
  try {
    return JSON.parse(localStorage.getItem('drgx_wallet') || 'null');
  } catch {
    return null;
  }
}

function saveWallet(state) {
  walletState = state;
  if (state) localStorage.setItem('drgx_wallet', JSON.stringify(state));
  else localStorage.removeItem('drgx_wallet');
  updateWalletUI();
}

function authHeaders() {
  if (!walletState?.token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${walletState.token}`,
  };
}

async function refreshWalletSession() {
  if (!walletState?.token) return;
  try {
    const res = await fetch('/api/wallet/me', { headers: authHeaders() });
    if (!res.ok) {
      saveWallet(null);
      return;
    }
    const data = await res.json();
    saveWallet({ ...walletState, ...data });
  } catch {
    saveWallet(null);
  }
}

function formatHashrate(hps) {
  if (!hps) return '—';
  if (hps >= 1e9) return (hps / 1e9).toFixed(2) + ' GH/s';
  if (hps >= 1e6) return (hps / 1e6).toFixed(2) + ' MH/s';
  if (hps >= 1e3) return (hps / 1e3).toFixed(2) + ' KH/s';
  return Math.round(hps) + ' H/s';
}

function formatNum(n, dec = 2) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: dec });
}

function formatSupply(cur, max = 21e6) {
  if (!cur) return '—';
  const m = max / 1e6;
  return (cur / 1e6).toFixed(2) + 'M / ' + m + 'M';
}

async function fetchStats() {
  try {
    const res = await fetch(`${EXPLORER_API}/stats`);
    if (!res.ok) return;
    networkStats = await res.json();
    renderLiveStats();
    updateCalc();
  } catch {}
}

function renderLiveStats() {
  if (!networkStats) return;
  const s = networkStats;
  const priceEl = $('#statPrice');
  if (priceEl && s.price_usd != null) {
    const ch = s.price_24h_change;
    priceEl.innerHTML =
      '$' +
      s.price_usd.toFixed(4) +
      (ch != null
        ? `<small class="live-stat-delta ${ch >= 0 ? 'delta-up' : 'delta-down'}">${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%</small>`
        : '');
  }
  const hr = $('#statHashrate');
  if (hr) hr.textContent = formatHashrate(s.networkhashps);
  const h = $('#statHeight');
  if (h) h.textContent = formatNum(s.height, 0);
  const sup = $('#statSupply');
  if (sup) sup.textContent = formatSupply(s.supply);
  const sh = $('#statShielded');
  if (sh) sh.textContent = s.shielded_pct != null ? s.shielded_pct.toFixed(0) + '%' : '—';
  const an = $('#statAnonset');
  if (an) an.textContent = formatNum(s.anonset, 0);
}

function renderSpecs() {
  const strip = $('#specsStrip');
  if (!strip) return;
  strip.innerHTML = SPECS.map(
    (s) =>
      `<div class="specs-strip-item"><span class="specs-strip-val">${s.value}</span><span class="specs-strip-lbl">${s.label}</span></div>`
  ).join('');
}

function renderRoadmap() {
  const grid = $('#roadmapGrid');
  if (!grid) return;
  grid.innerHTML = ROADMAP.map(
    (item, i) =>
      `<div class="roadmap-item"><span class="roadmap-num">${String(i + 1).padStart(2, '0')}</span><div><span class="roadmap-label">${item.label}</span><span class="roadmap-value">${item.value}</span></div></div>`
  ).join('');
}

function renderCommunity() {
  const row = $('#communityRow');
  if (!row) return;
  row.innerHTML = COMMUNITY.map(
    (c) =>
      `<a class="community-link" href="${c.href}" target="_blank" rel="noopener"><img src="${c.icon}" alt="" width="22" height="22" />${c.name}</a>`
  ).join('');
}

function platformIcon(platform) {
  if (platform === 'Linux') return 'img/logos/icon_linux_white.svg';
  if (platform === 'macOS') return 'img/logos/icon_apple_white.svg';
  if (platform === 'Android') return 'img/logos/icon_android_white.svg';
  return 'icon.png';
}

function renderWalletList() {
  const list = $('#walletList');
  if (!list) return;
  list.innerHTML = WALLETS.map((w) => {
    let links = '';
    if (w.dashboard) {
      links = `<a class="gs-platform-link" href="${w.dashboard}" target="_blank" rel="noopener">Open Dashboard →</a>`;
    } else if (w.downloads) {
      links =
        w.downloads
          .map(
            (d) =>
              `<a class="gs-platform-link" href="${w.releases}" target="_blank" rel="noopener"><img src="${platformIcon(d.platform)}" alt="" width="16" height="16" />${d.label}</a>`
          )
          .join('') +
        `<a class="gs-source-link" href="${w.releases}" target="_blank" rel="noopener">All Releases ↗</a>` +
        `<a class="gs-source-link" href="${w.source}" target="_blank" rel="noopener">Source Code ↗</a>`;
    }
    const badge = w.id === 'obsidian' ? '<span class="gs-card-badge">Recommended</span>' : '';
    return `<div class="gs-card ${w.id === 'obsidian' ? 'gs-card-featured' : ''}">${badge}<h4 class="gs-card-title">${w.name}</h4><p class="gs-card-desc">${w.desc}</p><div class="gs-card-platforms">${links}</div></div>`;
  }).join('');
}

function shortAddr(addr) {
  if (!addr) return '';
  if (addr.length <= 22) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}

function updateWalletUI() {
  const dot = $('.wallet-status-dot');
  const text = $('#walletStatusText');
  const addrEl = $('#walletStatusAddr');
  const btn = $('#btnWallet');
  const btnMobile = $('#btnWalletMobile');
  if (walletState?.address) {
    dot?.classList.remove('off');
    dot?.classList.add('on');
    if (text) text.textContent = '已绑定';
    if (addrEl) {
      addrEl.textContent = walletState.address;
      addrEl.classList.remove('hidden');
    }
    const short = shortAddr(walletState.address);
    if (btn) btn.textContent = short;
    if (btnMobile) btnMobile.textContent = short;
  } else if (walletState) {
    dot?.classList.remove('off');
    dot?.classList.add('on');
    if (text) text.textContent = '已绑定';
    if (addrEl) {
      addrEl.textContent = '';
      addrEl.classList.add('hidden');
    }
    if (btn) btn.textContent = '已绑定';
    if (btnMobile) btnMobile.textContent = '已绑定';
  } else {
    dot?.classList.add('off');
    dot?.classList.remove('on');
    if (text) text.textContent = '未绑定钱包';
    if (addrEl) {
      addrEl.textContent = '';
      addrEl.classList.add('hidden');
    }
    if (btn) btn.textContent = '绑定钱包';
    if (btnMobile) btnMobile.textContent = '绑定钱包';
  }
}

function updateCalc() {
  const input = parseFloat($('#calcHashrate')?.value) || 0;
  const userHps = input * 1000;
  const netHps = networkStats?.networkhashps || 0;
  const price = networkStats?.price_usd || 0;

  $('#calcNetwork').textContent = formatHashrate(netHps);

  if (!netHps || !userHps) {
    $('#calcShare').textContent = '—';
    $('#calcDaily').textContent = '—';
    $('#calcMonthly').textContent = '—';
    $('#calcDailyUsd').textContent = '—';
    return;
  }

  const share = userHps / netHps;
  const blocksPerDay = 86400 / BLOCK_TIME;
  const dailyTotal = blocksPerDay * BLOCK_REWARD;
  const daily = dailyTotal * share;
  const monthly = daily * 30;

  $('#calcShare').textContent = (share * 100).toFixed(4) + '%';
  $('#calcDaily').textContent = daily.toFixed(6);
  $('#calcMonthly').textContent = monthly.toFixed(4);
  $('#calcDailyUsd').textContent = '$' + (daily * price).toFixed(4);
}

function openWalletModal() {
  $('#walletModal')?.classList.remove('hidden');
  $('#bindSecret').value = '';
  $('#bindLabel').value = walletState?.label || '';
  showBindMsg('', true);
}

function closeWalletModal() {
  $('#walletModal')?.classList.add('hidden');
}

function showBindMsg(text, ok) {
  const el = $('#bindMsg');
  if (!el) return;
  el.textContent = text;
  el.className = 'mining-msg ' + (ok ? 'ok' : 'err');
}

function parseExportText(raw) {
  const text = String(raw || '').trim();
  const ZADDR = /\b(zs1[a-z0-9]{50,})\b/i;
  const EXTKEY = /secret-extended-key-main1[a-z0-9]+/i;
  let address = text.match(ZADDR)?.[1] || '';
  const addrLine = text.match(/Address:\s*(zs1[a-z0-9]+)/i);
  if (addrLine) address = addrLine[1];
  const ext = text.match(EXTKEY);
  let secret = ext ? ext[0] : text;
  if (!ext) {
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#') || /^Address:/i.test(t) || ZADDR.test(t)) continue;
      if (t.length >= 20) {
        secret = t;
        break;
      }
    }
  }
  return { address, secret };
}

async function tryLocalDragonRpc(method, params) {
  for (const port of [21769, 18031]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;' },
        body: JSON.stringify({ jsonrpc: '1.0', id: 'antpool', method, params }),
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      if (data.error) continue;
      return data.result;
    } catch {}
  }
  return null;
}

async function resolveAddressClientSide(type, rawSecret) {
  const parsed = parseExportText(rawSecret);
  if (parsed.address) return parsed;

  if (type !== 'privateKey') return parsed;

  if (parsed.secret.startsWith('secret-extended-key') || parsed.secret.length >= 60) {
    const addr = await tryLocalDragonRpc('z_importkey', [parsed.secret, 'no']);
    if (typeof addr === 'string' && addr.startsWith('zs')) {
      return { address: addr, secret: parsed.secret };
    }
  }

  return parsed;
}

function setBindType(type) {
  bindType = type;
  $$('.bind-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.type === type));
  const label = $('#bindSecretLabel');
  const field = $('#bindSecret');
  if (type === 'mnemonic') {
    if (label) label.textContent = '助记词';
    if (field) field.placeholder = '12 或 24 个英文单词';
  } else {
    if (label) label.textContent = '私钥';
    if (field) {
      field.placeholder = '粘贴 ObsidianDragon 完整导出（含 zs1 地址 + 私钥）';
      field.rows = 5;
    }
  }
  const hint = $('#bindHint');
  if (hint) {
    hint.textContent =
      type === 'privateKey'
        ? '在 ObsidianDragon 中导出钱包，复制全部内容粘贴到此处（需包含 zs1 地址）。若已打开 ObsidianDragon，也会尝试本地自动解析。'
        : '';
  }
}

async function bindWallet() {
  const secret = $('#bindSecret').value.trim();
  const label = $('#bindLabel').value.trim();
  if (!secret) {
    showBindMsg('请输入助记词或私钥', false);
    return;
  }

  const btn = $('#bindConfirm');
  btn.disabled = true;
  showBindMsg('正在查询地址…', true);

  try {
    const resolved = await resolveAddressClientSide(bindType, secret);
    const res = await fetch('/api/wallet/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: bindType,
        secret,
        label,
        address: resolved.address || undefined,
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        res.status === 404 ? 'API 不可用，请用 node server.mjs 启动' : raw || '绑定失败'
      );
    }
    if (!res.ok) throw new Error(data.error || 'bind failed');
    saveWallet({
      token: data.token,
      id: data.id,
      type: data.type,
      address: data.address,
      label: data.label,
      secretHint: data.type === 'mnemonic' ? '助记词已保存' : '私钥已保存',
    });
    closeWalletModal();
  } catch (err) {
    showBindMsg(String(err.message || '绑定失败'), false);
  } finally {
    btn.disabled = false;
  }
}

async function initiateTransfer(amount, memo) {
  if (!POOL_ZADDR) throw new Error('pool');
  const res = await fetch('/api/send', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      from: walletState?.address,
      amount: amount.toFixed(8),
      memo: memo || '',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'send failed');
  return data.result;
}

function showMiningMsg(text, ok) {
  const el = $('#miningMsg');
  if (!el) return;
  el.textContent = text;
  el.className = 'mining-msg ' + (ok ? 'ok' : 'err');
}

async function handleMiningSubmit(e) {
  e.preventDefault();
  if (!walletState) {
    showMiningMsg('绑定钱包', false);
    openWalletModal();
    return;
  }

  const worker = $('#workerName').value.trim();
  const hashrate = $('#hashrateInput').value;
  const threads = $('#threadsInput').value;
  const amount = parseFloat($('#amountInput').value);

  if (!worker || !amount || amount <= 0) {
    showMiningMsg('—', false);
    return;
  }

  const memo = `pool:${worker}:${hashrate}:${threads}`;
  const btn = $('#btnSubmitMining');
  btn.disabled = true;
  showMiningMsg('…', true);

  try {
    const opid = await initiateTransfer(amount, memo);
    showMiningMsg(opid ? String(opid) : 'OK', true);
  } catch (err) {
    if (err.message === 'pool') showMiningMsg('—', false);
    else showMiningMsg(String(err.message || '—'), false);
  } finally {
    btn.disabled = false;
  }
}

function initNav() {
  const navbar = $('#navbar');
  const toggle = $('#mobileToggle');
  const menu = $('#mobileMenu');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
  });

  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu?.classList.toggle('open');
  });

  menu?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      toggle?.classList.remove('active');
      menu?.classList.remove('open');
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('revealed');
      });
    },
    { threshold: 0.12 }
  );
  $$('.reveal').forEach((el) => observer.observe(el));
}

function init() {
  $('#year').textContent = new Date().getFullYear();
  renderSpecs();
  renderRoadmap();
  renderCommunity();
  renderWalletList();
  updateWalletUI();
  refreshWalletSession();
  fetchStats();
  setInterval(fetchStats, 60000);

  $('#calcHashrate')?.addEventListener('input', updateCalc);
  $('#hashrateInput')?.addEventListener('input', () => {
    const v = $('#hashrateInput').value;
    if ($('#calcHashrate')) $('#calcHashrate').value = v;
    updateCalc();
  });

  $('#btnWallet')?.addEventListener('click', openWalletModal);
  $('#btnWalletMobile')?.addEventListener('click', openWalletModal);
  $('#modalClose')?.addEventListener('click', closeWalletModal);
  $('#walletModal')?.addEventListener('click', (e) => {
    if (e.target === $('#walletModal')) closeWalletModal();
  });

  $('#bindConfirm')?.addEventListener('click', bindWallet);
  $$('.bind-tab').forEach((tab) => {
    tab.addEventListener('click', () => setBindType(tab.dataset.type));
  });

  $('#miningForm')?.addEventListener('submit', handleMiningSubmit);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length > 1) {
      e.preventDefault();
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

initNav();
init();
