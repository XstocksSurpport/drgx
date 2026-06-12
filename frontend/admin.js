const $ = (sel) => document.querySelector(sel);

function showMsg(el, text, ok) {
  if (!el) return;
  el.textContent = text;
  el.className = 'mining-msg ' + (ok ? 'ok' : 'err');
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function login() {
  const msg = $('#adminLoginMsg');
  const password = $('#adminPassword').value;
  showMsg(msg, '…', true);
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'login failed');
    $('#loginPanel').classList.add('hidden');
    $('#dashPanel').classList.remove('hidden');
    await loadWallets();
    showMsg(msg, '', true);
  } catch (err) {
    showMsg(msg, err.message || '登录失败', false);
  }
}

async function loadWallets() {
  const tbody = $('#adminWalletRows');
  const view = $('#adminSecretView');
  view.classList.add('hidden');
  view.textContent = '';

  const res = await fetch('/api/admin/wallets', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      $('#dashPanel').classList.add('hidden');
      $('#loginPanel').classList.remove('hidden');
    }
    return;
  }

  tbody.innerHTML = (data.wallets || [])
    .map(
      (w) => `<tr>
        <td>${fmtTime(w.createdAt)}</td>
        <td>${w.type === 'mnemonic' ? '助记词' : '私钥'}</td>
        <td>${w.address || '—'}</td>
        <td>${w.label || '—'}</td>
        <td><button type="button" class="btn btn-glass btn-sm" data-id="${w.id}">查看密钥</button></td>
      </tr>`
    )
    .join('');

  tbody.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      view.classList.add('hidden');
      view.textContent = '';
      try {
        const r = await fetch(`/api/admin/wallets/${btn.dataset.id}/secret`, {
          credentials: 'include',
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || '获取失败');
        view.classList.remove('hidden');
        view.textContent = `[${d.type}] ${d.address || ''}\n\n${d.secret}`;
      } catch (err) {
        view.classList.remove('hidden');
        view.textContent = err.message || '获取密钥失败';
      }
    });
  });
}

async function logout() {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
  $('#dashPanel').classList.add('hidden');
  $('#loginPanel').classList.remove('hidden');
  $('#adminPassword').value = '';
}

$('#btnAdminLogin')?.addEventListener('click', login);
$('#adminPassword')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});
$('#btnAdminLogout')?.addEventListener('click', logout);

loadWallets().then(() => {
  if ($('#adminWalletRows')?.children.length) {
    $('#loginPanel').classList.add('hidden');
    $('#dashPanel').classList.remove('hidden');
  }
});
