// popup.js — Inbox Cleaner UI. Enforcement lives in content.js; this file only
// renders verified state and asks the content script to act.

const {
  confidenceOf,
  formatUpperBound,
  summarizeSelection,
  reviewLines,
  receiptLines,
  normalizePolicy,
  buildPolicyQuery,
  buildGmailSearchUrl,
  buildGmailTrashUrl,
  dateYearsAgo,
  normalizeDateInput,
  migrateContainer,
  accountSnapshot,
  isActionableSnapshot,
  formatNumber,
  formatDateInput,
  ACTIONS,
} = InboxCleanerParsing;

// ── State ──────────────────────────────────────────────────────────────────────

let container = null;
let snapshot = null;
let legacy = null;
let identity = null;
let documentId = null;
let boundTabId = null;
let tabInfos = [];
let allSenders = [];
let filtered = [];
let selected = new Set();
let sortBy = 'count';
let query = '';
let categoryFilter = '';
let renderLimit = 200;
let readOnly = false;
let actionable = false;
let runState = null;
let executeState = null;
let receipt = null;
let history = [];
let review = null;
let reviewTrigger = null;
let progressTimer = null;
let progressStartedAt = 0;
let blockedActions = { primary: null, secondary: null };

// ── DOM ────────────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const screens = {
  loading: $('screen-loading'),
  blocked: $('screen-blocked'),
  empty: $('screen-empty'),
  main: $('screen-main'),
  executing: $('screen-executing'),
  receipt: $('screen-receipt'),
};

const senderList = $('sender-list');
const actionBar = $('action-bar');
const actionSummary = $('action-summary');
const headerAccount = $('account-line');
const headerStats = $('header-stats');
const banner = $('banner');
const scanProgress = $('scan-progress');
const progressBar = $('progress-bar');
const progressFill = $('progress-fill');
const progressText = $('progress-text');
const progressTime = $('progress-time');
const modal = $('modal');
const modalTitle = $('modal-title');
const modalText = $('modal-text');
const modalError = $('modal-error');
const confirmButton = $('btn-confirm');
const previewButton = $('btn-preview');
const live = $('live');

// ── Screens ────────────────────────────────────────────────────────────────────

function show(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('hidden', key !== name));
}

function announce(text) {
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = text; });
}

// ── Chrome messaging ───────────────────────────────────────────────────────────

function sendToTab(tabId, payload) {
  return new Promise(resolve => {
    if (!Number.isInteger(tabId)) { resolve(null); return; }
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish({ ok: false, reason: 'no-content-script' }), 2500);
    try {
      chrome.tabs.sendMessage(tabId, payload, response => {
        if (chrome.runtime.lastError) {
          finish({ ok: false, reason: 'no-content-script', error: chrome.runtime.lastError.message });
        } else {
          finish(response == null ? { ok: false, reason: 'no-content-script' } : response);
        }
      });
    } catch {
      finish({ ok: false, reason: 'no-content-script' });
    }
  });
}

async function readStore(key) {
  try {
    const data = await chrome.storage.local.get(key);
    return data ? data[key] : undefined;
  } catch {
    return undefined;
  }
}

async function writeStore(key, value) {
  try { await chrome.storage.local.set({ [key]: value }); } catch { /* local only */ }
}

// ── Boot ───────────────────────────────────────────────────────────────────────

async function init() {
  show('loading');
  await loadHistory();
  await refreshTabs();
}

async function refreshTabs() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: 'https://mail.google.com/*' });
  } catch {
    tabs = [];
  }

  if (!tabs.length) {
    showBlocked(noTabState());
    return;
  }

  tabInfos = await Promise.all(tabs.map(async tab => {
    const response = await sendToTab(tab.id, { type: 'GET_IDENTITY' });
    const ok = response && response.ok !== false && response.identity;
    return {
      tab,
      response,
      identity: ok ? response.identity : null,
      scanState: ok ? response.scanState : null,
      executeState: ok ? response.executeState : null,
      documentId: ok ? response.documentId : null,
    };
  }));

  const knownAccounts = new Set(tabInfos
    .map(info => info.identity && info.identity.accountKey)
    .filter(Boolean));
  if (knownAccounts.size > 1) {
    showBlocked(identityMultiState());
    return;
  }

  const chosen = tabInfos.find(info => info.tab.id === boundTabId) ||
    tabInfos.find(info => info.tab.active) ||
    tabInfos[0];
  await bindTab(chosen);
}

async function bindTab(info) {
  boundTabId = info.tab.id;
  identity = info.identity;
  documentId = info.documentId ||
    (info.identity && info.identity.documentId) || null;
  runState = info.scanState || null;
  executeState = info.executeState || null;

  if (!info.response || info.response.ok === false && info.response.reason === 'no-content-script') {
    showBlocked(contentMissingState());
    return;
  }
  if (!identity || !identity.accountKey) {
    showBlocked(identityUnknownState());
    return;
  }

  await loadData();

  if (executeState && /executing|stopping/.test(executeState.status)) {
    showExecuting();
    updateExecute(executeState);
    return;
  }

  if (scanSnapshotStateActive(runState)) {
    showMain();
    showProgress(true);
    updateProgress(runState);
    return;
  }

  if (snapshot) {
    showMain();
    return;
  }
  if (legacy) {
    showMain();
    return;
  }
  showEmpty();
}

