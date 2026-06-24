// app.js — Inbox Cleaner Web App
// All logic runs in the browser; no backend required.

// ── Config ────────────────────────────────────────────────────────────────────
// Replace with your Web Application OAuth 2.0 client_id from Google Cloud Console.
// (APIs & Services → Credentials → OAuth 2.0 Client IDs → Web application)
const CLIENT_ID   = '122732831058-4akm53dm4f32upmuc744cvtk28q80m6r.apps.googleusercontent.com';
const SCOPES      = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify';
const GMAIL_BASE  = 'https://gmail.googleapis.com/gmail/v1';
const BATCH_URL   = 'https://www.googleapis.com/batch/gmail/v1';
const STORAGE_KEY = 'inboxCleanerData';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── OAuth state ────────────────────────────────────────────────────────────────
let tokenClient;
let accessToken   = null;
let tokenExpiry   = 0;
let pendingResolve = null;

function initGIS() {
  if (!window.google?.accounts) {
    setTimeout(initGIS, 150);
    return;
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope:     SCOPES,
    callback:  onToken,
  });
}

function onToken(resp) {
  if (resp.error) {
    if (pendingResolve) { pendingResolve(null); pendingResolve = null; }
    show('signin');
    return;
  }
  accessToken  = resp.access_token;
  tokenExpiry  = Date.now() + (resp.expires_in - 60) * 1000;
  if (pendingResolve) { pendingResolve(accessToken); pendingResolve = null; }
}

function getToken() {
  return new Promise(resolve => {
    if (accessToken && Date.now() < tokenExpiry) { resolve(accessToken); return; }
    pendingResolve = resolve;
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

function signOut() {
  if (accessToken) google.accounts.oauth2.revoke(accessToken, () => {});
  accessToken = null;
  tokenExpiry = 0;
  localStorage.removeItem(STORAGE_KEY);
  allSenders = [];
  selected.clear();
  show('signin');
}

// ── UI state ───────────────────────────────────────────────────────────────────
let allSenders = [];
let filtered   = [];
let selected   = new Set();
let sortBy     = 'count';
let activeCategory = '';
let query      = '';

const $ = id => document.getElementById(id);

function show(name) {
  const isSignedIn = name === 'app' || name === 'deleting';
  $('section-hero').classList.toggle('hidden', isSignedIn);
  $('tool-signin-state').classList.toggle('hidden', isSignedIn);
  $('tool-results-state').classList.toggle('hidden', !isSignedIn);
  $('screen-deleting').classList.toggle('hidden', name !== 'deleting');
  $('nav-cta').classList.toggle('hidden', isSignedIn);
  $('nav-user').classList.toggle('hidden', !isSignedIn);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  initGIS();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const cache = JSON.parse(raw);
      if (cache.senders?.length) {
        loadCache(cache);
        show('app');
        return;
      }
    } catch {}
  }
  show('signin');
});

function handleSignIn() {
  if (!tokenClient) { toast('Google auth library still loading — try again in a second', 'error'); return; }
  pendingResolve = token => {
    pendingResolve = null;
    if (!token) { toast('Sign-in failed or cancelled', 'error'); return; }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const cache = JSON.parse(raw);
        if (cache.senders?.length) { loadCache(cache); show('app'); return; }
      } catch {}
    }
    show('app');
    startScan();
  };
  tokenClient.requestAccessToken({ prompt: 'consent' });
}
document.querySelectorAll('.btn-signin').forEach(btn => btn.addEventListener('click', handleSignIn));

$('btn-signout').addEventListener('click', signOut);
$('btn-refresh').addEventListener('click', () => { selected.clear(); updateActionBar(); startScan(); });

// ── Cache ─────────────────────────────────────────────────────────────────────
function loadCache(cache) {
  allSenders = cache.senders || [];
  updateHeader(cache.total, cache.scannedAt);
  applyFilter();
}

function updateHeader(total, scannedAt) {
  const t  = total || allSenders.reduce((s, r) => s + r.count, 0);
  const ts = scannedAt ? ' · ' + ago(scannedAt) : '';
  $('header-stats').textContent = `${n(t)} emails · ${n(allSenders.length)} senders${ts}`;
}

