// popup.js

// ── State ──────────────────────────────────────────────────────────────────────

let allSenders  = [];
let filtered    = [];
let selected    = new Set();
let sortBy      = 'count';
let query       = '';
let cachedMeta  = null; // { total, scannedAt }

// ── DOM ────────────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const screens = {
  loading:  $('screen-loading'),
  empty:    $('screen-empty'),
  noTab:    $('screen-no-tab'),
  main:     $('screen-main'),
  deleting: $('screen-deleting'),
};

const senderList     = $('sender-list');
const actionBar      = $('action-bar');
const actionSummary  = $('action-summary');
const headerStats    = $('header-stats');
const scanProgress   = $('scan-progress');
const progressFill   = $('progress-fill');
const progressText   = $('progress-text');
const modal          = $('modal');
const modalText      = $('modal-text');
const deleteText     = $('delete-text');
const deleteFill     = $('delete-fill');

// ── Screen management ──────────────────────────────────────────────────────────

function show(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
}

// ── Content-script messaging ─────────────────────────────────────────────────────

async function findGmailTabId() {
  const tabs = await chrome.tabs.query({ url: 'https://mail.google.com/*' });
  if (tabs.length === 0) return null;
  const active = tabs.find(t => t.active);
  return (active || tabs[0]).id;
}

function sendToContent(payload) {
  return findGmailTabId().then(tabId => {
    if (!tabId) return { ok: false, reason: 'no-tab' };
    return new Promise(resolve => {
      chrome.tabs.sendMessage(tabId, payload, response => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, reason: 'no-content-script', error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    });
  });
}

async function getCache() {
  const { inboxCleanerData } = await chrome.storage.local.get('inboxCleanerData');
  return inboxCleanerData || null;
}

// ── Initialise ─────────────────────────────────────────────────────────────────

async function init() {
  show('loading');
  const cache = await getCache();
  const stateResp = await sendToContent({ type: 'GET_SCAN_STATE' });
  const noTab = stateResp && stateResp.reason === 'no-tab';
  const scanState = (stateResp && stateResp.ok !== false) ? stateResp.scanState : { status: 'idle', category: 0, total: 5 };
  const scanning = scanState.status === 'scanning';

  if (cache && cache.senders.length > 0) {
    loadCache(cache);
    show('main');
    if (scanning) {
      showProgress(true);
      updateProgress(scanState);
    }
  } else if (scanning) {
    show('main');
    showProgress(true);
    updateProgress(scanState);
  } else if (noTab) {
    show('noTab');
  } else {
    show('empty');
  }
}

// ── Load cached data ───────────────────────────────────────────────────────────

function loadCache(cache) {
  allSenders = cache.senders;
  cachedMeta = { total: cache.total, scannedAt: cache.scannedAt };
  updateHeader();
  applyFilter();
}

function updateHeader() {
  if (!cachedMeta) return;
  const total = cachedMeta.total || allSenders.reduce((s, r) => s + r.count, 0);
  const ts    = cachedMeta.scannedAt ? ' · ' + ago(cachedMeta.scannedAt) : '';
  headerStats.textContent = `${n(total)} emails · ${n(allSenders.length)} senders${ts}`;
}

// ── Filter + sort ──────────────────────────────────────────────────────────────

function applyFilter() {
  const q = query.toLowerCase();
  filtered = q
    ? allSenders.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    : [...allSenders];

  filtered.sort((a, b) => {
    if (sortBy === 'count') return b.count - a.count;
    if (sortBy === 'name')  return a.name.localeCompare(b.name);
    if (sortBy === 'date')  return b.latest - a.latest;
    return 0;
  });

  renderList();
}

// ── Render ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#e53935','#8e24aa','#1e88e5','#00897b','#43a047','#f4511e','#6d4c41','#546e7a','#1565c0','#ad1457'];

function avatarColor(email) {
  let h = 0;
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function chipClass(count) {
  if (count >= 100) return 'chip-hi';
  if (count >= 50)  return 'chip-mid';
  return 'chip-lo';
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderList() {
  senderList.innerHTML = '';

  if (filtered.length === 0) {
    const el = document.createElement('div');
    el.className = 'list-empty';
    el.textContent = query ? 'No senders match.' : 'No senders found.';
    senderList.appendChild(el);
    return;
  }

  const frag = document.createDocumentFragment();

  for (const s of filtered) {
    const isSel = selected.has(s.email);
    const row   = document.createElement('div');
    row.className = 'row' + (isSel ? ' selected' : '');
    row.dataset.email = s.email;

    const badges = s.categories
      .map(c => `<span class="badge badge-${esc(c)}">${esc(c)}</span>`)
      .join('');

    const dateStr = s.latest ? `<span class="row-date">${ago(s.latest)}</span>` : '';

    row.innerHTML = `
      <label class="row-check" title="Select">
        <input type="checkbox" ${isSel ? 'checked' : ''}>
        <span class="chk"></span>
      </label>
      <div class="avatar" style="background:${avatarColor(s.email)}">${esc(s.name[0]?.toUpperCase() || '?')}</div>
      <div class="row-body">
        <div class="row-name">${esc(s.name)}</div>
        <div class="row-email">${esc(s.email)}</div>
        <div class="row-meta">${badges}${dateStr}</div>
      </div>
      <div class="count-chip ${chipClass(s.count)}">${s.count >= 1000 ? (s.count/1000).toFixed(1)+'k' : s.count}</div>
    `;

    const cb = row.querySelector('input[type=checkbox]');

    cb.addEventListener('change', e => {
      e.stopPropagation();
      toggle(s.email, cb.checked, row);
    });

    row.addEventListener('click', e => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      toggle(s.email, cb.checked, row);
    });

    frag.appendChild(row);
  }

  senderList.appendChild(frag);
}

// ── Selection ──────────────────────────────────────────────────────────────────

function toggle(email, checked, row) {
  checked ? selected.add(email) : selected.delete(email);
  row.classList.toggle('selected', checked);
  updateActionBar();
}

function updateActionBar() {
  if (selected.size === 0) { actionBar.classList.add('hidden'); return; }
  const totalEmails = allSenders.filter(s => selected.has(s.email)).reduce((a, s) => a + s.count, 0);
  actionSummary.textContent = `${selected.size} sender${selected.size > 1 ? 's' : ''} · ${n(totalEmails)} emails`;
  actionBar.classList.remove('hidden');
}

function clearSelection() {
  selected.clear();
  document.querySelectorAll('.row.selected').forEach(row => {
    row.classList.remove('selected');
    row.querySelector('input[type=checkbox]').checked = false;
  });
  updateActionBar();
}

// ── Scan progress ──────────────────────────────────────────────────────────────

function showProgress(visible) {
  scanProgress.classList.toggle('hidden', !visible);
}

function updateProgress(state) {
  const pct = state.total > 0 ? (state.category / state.total * 100) : 0;
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `Scanning category ${state.category} of ${state.total}…`;
}

// ── Delete flow ────────────────────────────────────────────────────────────────

function promptDelete() {
  const totalEmails = allSenders.filter(s => selected.has(s.email)).reduce((a, s) => a + s.count, 0);
  const sndr = selected.size;
  modalText.textContent =
    `Move ${n(totalEmails)} email${totalEmails !== 1 ? 's' : ''} from ${sndr} sender${sndr !== 1 ? 's' : ''} to Trash? ` +
    `Gmail auto-purges Trash after 30 days.`;
  modal.classList.remove('hidden');
}

async function confirmDelete() {
  modal.classList.add('hidden');
  const emails = [...selected];
  selected.clear();
  show('deleting');
  deleteText.textContent = 'Preparing…';
  deleteFill.style.width = '0%';
  const resp = await sendToContent({ type: 'DELETE', emails });
  if (!resp || resp.ok === false) {
    show('main');
    toast('Could not start deletion: ' + (resp && resp.reason ? resp.reason : 'unknown error'), 'error');
  }
}

// ── Broadcast listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(({ type, data }) => {
  if (type === 'SCAN_STATE') {
    if (data.status === 'done') {
      getCache().then(cache => {
        if (cache) loadCache(cache);
        show('main');
        showProgress(false);
        toast(`Scan complete — ${n(allSenders.length)} senders found`);
      });
    } else if (data.status === 'error') {
      showProgress(false);
      show(allSenders.length ? 'main' : 'empty');
      toast('Scan failed: ' + data.error, 'error');
    } else {
      if (screens.main.classList.contains('hidden')) show('main');
      showProgress(true);
      updateProgress(data);
    }
  }

  if (type === 'DELETE_STATE') {
    const d = data;
    if (d.status === 'done') {
      getCache().then(cache => {
        if (cache) loadCache(cache);
        show('main');
        toast('Deletion complete ✓');
      });
    } else {
      const pct = d.total > 0 ? (d.chunk / d.total * 100).toFixed(0) : 0;
      deleteFill.style.width = `${pct}%`;
      deleteText.textContent = `Deleting batch ${d.chunk} of ${d.total}…`;
    }
  }

  if (type === 'DELETE_ERROR') {
    show('main');
    toast('Deletion failed: ' + data, 'error');
  }
});