function scanSnapshotStateActive(state) {
  return Boolean(state && /discovering|counting|stopping/.test(state.status));
}

// ── Data ───────────────────────────────────────────────────────────────────────

async function loadData() {
  const stored = await readStore('inboxCleanerData');
  const wasLegacy = stored && (stored.version !== 2 || !stored.accounts);
  container = migrateContainer(stored);
  if (wasLegacy) await writeStore('inboxCleanerData', container);

  legacy = container.legacyUnbound;
  snapshot = identity && identity.accountKey
    ? accountSnapshot(container, identity.accountKey)
    : null;
  actionable = Boolean(snapshot && isActionableSnapshot(snapshot, identity.accountKey));
  readOnly = !actionable;
  allSenders = (snapshot && Array.isArray(snapshot.senders))
    ? snapshot.senders
    : (legacy && Array.isArray(legacy.senders) ? legacy.senders : []);
  selected.clear();
}

async function loadHistory() {
  const stored = await readStore('inboxCleanerHistory');
  history = stored && Array.isArray(stored.entries) ? stored.entries : [];
}

// ── Screen states ──────────────────────────────────────────────────────────────

function showMain() {
  show('main');
  selected.clear();
  renderMain();
  if (scanSnapshotStateActive(runState)) {
    showProgress(true);
    updateProgress(runState);
  }
}

function showEmpty() {
  show('empty');
  $('empty-account').textContent = identity && identity.accountKey
    ? `Verified Gmail account: ${identity.accountKey}`
    : '';
}

function showBlocked(config) {
  $('blocked-title').textContent = config.title;
  $('blocked-body').textContent = config.body;

  const primary = $('btn-blocked-primary');
  const secondary = $('btn-blocked-secondary');
  primary.classList.toggle('hidden', !config.primary);
  secondary.classList.toggle('hidden', !config.secondary);
  if (config.primary) {
    primary.textContent = config.primary.label;
    blockedActions.primary = config.primary.action;
  } else {
    blockedActions.primary = null;
  }
  if (config.secondary) {
    secondary.textContent = config.secondary.label;
    blockedActions.secondary = config.secondary.action;
  } else {
    blockedActions.secondary = null;
  }

  const choices = $('tab-choices');
  choices.replaceChildren();
  if (config.tabs && config.tabs.length) {
    for (const info of config.tabs) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tab-choice';
      const address = info.identity && info.identity.accountKey;
      const label = address || 'Account not readable';
      button.textContent = `${label} — tab ${info.tab.index + 1}`;
      button.setAttribute('aria-label', `Use Gmail tab ${info.tab.index + 1}: ${label}`);
      button.addEventListener('click', () => {
        boundTabId = info.tab.id;
        bindTab(info);
      });
      choices.appendChild(button);
    }
    choices.classList.remove('hidden');
  } else {
    choices.classList.add('hidden');
  }

  show('blocked');
}

function noTabState() {
  return {
    title: 'Open Gmail first',
    body: 'Inbox Cleaner reads Gmail\'s own pages. Open Gmail in a tab, then come back — nothing is scanned or moved yet.',
    primary: { label: 'Open Gmail', action: openGmailTab },
    secondary: { label: 'Retry', action: refreshTabs },
  };
}

function contentMissingState() {
  return {
    title: 'Reload this Gmail tab',
    body: 'The Gmail tab was open before Inbox Cleaner was installed or reloaded, so it is not connected yet. Reloading Gmail fixes it. Nothing was scanned or moved.',
    primary: { label: 'Reload Gmail tab', action: reloadBoundTab },
    secondary: { label: 'Open a new Gmail tab', action: openGmailTab },
  };
}

function identityUnknownState() {
  return {
    title: 'Account not verified',
    body: 'The signed-in Gmail address could not be read from this tab, so cleanup is blocked. This can happen while Gmail is loading, when signed out, or after a Gmail layout change. Nothing is being moved.',
    primary: { label: 'Re-check account', action: refreshTabs },
    secondary: { label: 'Reload Gmail tab', action: reloadBoundTab },
  };
}

function identityMultiState() {
  return {
    title: 'Choose a Gmail account',
    body: 'More than one Gmail account is open in different tabs. Choose the tab you want to scan and clean. Acting on whichever tab happened to answer first is never allowed.',
    primary: null,
    secondary: { label: 'Re-check tabs', action: refreshTabs },
    tabs: tabInfos.filter(info => info.identity && info.identity.accountKey),
  };
}

function identityMismatchState() {
  return {
    title: 'The account changed',
    body: 'The Gmail account in this tab is not the account this cleanup was reviewed for. Nothing was moved. Scan this account, then review again.',
    primary: { label: 'Scan this account', action: () => startScan() },
    secondary: { label: 'Back to senders', action: () => { loadData().then(() => showMain()); } },
  };
}

function snapshotUnboundState() {
  return {
    title: 'Rescan to enable cleanup',
    body: 'This list comes from an earlier version or an incomplete scan, so its account and scope are not verified. It is shown read-only. A fresh scan makes cleanup available.',
    primary: { label: 'Rescan this account', action: () => startScan() },
    secondary: { label: 'Back to senders', action: () => { loadData().then(() => showMain()); } },
  };
}