// ── API helpers ────────────────────────────────────────────────────────────────
async function gGet(token, path, params = {}) {
  const url = new URL(`${GMAIL_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) { accessToken = null; throw Object.assign(new Error('auth'), { code: 401 }); }
  if (r.status === 403 || r.status === 429) {
    let reason = '';
    try { const j = await r.clone().json(); reason = j?.error?.errors?.[0]?.reason || ''; } catch {}
    if (reason === 'insufficientPermissions' || reason === 'forbidden')
      throw Object.assign(new Error('Insufficient permissions — please sign in again'), { code: 403 });
    throw Object.assign(new Error('rate'), { code: 429 });
  }
  if (!r.ok) throw new Error(`http:${r.status}`);
  return r.json();
}

async function gPost(token, path, body) {
  const r = await fetch(`${GMAIL_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (r.status === 401) { accessToken = null; throw Object.assign(new Error('auth'), { code: 401 }); }
  if (r.status === 403 || r.status === 429) {
    let reason = '';
    try { const j = await r.clone().json(); reason = j?.error?.errors?.[0]?.reason || ''; } catch {}
    if (reason === 'insufficientPermissions' || reason === 'forbidden')
      throw Object.assign(new Error('Insufficient permissions — please sign in again'), { code: 403 });
    throw Object.assign(new Error('rate'), { code: 429 });
  }
  if (!r.ok) throw new Error(`http:${r.status}`);
  return r.status === 204 ? null : r.json();
}

async function backoff(fn, tries = 8) {
  let delay = 2000;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      if (e.code === 429 && i < tries - 1) { await sleep(delay); delay = Math.min(delay * 2, 60000); }
      else throw e;
    }
  }
}

// ── Multipart batch fetch ──────────────────────────────────────────────────────
function parseFrom(raw = '') {
  const m = raw.match(/"?([^"<]+?)"?\s*<([^>]+)>/);
  if (m) return [m[1].trim(), m[2].trim().toLowerCase()];
  return [raw.trim(), raw.trim().toLowerCase()];
}

function parseMultipart(text, boundary) {
  const results = [];
  for (const part of text.split(`--${boundary}`)) {
    const jStart = part.indexOf('{');
    if (jStart === -1) continue;
    let depth = 0, jEnd = -1;
    for (let i = jStart; i < part.length; i++) {
      if (part[i] === '{') depth++;
      else if (part[i] === '}' && --depth === 0) { jEnd = i; break; }
    }
    if (jEnd === -1) continue;
    try { results.push(JSON.parse(part.slice(jStart, jEnd + 1))); } catch {}
  }
  return results;
}

async function batchTrash(token, ids) {
  const bnd  = 'ic_t_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const body = ids.map(id =>
    `--${bnd}\r\nContent-Type: application/http\r\n\r\n` +
    `POST /gmail/v1/users/me/messages/${id}/trash HTTP/1.1\r\n\r\n`
  ).join('') + `--${bnd}--`;
  const r = await fetch(BATCH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/mixed; boundary=${bnd}` },
    body,
  });
  if (r.status === 403 || r.status === 429) throw Object.assign(new Error('rate'), { code: 429 });
  if (!r.ok) throw new Error(`batch:${r.status}`);
}

async function batchHeaders(token, ids) {
  const bnd  = 'ic_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const body = ids.map(id =>
    `--${bnd}\r\nContent-Type: application/http\r\n\r\n` +
    `GET /gmail/v1/users/me/messages/${id}?format=metadata` +
    `&metadataHeaders=From&metadataHeaders=Date&fields=payload%2Fheaders%2ClabelIds HTTP/1.1\r\n\r\n`
  ).join('') + `--${bnd}--`;

  const r = await fetch(BATCH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/mixed; boundary=${bnd}` },
    body,
  });
  if (r.status === 429 || r.status === 403) throw Object.assign(new Error('rate'), { code: 429 });
  if (!r.ok) throw new Error(`batch:${r.status}`);
  const text = await r.text();
  const m    = (r.headers.get('Content-Type') || '').match(/boundary="?([^";]+)"?/);
  return parseMultipart(text, m ? m[1] : bnd);
}

// ── Scan ──────────────────────────────────────────────────────────────────────
function showProgress(visible) { $('scan-progress').classList.toggle('hidden', !visible); }
function setProgress(pct, text) {
  $('progress-fill').style.width = `${pct}%`;
  $('progress-text').textContent = text;
}