// ── Utilities ──────────────────────────────────────────────────────────────────

function n(num) { return Number(num).toLocaleString(); }

function ago(ts) {
  const d = Date.now() - ts;
  const m = 60e3, h = 36e5, day = 864e5;
  if (d < m)       return 'just now';
  if (d < h)       return `${Math.floor(d/m)}m ago`;
  if (d < day)     return `${Math.floor(d/h)}h ago`;
  if (d < 30*day)  return `${Math.floor(d/day)}d ago`;
  if (d < 365*day) return `${Math.floor(d/(30*day))}mo ago`;
  return `${Math.floor(d/(365*day))}y ago`;
}

function toast(text, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  el.textContent = text;
  document.body.appendChild(el);
  requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ── Events ─────────────────────────────────────────────────────────────────────

async function startScan() {
  show('main');
  showProgress(true);
  updateProgress({ category: 0, total: 5 });
  const resp = await sendToContent({ type: 'START_SCAN' });
  if (!resp || resp.ok === false) {
    showProgress(false);
    if (resp && resp.reason === 'no-tab') {
      show('noTab');
    } else {
      show(allSenders.length ? 'main' : 'empty');
      toast('Could not start scan: ' + (resp && resp.reason ? resp.reason : 'unknown error'), 'error');
    }
  }
}

$('btn-first-scan').addEventListener('click', startScan);

$('btn-refresh').addEventListener('click', () => {
  selected.clear();
  updateActionBar();
  startScan();
});

$('btn-retry-tab').addEventListener('click', init);

$('search').addEventListener('input', e => { query = e.target.value; applyFilter(); });

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sortBy = btn.dataset.sort;
    applyFilter();
  });
});

$('btn-delete').addEventListener('click', promptDelete);
$('btn-clear').addEventListener('click', clearSelection);
$('btn-cancel').addEventListener('click', () => modal.classList.add('hidden'));
$('btn-confirm').addEventListener('click', confirmDelete);

// close modal on backdrop click
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

// ── Boot ───────────────────────────────────────────────────────────────────────

init();