function interruptedState() {
  return {
    title: 'Review what happened',
    body: 'Gmail interrupted the run before the next batch could start. Earlier batches are reported separately; an interrupted batch is unknown, not assumed failed. Review the receipt before retrying.',
    primary: { label: 'Review receipt', action: () => { loadHistory().then(() => showReceipt(history[0] || null)); } },
    secondary: { label: 'Scan this account', action: () => startScan() },
  };
}

function openGmailTab() {
  try { chrome.tabs.create({ url: 'https://mail.google.com/' }); } catch { /* ignore */ }
  setTimeout(refreshTabs, 900);
}

function reloadBoundTab() {
  if (Number.isInteger(boundTabId)) {
    try { chrome.tabs.reload(boundTabId); } catch { /* ignore */ }
  }
  setTimeout(refreshTabs, 900);
}

function handleFailure(reason, message) {
  switch (reason) {
    case 'no-tab': showBlocked(noTabState()); return;
    case 'no-content-script': showBlocked(contentMissingState()); return;
    case 'identity-unknown':
    case 'identity-ambiguous': showBlocked(identityUnknownState()); return;
    case 'identity-required':
    case 'identity-changed':
    case 'identity-mismatch': showBlocked(identityMismatchState()); return;
    case 'snapshot-unbound': showBlocked(snapshotUnboundState()); return;
    case 'interrupted-document': showBlocked(interruptedState()); return;
    case 'run-busy': toast('Another scan or cleanup is already running in this Gmail tab.'); return;
    case 'stale-run': toast('That run is no longer active.'); return;
    default: toast(message || 'Gmail did not accept that request. Nothing else was moved.');
  }
}

// ── Header + list ──────────────────────────────────────────────────────────────

function renderMain() {
  renderHeader();
  renderBanner();
  updateOptionsSummary();
  applyFilter();
  updateActionBar();
}

function renderHeader() {
  if (identity && identity.accountKey) {
    headerAccount.textContent = `Verified account: ${identity.accountKey}`;
  } else {
    headerAccount.textContent = 'Account not verified';
  }

  if (snapshot) {
    const found = Number.isFinite(snapshot.discoveredConversations)
      ? `${formatNumber(snapshot.discoveredConversations)} conversations found`
      : `${formatNumber(allSenders.length)} senders`;
    headerStats.textContent = `${formatNumber(allSenders.length)} senders · ${found}` +
      (snapshot.scannedAt ? ` · ${ago(snapshot.scannedAt)}` : '');
  } else if (legacy) {
    headerStats.textContent = `${formatNumber(allSenders.length)} senders · from an earlier version`;
  } else {
    headerStats.textContent = '';
  }
}

function setBanner(text, tone) {
  banner.textContent = text;
  banner.className = `banner${tone ? ` banner-${tone}` : ''}`;
  banner.classList.toggle('hidden', !text);
}

function renderBanner() {
  if (legacy && !snapshot) {
    setBanner('From an earlier version — account not verified. This list is read-only. Rescan to enable cleanup.', 'warning');
    return;
  }
  if (snapshot && snapshot.partial === true) {
    setBanner('The last scan was incomplete, so cleanup is disabled. The previous complete scan is not overwritten; rescan to try again.', 'warning');
    return;
  }
  if (snapshot && snapshot.partialScan) {
    setBanner('The last scan stopped early. This complete scan is still shown; rescan when you are ready.', 'warning');
    return;
  }
  if (snapshot && snapshot.stale) {
    setBanner('Counts are from before your last cleanup. Rescan to refresh before another action.', 'warning');
    return;
  }
  setBanner('', null);
}

function applyFilter(resetLimit = true) {
  const q = query.trim().toLowerCase();
  filtered = allSenders.filter(sender => {
    const matchesQuery = !q ||
      String(sender.name || '').toLowerCase().includes(q) ||
      String(sender.email || '').toLowerCase().includes(q);
    const matchesCategory = !categoryFilter ||
      (Array.isArray(sender.categories) && sender.categories.includes(categoryFilter));
    return matchesQuery && matchesCategory;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'count') return (b.count || 0) - (a.count || 0);
    if (sortBy === 'name') return String(a.name).localeCompare(String(b.name));
    if (sortBy === 'date') return (b.latest || 0) - (a.latest || 0);
    return 0;
  });

  if (resetLimit) renderLimit = 200;
  renderList();
  updateScopeButtons();
}

function renderList() {
  senderList.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'list-empty';
    empty.textContent = query || categoryFilter
      ? 'No senders match this view.'
      : 'No senders found.';
    senderList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const sender of filtered.slice(0, renderLimit)) {
    fragment.appendChild(buildRow(sender));
  }
  senderList.appendChild(fragment);

  if (filtered.length > renderLimit) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'btn-ghost show-more';
    more.textContent = `Show ${formatNumber(Math.min(200, filtered.length - renderLimit))} more of ${formatNumber(filtered.length)}`;
    more.addEventListener('click', () => {
      renderLimit += 200;
      renderList();
    });
    senderList.appendChild(more);
  }
}

const AVATAR_COLORS = ['#c62828', '#6a1b9a', '#1565c0', '#00695c', '#2e7d32', '#d84315', '#4e342e', '#37474f', '#0d47a1', '#ad1457'];