async function startScan() {
  showProgress(true);
  setProgress(2, 'Getting access token…');
  let token;
  try { token = await getToken(); } catch (e) { showProgress(false); toast('Auth failed: ' + e.message, 'error'); return; }
  if (!token) { showProgress(false); show('signin'); return; }

  try {
    setProgress(5, 'Listing messages…');

    // Pass 1 — collect all IDs
    const allIds = [];
    let pageToken = null;
    do {
      const p = { maxResults: '500', fields: 'nextPageToken,messages/id' };
      if (pageToken) p.pageToken = pageToken;
      const res = await backoff(() => gGet(token, '/users/me/messages', p));
      (res.messages || []).forEach(m => allIds.push(m.id));
      pageToken = res.nextPageToken;
      setProgress(5, `Listing messages… ${n(allIds.length)} found`);
      if (pageToken) await sleep(300);
    } while (pageToken);

    // Pass 2 — batch-fetch headers
    const senders = {};
    const CHUNK   = 100;
    for (let i = 0; i < allIds.length; i += CHUNK) {
      const pct  = 10 + (i / allIds.length) * 85;
      const msgs = await backoff(() => batchHeaders(token, allIds.slice(i, i + CHUNK)));
      for (const msg of msgs) {
        if (msg.error) continue;
        const hdrs    = msg.payload?.headers || [];
        const rawFrom = hdrs.find(h => h.name === 'From')?.value || '';
        const rawDate = hdrs.find(h => h.name === 'Date')?.value || '';
        const [name, email] = parseFrom(rawFrom);
        const cats = (msg.labelIds || []).filter(l => l.startsWith('CATEGORY_')).map(l => l.slice(9));
        if (!senders[email]) senders[email] = { name, email, count: 0, latest: 0, categories: new Set() };
        senders[email].count++;
        const ts = rawDate ? new Date(rawDate).getTime() : 0;
        if (ts > senders[email].latest) senders[email].latest = ts;
        cats.forEach(c => senders[email].categories.add(c));
      }
      setProgress(pct, `Scanning ${n(Math.min(i + CHUNK, allIds.length))} / ${n(allIds.length)} emails…`);
      await sleep(600);
    }

    const result = Object.values(senders)
      .map(s => ({ ...s, categories: [...s.categories] }))
      .sort((a, b) => b.count - a.count);

    const cache = { senders: result, scannedAt: Date.now(), total: allIds.length };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    loadCache(cache);
    showProgress(false);
    toast(`Scan complete — ${n(result.length)} senders found`);

  } catch (e) {
    showProgress(false);
    toast('Scan failed: ' + e.message, 'error');
  }
}

// ── Filter + sort ─────────────────────────────────────────────────────────────
function applyFilter() {
  const q = query.toLowerCase();
  filtered = allSenders.filter(s => {
    const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchesCat   = !activeCategory || s.categories.includes(activeCategory);
    return matchesQuery && matchesCat;
  });
  filtered.sort((a, b) => b.count - a.count);
  renderList();
}