function avatarColor(email) {
  let hash = 0;
  for (const char of String(email || '')) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function chipClass(confidence, count) {
  if (confidence === 'unknown') return 'chip-unknown';
  if (count >= 100) return 'chip-hi';
  if (count >= 50) return 'chip-mid';
  return 'chip-lo';
}

function countChip(sender) {
  const confidence = confidenceOf(sender);
  const chip = document.createElement('span');
  chip.className = `count-chip ${chipClass(confidence, sender.count || 0)}`;
  if (confidence === 'exact') {
    chip.textContent = formatNumber(sender.count);
    chip.title = 'Exact Gmail count for this sender\'s own search.';
  } else if (confidence === 'unknown') {
    chip.textContent = '?';
    chip.title = 'Gmail did not return an exact count for this sender.';
  } else {
    chip.textContent = `≈${formatNumber(sender.count)}`;
    chip.title = 'Approximate: counted from the scanned Inbox categories only.';
  }
  return chip;
}

function buildRow(sender) {
  const confidence = confidenceOf(sender);
  const isSelected = selected.has(sender.email);

  const row = document.createElement('div');
  row.className = 'row' + (isSelected ? ' selected' : '');
  row.dataset.email = sender.email;
  row.setAttribute('role', 'listitem');

  const label = document.createElement('label');
  label.className = 'row-check';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = isSelected;
  checkbox.disabled = readOnly;
  checkbox.setAttribute('aria-label',
    `Select ${sender.name} <${sender.email}>, ${confidence === 'exact' ? formatNumber(sender.count) : confidence === 'unknown' ? 'count unknown' : `about ${formatNumber(sender.count)}`} conversations`);
  const checkMark = document.createElement('span');
  checkMark.className = 'chk';
  label.append(checkbox, checkMark);

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.style.background = avatarColor(sender.email);
  avatar.textContent = (sender.name || '?').charAt(0).toUpperCase() || '?';
  avatar.setAttribute('aria-hidden', 'true');

  const body = document.createElement('div');
  body.className = 'row-body';

  const name = document.createElement('div');
  name.className = 'row-name';
  name.textContent = sender.name || sender.email;

  const email = document.createElement('div');
  email.className = 'row-email';
  email.textContent = sender.email;

  const meta = document.createElement('div');
  meta.className = 'row-meta';
  for (const category of sender.categories || []) {
    const badge = document.createElement('span');
    badge.className = `badge badge-${category}`;
    badge.textContent = `Found in ${category}`;
    meta.appendChild(badge);
  }
  if (sender.latest) {
    const date = document.createElement('span');
    date.className = 'row-date';
    date.textContent = `newest ${ago(sender.latest)}`;
    meta.appendChild(date);
  }
  if (confidence === 'unknown') {
    const note = document.createElement('span');
    note.className = 'row-date';
    note.textContent = 'count unknown';
    meta.appendChild(note);
  }

  body.append(name, email, meta);

  const view = document.createElement('button');
  view.type = 'button';
  view.className = 'btn-link row-view';
  view.textContent = 'View';
  view.setAttribute('aria-label', `View messages from ${sender.email} in Gmail`);
  view.addEventListener('click', event => {
    event.stopPropagation();
    const policy = currentPolicy(currentActionForView());
    openSearch(buildPolicyQuery(policy, [sender.email]));
  });

  const count = countChip(sender);
  const trailing = document.createElement('div');
  trailing.className = 'row-trailing';
  trailing.append(count, view);

  const toggle = checked => {
    if (readOnly) return;
    if (checked) selected.add(sender.email);
    else selected.delete(sender.email);
    row.classList.toggle('selected', checked);
    checkbox.checked = checked;
    updateActionBar();
  };

  checkbox.addEventListener('change', event => {
    event.stopPropagation();
    toggle(checkbox.checked);
  });
  row.addEventListener('click', event => {
    if (event.target === checkbox || event.target.closest('button')) return;
    toggle(!checkbox.checked);
  });

  row.append(label, avatar, body, trailing);
  return row;
}

function currentActionForView() {
  return 'trash';
}

// ── Selection + action bar ─────────────────────────────────────────────────────

function updateScopeButtons() {
  const shown = $('btn-select-shown');
  const all = $('btn-select-all');
  shown.textContent = `Select all ${formatNumber(filtered.length)} shown`;
  shown.classList.toggle('hidden', readOnly || !filtered.length);
  if (filtered.length < allSenders.length && !readOnly) {
    all.textContent = `Select all ${formatNumber(allSenders.length)} senders`;
    all.classList.remove('hidden');
  } else {
    all.classList.add('hidden');
  }

  const note = $('selection-note');
  if (categoryFilter) {
    note.textContent = `Showing ${categoryFilter} only.`;
  } else if (query.trim()) {
    note.textContent = `Filtered by “${query.trim()}”.`;
  } else {
    note.textContent = '';
  }
}

function updateActionBar() {
  if (readOnly || !actionable || selected.size === 0) {
    actionBar.classList.add('hidden');
    return;
  }

  const chosen = allSenders.filter(sender => selected.has(sender.email));
  const summary = summarizeSelection({ senders: chosen, union: null });
  actionSummary.textContent = formatUpperBound(summary) +
    (summary.breakdown ? ` · ${summary.breakdown}` : '');

  const hidden = chosen.filter(sender => !filtered.includes(sender)).length;
  const hiddenButton = $('btn-show-hidden');
  hiddenButton.classList.toggle('hidden', hidden === 0);
  if (hidden) hiddenButton.textContent = `Show ${hidden} hidden selected`;

  actionBar.classList.remove('hidden');
}

function selectAllShown() {
  if (readOnly) return;
  for (const sender of filtered) selected.add(sender.email);
  renderList();
  updateActionBar();
}

function selectAllResults() {
  if (readOnly) return;
  for (const sender of allSenders) selected.add(sender.email);
  renderList();
  updateActionBar();
}

function clearSelection() {
  selected.clear();
  renderList();
  updateActionBar();
}

function showAllSelected() {
  query = '';
  categoryFilter = '';
  $('search').value = '';
  applyFilter();
  updateActionBar();
}

// ── Policy ─────────────────────────────────────────────────────────────────────

function readOptions() {
  return {
    protect: {
      starred: $('protect-starred').checked,
      important: $('protect-important').checked,
      unread: $('protect-unread').checked,
    },
    before: normalizeDateInput($('before-date').value),
  };
}

function currentPolicy(action) {
  const options = readOptions();
  return normalizePolicy({ action, emails: [...selected], ...options });
}

function updateOptionsSummary() {
  const options = readOptions();
  const protections = [];
  if (options.protect.starred) protections.push('starred');
  if (options.protect.important) protections.push('important');
  if (options.protect.unread) protections.push('unread');
  const bits = [];
  bits.push(protections.length ? `Keeping ${protections.join(', ')} mail` : 'No protection filters on');
  if (options.before) bits.push(`only mail before ${formatDateInput(options.before)}`);
  $('options-summary').textContent = `${bits.join(' · ')}. Counts are rechecked at review.`;
}

function policyChanged() {
  const beforeValue = $('before-date').value;
  if (beforeValue && !normalizeDateInput(beforeValue)) {
    $('before-date').value = '';
    toast('That date is not valid. Use a calendar date.');
  }
  if (selected.size) {
    selected.clear();
    renderList();
    updateActionBar();
    toast('Cleanup options changed — selection cleared so nothing is reviewed under the old policy.');
  }
  updateOptionsSummary();
}

function applyPreset(kind) {
  const oneYearAgo = dateYearsAgo(1);
  $('before-date').value = oneYearAgo;
  categoryFilter = kind === 'social' ? 'SOCIAL' : 'PROMOTIONS';
  query = '';
  $('search').value = '';
  selected.clear();
  applyFilter();
  updateActionBar();
  updateOptionsSummary();
  setBanner(`Preset: ${kind === 'social' ? 'Social' : 'Promotions'} senders with mail before ${formatDateInput(normalizeDateInput(oneYearAgo))}. Select senders, then review — the preset protects nothing until you confirm.`, 'info');
}

function resetOptions() {
  $('protect-starred').checked = true;
  $('protect-important').checked = true;
  $('protect-unread').checked = false;
  $('before-date').value = '';
  categoryFilter = '';
  query = '';
  $('search').value = '';
  selected.clear();
  renderBanner();
  applyFilter();
  updateActionBar();
  updateOptionsSummary();
}

// ── Scan ───────────────────────────────────────────────────────────────────────

async function startScan() {
  if (!identity || !identity.accountKey) {
    showBlocked(identityUnknownState());
    return;
  }
  showMain();
  showProgress(true);
  updateProgress({ status: 'discovering', phase: 'discovering', done: 0, total: 5, detail: '', startedAt: Date.now() });

  const response = await sendToTab(boundTabId, {
    type: 'START_SCAN',
    tabId: boundTabId,
    expectedAccount: identity.accountKey,
  });

  if (!response || response.ok === false) {
    showProgress(false);
    handleFailure(response && response.reason, response && response.error);
  } else {
    runState = { ...(runState || {}), status: 'discovering', runId: response.runId, accountKey: response.accountKey };
    progressStartedAt = Date.now();
    startClock();
  }
}

function showProgress(visible) {
  scanProgress.classList.toggle('hidden', !visible);
  if (!visible) {
    stopClock();
  }
}

function runLabel(state) {
  if (state.status === 'stopping') return 'Stopping after the current step…';
  if (state.phase === 'counting') {
    return `Verifying counts · sender ${formatNumber(state.done || 0)} of ${formatNumber(state.total || 0)}`;
  }
  return `Discovering senders · category ${formatNumber(state.done || 0)} of ${formatNumber(state.total || 5)}`;
}

function updateProgress(state) {
  const label = runLabel(state);
  const detail = state.detail ? ` · ${String(state.detail).slice(0, 56)}` : '';
  progressText.textContent = `${label}${detail}`;
  const pct = state.total > 0 ? Math.round((state.done || 0) / state.total * 100) : 0;
  progressFill.style.width = `${pct}%`;
  progressBar.setAttribute('aria-valuenow', String(pct));
  $('btn-stop').textContent = state.status === 'stopping' ? 'Stopping…' : 'Stop scan';
  $('btn-stop').disabled = state.status === 'stopping';
  progressStartedAt = state.startedAt || progressStartedAt || Date.now();
  startClock();
}

function stopRun() {
  if (!runState || !runState.runId) return;
  sendToTab(boundTabId, { type: 'STOP_RUN', runId: runState.runId }).then(response => {
    if (response && response.ok === false) toast('The run already finished.');
  });
  $('btn-stop').disabled = true;
  $('btn-stop').textContent = 'Stopping…';
}

function startClock() {
  if (progressTimer) return;
  progressTimer = setInterval(() => {
    const elapsed = Date.now() - (progressStartedAt || Date.now());
    progressTime.textContent = elapsedText(elapsed);
    const executeTime = $('execute-time');
    if (executeTime && !screens.executing.classList.contains('hidden')) {
      executeTime.textContent = elapsedText(Date.now() - (executeState && executeState.startedAt || progressStartedAt || Date.now()));
    }
  }, 1000);
}

function stopClock() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function elapsedText(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s elapsed`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s elapsed`;
}

// ── Review + execute ───────────────────────────────────────────────────────────

async function openReview(action) {
  if (readOnly || !actionable || selected.size === 0) return;
  if (!identity || !identity.accountKey) {
    showBlocked(identityUnknownState());
    return;
  }

  reviewTrigger = document.activeElement;
  review = null;
  $('modal-icon').textContent = action === 'archive' ? '📦' : '🗑️';
  modalTitle.textContent = action === 'archive' ? 'Review before archiving' : 'Review before moving to Trash';
  modalText.replaceChildren();
  const checking = document.createElement('p');
  checking.className = 'muted';
  checking.textContent = 'Checking Gmail\'s count for this search… This is read-only.';
  modalText.appendChild(checking);
  modalError.classList.add('hidden');
  confirmButton.disabled = true;
  confirmButton.className = action === 'archive' ? 'btn-primary' : 'btn-danger';
  confirmButton.textContent = action === 'archive' ? 'Archive' : 'Move to Trash';
  previewButton.disabled = true;
  modal.classList.remove('hidden');
  $('btn-cancel').focus();

  const policy = currentPolicy(action);
  const response = await sendToTab(boundTabId, {
    type: 'COUNT_POLICY',
    policy,
    expectedAccount: identity.accountKey,
  });

  if (modal.classList.contains('hidden')) return;
  if (!response || response.ok === false) {
    closeModal();
    handleFailure(response && response.reason, response && response.error);
    return;
  }

  review = { policy, response };
  renderReview();
}

function renderReview() {
  const { policy, response } = review;
  const chosen = allSenders.filter(sender => selected.has(sender.email));
  const summary = summarizeSelection({ senders: chosen, union: response.union });

  modalText.replaceChildren();
  for (const line of reviewLines({
    accountKey: identity.accountKey,
    policy,
    summary,
    senders: policy.emails,
  })) {
    const paragraph = document.createElement('p');
    paragraph.className = line.startsWith('Total:') ? 'review-total' : '';
    paragraph.textContent = line;
    modalText.appendChild(paragraph);
  }

  const note = document.createElement('p');
  note.className = 'fine';
  note.textContent = 'Sender rows in the list show All Mail counts; the total above applies your cleanup options to this exact search.';
  modalText.appendChild(note);

  confirmButton.disabled = false;
  confirmButton.textContent = ACTIONS[policy.action].label;
  previewButton.disabled = !response.previewQuery;
  confirmButton.focus();
  const amount = summary.total !== null
    ? `${formatNumber(summary.total)} conversations`
    : summary.upperBound !== null && summary.upperBound !== undefined
      ? `up to ${formatNumber(summary.upperBound)} conversations`
      : 'Total unknown';
  announce(`${identity.accountKey}. ${amount}. ${ACTIONS[policy.action].label}.`);

  const errorBox = modalError;
  errorBox.classList.toggle('modal-warning', response.union.status !== 'exact');
  if (response.union.status === 'bounded') {
    errorBox.textContent = 'Gmail gave exact counts per batch. The combined total is shown as an upper bound because a conversation can match more than one batch.';
    errorBox.classList.remove('hidden');
  } else if (response.union.status !== 'exact') {
    errorBox.textContent = `Gmail did not return an exact total${response.union.reason ? `: ${response.union.reason}` : ''}. The sender scope is still exact, so you can continue, or cancel and rescan.`;
    errorBox.classList.remove('hidden');
  } else {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }
}

async function confirmReview() {
  if (!review || confirmButton.disabled) return;
  const { policy, response } = review;
  review = null;
  closeModal();

  $('execute-title').textContent = policy.action === 'archive' ? 'Archiving mail…' : 'Moving mail to Trash…';
  $('delete-text').textContent = 'Starting the first batch…';
  $('delete-fill').style.width = '0%';
  $('execute-bar').setAttribute('aria-valuenow', '0');
  $('btn-stop-execute').disabled = false;
  $('btn-stop-execute').textContent = 'Stop after this batch';
  show('executing');

  const result = await sendToTab(boundTabId, {
    type: 'EXECUTE',
    policy,
    expectedAccount: identity.accountKey,
    expectedDocumentId: response.documentId,
  });

  if (!result || result.ok === false) {
    await loadData();
    showMain();
    handleFailure(result && result.reason, result && result.error);
    return;
  }

  selected.clear();
  executeState = {
    status: 'executing', action: policy.action, chunk: 0, total: result.total,
    startedAt: Date.now(), runId: result.runId, accountKey: result.accountKey,
  };
  progressStartedAt = executeState.startedAt;
  updateExecute(executeState);
}

function showExecuting() {
  show('executing');
  startClock();
}

function updateExecute(state) {
  if (!state) return;
  executeState = state;
  const action = state.action === 'archive' ? 'Archiving' : 'Moving to Trash';
  $('execute-title').textContent = state.status === 'stopping' ? 'Stopping safely…' : `${action}…`;
  const done = Math.max(0, state.chunk || 0);
  const total = Math.max(1, state.total || 1);
  const pct = Math.round(done / total * 100);
  $('delete-fill').style.width = `${pct}%`;
  $('execute-bar').setAttribute('aria-valuenow', String(pct));
  $('delete-text').textContent = state.status === 'stopping'
    ? 'Finishing the current batch, then stopping. Gmail navigation is expected.'
    : `Batch ${Math.max(1, done)} of ${total} · ${state.detail || 'waiting for Gmail…'}`;
  $('btn-stop-execute').disabled = state.status === 'stopping';
  $('btn-stop-execute').textContent = state.status === 'stopping' ? 'Stopping…' : 'Stop after this batch';
  startClock();
}

function stopExecute() {
  if (!executeState || !executeState.runId) return;
  sendToTab(boundTabId, { type: 'STOP_RUN', runId: executeState.runId });
  $('btn-stop-execute').disabled = true;
  $('btn-stop-execute').textContent = 'Stopping…';
}

// ── Receipt + history ──────────────────────────────────────────────────────────

function showReceipt(entry) {
  if (entry) receipt = entry;
  if (!receipt) {
    loadData().then(() => showMain());
    return;
  }

  const titles = {
    completed: 'Cleanup complete',
    partial: 'Cleanup partly complete',
    unknown: 'Cleanup outcome unknown',
    failed: 'Cleanup failed',
    cancelled: 'Cleanup stopped',
  };
  $('receipt-title').textContent = titles[receipt.status] || 'Cleanup receipt';
  $('receipt-account').textContent = `Account: ${receipt.accountKey} · ${new Date(receipt.endedAt || receipt.startedAt).toLocaleString()}`;

  const body = $('receipt-body');
  body.replaceChildren();
  for (const line of receiptLines(receipt)) {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    body.appendChild(paragraph);
  }

  if (Array.isArray(receipt.chunks) && receipt.chunks.length) {
    const details = document.createElement('details');
    details.className = 'batch-details';
    const summary = document.createElement('summary');
    summary.textContent = `Batches (${receipt.chunks.length})`;
    details.appendChild(summary);
    for (const chunk of receipt.chunks) {
      const line = document.createElement('p');
      line.className = 'batch-line';
      line.textContent = `${chunk.outcome}: ${chunk.query}`;
      details.appendChild(line);
    }
    body.appendChild(details);
  }

  const firstQuery = receipt.chunks && receipt.chunks.find(chunk => chunk.query);
  $('btn-review-mail').classList.toggle('hidden', !firstQuery);
  $('btn-open-trash').classList.toggle('hidden', receipt.action !== 'trash');
  $('btn-receipt-scan').classList.toggle('hidden', !identity || !identity.accountKey);

  renderHistory();
  show('receipt');
  announce(receiptLines(receipt)[0] || 'Cleanup receipt');
}

function renderHistory() {
  const list = $('history-list');
  list.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No local cleanup receipts yet.';
    list.appendChild(empty);
    return;
  }
  for (const entry of history.slice(0, 20)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-entry';
    const when = new Date(entry.endedAt || entry.startedAt).toLocaleDateString();
    button.textContent = `${when} · ${ACTIONS[entry.action] ? ACTIONS[entry.action].label : 'Cleanup'} · ${entry.status}`;
    button.addEventListener('click', () => showReceipt(entry));
    list.appendChild(button);
  }
}

async function clearHistory() {
  await writeStore('inboxCleanerHistory', { version: 1, entries: [] });
  history = [];
  renderHistory();
  toast('Local cleanup history cleared. No mail was changed.');
}

function openTrash() {
  try {
    chrome.tabs.create({ url: buildGmailTrashUrl(identity && Number.isInteger(identity.uIndex) ? identity.uIndex : 0) });
  } catch { /* ignore */ }
}

function reviewAffectedMail() {
  const chunk = receipt && receipt.chunks && receipt.chunks.find(entry => entry.query);
  if (!chunk) return;
  openSearch(chunk.query);
}

function openSearch(searchQuery) {
  if (!searchQuery) return;
  try {
    chrome.tabs.create({
      url: buildGmailSearchUrl(identity && Number.isInteger(identity.uIndex) ? identity.uIndex : 0, searchQuery),
    });
  } catch { /* ignore */ }
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function closeModal() {
  modal.classList.add('hidden');
  review = null;
  if (reviewTrigger && typeof reviewTrigger.focus === 'function') reviewTrigger.focus();
  reviewTrigger = null;
}

function modalFocusables() {
  return [...modal.querySelectorAll('button:not([disabled])')]
    .filter(element => element.getClientRects().length);
}

modal.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusables = modalFocusables();
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

// ── Broadcasts ─────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(message => {
  const { type, data } = message || {};
  if (!type || !data) return;

  if (type === 'SCAN_STATE') {
    if (data.accountKey && identity && data.accountKey !== identity.accountKey) return;
    if (data.documentId && documentId && data.documentId !== documentId) return;
    handleScanState(data);
    return;
  }

  if (type === 'DELETE_STATE') {
    if (data.accountKey && identity && data.accountKey !== identity.accountKey) return;
    if (data.documentId && documentId && data.documentId !== documentId) return;
    handleExecuteState(data);
    return;
  }

  if (type === 'RECEIPT') {
    if (data.accountKey && identity && data.accountKey !== identity.accountKey) return;
    if (data.documentId && documentId && data.documentId !== documentId) return;
    receipt = data;
    loadData().then(() => loadHistory()).then(() => showReceipt(data));
  }
});