// ── Render ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#e53935','#8e24aa','#1e88e5','#00897b','#43a047','#f4511e','#6d4c41','#546e7a','#1565c0','#ad1457'];
function avatarColor(email) {
  let h = 0;
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function chipClass(n) { return n >= 100 ? 'chip-hi' : n >= 50 ? 'chip-mid' : 'chip-lo'; }
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderList() {
  const list = $('sender-list');
  list.innerHTML = '';
  if (!filtered.length) {
    const el = document.createElement('div');
    el.className = 'list-empty';
    el.textContent = query
      ? 'No senders match your search.'
      : activeCategory
        ? `No senders in ${activeCategory.charAt(0) + activeCategory.slice(1).toLowerCase()} category.`
        : 'No emails found. Click ↺ to rescan.';
    list.appendChild(el);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const s of filtered) {
    const isSel = selected.has(s.email);
    const row   = document.createElement('div');
    row.className = 'row' + (isSel ? ' selected' : '');
    row.dataset.email = s.email;
    const badges  = s.categories.map(c => `<span class="badge badge-${esc(c)}">${esc(c)}</span>`).join('');
    const dateStr = s.latest ? `<span class="row-date">${ago(s.latest)}</span>` : '';
    const cnt     = s.count >= 1000 ? (s.count / 1000).toFixed(1) + 'k' : s.count;
    row.innerHTML = `
      <label class="row-check" title="Select">
        <input type="checkbox" ${isSel ? 'checked' : ''}>
        <span class="chk"></span>
      </label>
      <div class="row-body">
        <div class="row-name">${esc(s.name)}</div>
        <div class="row-email">${esc(s.email)}</div>
        <div class="row-meta">${badges}${dateStr}</div>
      </div>
      <div class="count-chip ${chipClass(s.count)}">${cnt}</div>`;
    const cb = row.querySelector('input[type=checkbox]');
    cb.addEventListener('change', e => { e.stopPropagation(); toggle(s.email, cb.checked, row); });
    row.addEventListener('click', e => { if (e.target === cb) return; cb.checked = !cb.checked; toggle(s.email, cb.checked, row); });
    frag.appendChild(row);
  }
  list.appendChild(frag);
}

// ── Selection ─────────────────────────────────────────────────────────────────
function toggle(email, checked, row) {
  checked ? selected.add(email) : selected.delete(email);
  row.classList.toggle('selected', checked);
  updateActionBar();
}
function clearSelection() {
  selected.clear();
  document.querySelectorAll('.row.selected').forEach(r => {
    r.classList.remove('selected');
    r.querySelector('input[type=checkbox]').checked = false;
  });
  updateActionBar();
}
function updateActionBar() {
  const bar = $('action-bar');
  if (!selected.size) { bar.classList.add('hidden'); return; }
  const totalEmails = allSenders.filter(s => selected.has(s.email)).reduce((a, s) => a + s.count, 0);
  $('action-summary').textContent = `${selected.size} sender${selected.size > 1 ? 's' : ''} · ${n(totalEmails)} emails`;
  bar.classList.remove('hidden');
}

// ── Delete flow ────────────────────────────────────────────────────────────────
function promptDelete() {
  const totalEmails = allSenders.filter(s => selected.has(s.email)).reduce((a, s) => a + s.count, 0);
  const sndr = selected.size;
  $('modal-text').textContent =
    `Move ${n(totalEmails)} email${totalEmails !== 1 ? 's' : ''} from ${sndr} sender${sndr !== 1 ? 's' : ''} to Trash? ` +
    `Gmail auto-purges Trash after 30 days, or you can empty it manually.`;
  $('modal').classList.remove('hidden');
}

async function confirmDelete() {
  $('modal').classList.add('hidden');
  const emails = [...selected];
  selected.clear();
  show('deleting');
  $('delete-text').textContent = 'Getting access token…';
  $('delete-fill').style.width = '0%';

  let token;
  try { token = await getToken(); } catch (e) { show('app'); toast('Auth failed: ' + e.message, 'error'); return; }
  if (!token) { show('app'); show('signin'); return; }

  try {
    for (let si = 0; si < emails.length; si++) {
      const email = emails[si];
      $('delete-text').textContent = `Finding emails from ${email}…`;

      // Collect IDs
      const ids = [];
      let pageToken = null;
      do {
        const p = { q: `from:${email}`, maxResults: '500', fields: 'nextPageToken,messages/id' };
        if (pageToken) p.pageToken = pageToken;
        const res = await backoff(() => gGet(token, '/users/me/messages', p));
        (res.messages || []).forEach(m => ids.push(m.id));
        pageToken = res.nextPageToken;
      } while (pageToken);

      const pct = ((si + 0.5) / emails.length * 100).toFixed(0);
      $('delete-fill').style.width = `${pct}%`;
      $('delete-text').textContent = `Deleting ${n(ids.length)} emails from ${email}… (${si + 1}/${emails.length})`;

      // Batch trash in 100-chunks
      for (let i = 0; i < ids.length; i += 100) {
        await backoff(() => batchTrash(token, ids.slice(i, i + 100)));
        if (i + 100 < ids.length) await sleep(400);
      }

      // Update cache
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const cache = JSON.parse(raw);
          cache.senders = cache.senders.filter(s => s.email !== email);
          cache.total   = Math.max(0, (cache.total || 0) - ids.length);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
          allSenders = cache.senders;
        } catch {}
      }
    }

    $('delete-fill').style.width = '100%';
    await sleep(300);
    applyFilter();
    show('app');
    toast(`Deletion complete ✓`);

  } catch (e) {
    show('app');
    applyFilter();
    toast('Deletion failed: ' + e.message, 'error');
  }
}

// ── Events ────────────────────────────────────────────────────────────────────
$('search').addEventListener('input', e => { query = e.target.value; applyFilter(); });

$('btn-delete').addEventListener('click', promptDelete);
$('btn-clear').addEventListener('click', clearSelection);
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.category;
    applyFilter();
  });
});
$('btn-cancel').addEventListener('click', () => $('modal').classList.add('hidden'));
$('btn-confirm').addEventListener('click', confirmDelete);
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').classList.add('hidden'); });

// ── Utils ─────────────────────────────────────────────────────────────────────
function n(num) { return Number(num).toLocaleString(); }
function ago(ts) {
  const d = Date.now() - ts;
  const m = 6e4, h = 36e5, day = 864e5;
  if (d < m)        return 'just now';
  if (d < h)        return `${Math.floor(d/m)}m ago`;
  if (d < day)      return `${Math.floor(d/h)}h ago`;
  if (d < 30*day)   return `${Math.floor(d/day)}d ago`;
  if (d < 365*day)  return `${Math.floor(d/(30*day))}mo ago`;
  return `${Math.floor(d/(365*day))}y ago`;
}
function toast(text, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  el.textContent = text;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3500);
}