async function handleScanState(state) {
  runState = state;
  if (/discovering|counting|stopping/.test(state.status)) {
    if (screens.main.classList.contains('hidden')) showMain();
    showProgress(true);
    updateProgress(state);
    return;
  }

  showProgress(false);
  await loadData();
  showMain();

  if (state.status === 'completed') {
    toast(`Scan complete — ${formatNumber(allSenders.length)} senders found.`);
  } else if (state.status === 'partial') {
    toast('Scan incomplete. The previous complete scan was kept; rescan when you are ready.', 'error');
  } else if (state.status === 'cancelled') {
    toast('Scan stopped. The last complete scan was kept.');
  } else if (state.status === 'failed') {
    toast('Scan failed: ' + (state.error || 'Gmail did not finish.'), 'error');
  }
}

async function handleExecuteState(state) {
  executeState = state;
  if (/executing|stopping/.test(state.status)) {
    showExecuting();
    updateExecute(state);
    return;
  }

  if (state.status === 'failed') {
    toast('Cleanup failed: ' + (state.error || 'Gmail did not confirm an outcome.'), 'error');
  }

  if (/completed|partial|unknown|cancelled|failed/.test(state.status)) {
    await loadData();
    await loadHistory();
    const entry = state.runId ? history.find(item => item.id === state.runId) : null;
    if (entry) showReceipt(entry);
    else showMain();
  }
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function ago(ts) {
  const delta = Date.now() - ts;
  const minute = 60e3, hour = 36e5, day = 864e5;
  if (delta < minute) return 'just now';
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`;
  if (delta < day) return `${Math.floor(delta / hour)}h ago`;
  if (delta < 30 * day) return `${Math.floor(delta / day)}d ago`;
  if (delta < 365 * day) return `${Math.floor(delta / (30 * day))}mo ago`;
  return `${Math.floor(delta / (365 * day))}y ago`;
}

function toast(text, type = 'info') {
  const element = document.createElement('div');
  element.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  element.setAttribute('role', 'status');
  element.textContent = text;
  document.body.appendChild(element);
  requestAnimationFrame(() => { requestAnimationFrame(() => element.classList.add('show')); });
  setTimeout(() => {
    element.classList.remove('show');
    setTimeout(() => element.remove(), 300);
  }, 5000);
  announce(text);
}

// ── Events ─────────────────────────────────────────────────────────────────────

$('btn-first-scan').addEventListener('click', startScan);
$('btn-refresh').addEventListener('click', startScan);
$('btn-history').addEventListener('click', () => {
  loadHistory().then(() => showReceipt(history[0] || null));
});
$('btn-blocked-primary').addEventListener('click', () => {
  if (blockedActions.primary) blockedActions.primary();
});
$('btn-blocked-secondary').addEventListener('click', () => {
  if (blockedActions.secondary) blockedActions.secondary();
});

$('search').addEventListener('input', event => {
  query = event.target.value;
  applyFilter();
  updateActionBar();
});

document.querySelectorAll('.sort-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(other => {
      other.classList.remove('active');
      other.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    sortBy = button.dataset.sort;
    applyFilter();
    updateActionBar();
  });
});

$('btn-select-shown').addEventListener('click', selectAllShown);
$('btn-select-all').addEventListener('click', selectAllResults);
$('btn-clear').addEventListener('click', clearSelection);
$('btn-show-hidden').addEventListener('click', showAllSelected);
$('btn-delete').addEventListener('click', () => openReview('trash'));
$('btn-archive').addEventListener('click', () => openReview('archive'));

['protect-starred', 'protect-important', 'protect-unread', 'before-date'].forEach(id => {
  $(id).addEventListener('change', policyChanged);
});
document.querySelectorAll('.preset-row [data-preset]').forEach(button => {
  button.addEventListener('click', () => applyPreset(button.dataset.preset));
});
$('btn-reset-options').addEventListener('click', resetOptions);

$('btn-cancel').addEventListener('click', closeModal);
$('btn-confirm').addEventListener('click', confirmReview);
$('btn-preview').addEventListener('click', () => {
  if (review && review.response && review.response.previewQuery) openSearch(review.response.previewQuery);
});

$('btn-stop').addEventListener('click', stopRun);
$('btn-stop-execute').addEventListener('click', stopExecute);

$('btn-open-trash').addEventListener('click', openTrash);
$('btn-review-mail').addEventListener('click', reviewAffectedMail);
$('btn-receipt-scan').addEventListener('click', startScan);
$('btn-receipt-back').addEventListener('click', () => {
  loadData().then(() => {
    if (snapshot || legacy) showMain();
    else showEmpty();
  });
});
$('btn-clear-history').addEventListener('click', clearHistory);

// ── Boot ───────────────────────────────────────────────────────────────────────

init();
