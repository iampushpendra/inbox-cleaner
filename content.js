// content.js — Inbox Cleaner content script (Gmail DOM automation)

const {
  parseSenderFromAttrs,
  parseDateFromTitle,
  dedupeRowsByThreadId,
  mergeCategoryResults,
  finalizeSenders,
  parseResultRange,
  hasMorePages,
  buildSenderQuery,
  applyExactCounts,
} = self.InboxCleanerParsing;

// Gmail's own `category:` search operator names (lowercase, matches what a
// user would type in the search box) mapped to the display label popup.css
// already has badge colors for (uppercase, matching the old Gmail API's
// category label suffixes).
const CATEGORIES = [
  { op: 'primary', label: 'PRIMARY' },
  { op: 'social', label: 'SOCIAL' },
  { op: 'promotions', label: 'PROMOTIONS' },
  { op: 'updates', label: 'UPDATES' },
  { op: 'forums', label: 'FORUMS' },
];

const RENDER_TIMEOUT_MS = 15000;
const SCROLL_SETTLE_MS = 700;
const PAGE_SETTLE_MS = 400;

// Gmail caps its own list at 100 conversations per page, so this is a runaway
// guard, not a product limit: 500 pages is ~50k conversations per category.
const MAX_PAGES_PER_CATEGORY = 500;

// Phase B costs one Gmail search per sender (~1-2s each). Counting every sender
// in a long tail would run for an hour, so only the heaviest senders get an
// exact total; the rest keep their sampled count and are flagged inexact.
const MAX_SENDERS_TO_COUNT = 250;

// These target Gmail's classic list-view markup. Gmail does not publish a
// stable API for its own DOM — if a scan/delete step starts throwing
// "Gmail's layout may have changed" errors, open Gmail in DevTools, inspect
// the relevant element, and update ONLY this object (see Task 3 Step 1 and
// Task 4 Step 1 for the verification procedure).
const SELECTORS = {
  row: 'tr.zA',
  senderSpan: 'span[email]',
  dateSpan: 'td.xW span[title]',
  threadIdAttr: 'data-legacy-thread-id',
  selectAllCheckbox: 'div[gh="tm"] div[role="checkbox"]',
  selectAllMatchingLink: 'span.Dj',
  toolbar: 'div[gh="tm"]',
  // Tried in order; the first one present and not aria-disabled wins. Like
  // trashButton, these are English-UI only.
  olderButton: [
    'div[gh="tm"] div[role="button"][aria-label="Older"]',
    'div[gh="tm"] div[aria-label="Older"]',
    'div[gh="tm"] div[data-tooltip="Older"]',
  ],
  // aria-label is localized by Gmail's UI language — this only matches an
  // English-language Gmail UI. Non-English locales will time out here.
  trashButton: 'div[gh="tm"] div[aria-label="Delete"]',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForElement(selector, timeoutMs = RENDER_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) { resolve(existing); return; }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Gmail's layout may have changed — could not find "${selector}"`));
    }, timeoutMs);
  });
}

function extractRow(rowEl) {
  const senderEl = rowEl.querySelector(SELECTORS.senderSpan);
  const dateEl = rowEl.querySelector(SELECTORS.dateSpan);
  const { name, email } = parseSenderFromAttrs({
    emailAttr: senderEl ? senderEl.getAttribute('email') : '',
    nameAttr: senderEl ? senderEl.getAttribute('name') : '',
  });
  const dateTs = parseDateFromTitle(dateEl ? dateEl.getAttribute('title') : '');
  const threadId = rowEl.getAttribute(SELECTORS.threadIdAttr) || rowEl.id || '';
  return { name, email, dateTs, threadId };
}

function findScrollableAncestor(el) {
  let node = el;
  while (node && node !== document.body) {
    if (node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

function findListContainer() {
  const anyRow = document.querySelector(SELECTORS.row);
  return anyRow ? findScrollableAncestor(anyRow) : null;
}

async function scrollListToBottom() {
  const container = findListContainer();
  if (!container) return;
  container.scrollTop = container.scrollHeight;
  container.dispatchEvent(new Event('scroll', { bubbles: true }));
}

// Gmail's "1-100 of 12,847" counter. Read by text rather than class name so a
// Gmail CSS reshuffle doesn't silently break pagination; the tightest-matching
// element wins so an outer container's stray digits can't be misread.
function readResultRange() {
  const toolbar = document.querySelector(SELECTORS.toolbar);
  if (!toolbar) return null;

  let best = null;
  for (const el of toolbar.querySelectorAll('div, span')) {
    const text = el.textContent;
    if (!text || text.length > 60) continue;
    const range = parseResultRange(text);
    if (range && (!best || text.length < best.length)) {
      best = { range, length: text.length };
    }
  }
  return best ? best.range : null;
}

function findOlderButton() {
  for (const selector of SELECTORS.olderButton) {
    const el = document.querySelector(selector);
    if (el && el.getAttribute('aria-disabled') !== 'true') return el;
  }
  return null;
}

async function waitForRangeChange(previousStart, timeoutMs = RENDER_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const range = readResultRange();
    if (range && range.start !== previousStart) return true;
    await sleep(200);
  }
  return false;
}

function extractVisibleRows() {
  return [...document.querySelectorAll(SELECTORS.row)].map(extractRow);
}

// Phase A: walk every page of a category, not just the first one. Gmail
// paginates (Older/Newer) rather than infinite-scrolling, so the previous
// scroll-until-stable approach always stopped at page 1.
async function scanCategory(op, onPage) {
  location.hash = `search/category:${op}`;
  try {
    await waitForElement(SELECTORS.row);
  } catch {
    return []; // empty category — nothing to paginate
  }

  const rows = [];
  let pages = 0;

  while (pages < MAX_PAGES_PER_CATEGORY) {
    await sleep(PAGE_SETTLE_MS);

    let pageRows = extractVisibleRows();
    const range = readResultRange();

    // If Gmail rendered fewer rows than the page claims to hold, the list is
    // lazily filling — scroll once and re-read rather than losing the rest.
    const expected = range ? range.end - range.start + 1 : 0;
    if (expected && pageRows.length < expected) {
      await scrollListToBottom();
      await sleep(SCROLL_SETTLE_MS);
      pageRows = extractVisibleRows();
    }

    rows.push(...pageRows);
    pages += 1;
    if (onPage) onPage(pages, rows.length);

    if (!hasMorePages(range)) break;

    const older = findOlderButton();
    if (!older) break;

    older.click();
    if (!(await waitForRangeChange(range.start))) break;
  }

  return dedupeRowsByThreadId(rows);
}

// Phase B: ask Gmail how many messages this sender actually has across All
// Mail, instead of trusting how many happened to land in the scanned pages.
// This is the same scope the delete step uses, so the number shown is the
// number that will be trashed. Returns null when Gmail won't give an exact
// total (an estimated "of many" result, or no counter at all).
async function countSenderExactly(email) {
  const query = buildSenderQuery(email);
  location.hash = `search/${encodeURIComponent(query)}`;
  await waitForSearchQuery(query).catch(() => {});

  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const range = readResultRange();
    if (range) return range.estimated ? null : range.total;
    await sleep(200);
  }
  return null;
}

let scanState = {
  status: 'idle', phase: 'pages', done: 0, total: CATEGORIES.length, detail: '', error: null,
};

function broadcast(type, data) {
  chrome.runtime.sendMessage({ type, data }).catch(() => {});
}

function setScanState(patch) {
  scanState = { ...scanState, ...patch };
  broadcast('SCAN_STATE', { ...scanState });
}

async function doScan() {
  // ── Phase A: paginate every category and collect the senders ──────────────
  setScanState({
    status: 'scanning', phase: 'pages', done: 0, total: CATEGORIES.length, detail: '', error: null,
  });

  let accumulator = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const rows = await scanCategory(cat.op, (pages, rowsSoFar) => {
      setScanState({ detail: `${cat.label} · page ${pages} · ${rowsSoFar} rows` });
    });
    accumulator = mergeCategoryResults(accumulator, cat.label, rows);
    setScanState({ done: i + 1 });
  }

  let senders = finalizeSenders(accumulator);

  // ── Phase B: replace sampled counts with Gmail's own All Mail totals ──────
  const targets = senders.slice(0, MAX_SENDERS_TO_COUNT);
  setScanState({ phase: 'counts', done: 0, total: targets.length, detail: '' });

  const exactCounts = {};
  for (let i = 0; i < targets.length; i++) {
    const sender = targets[i];
    try {
      exactCounts[sender.email] = await countSenderExactly(sender.email);
    } catch {
      exactCounts[sender.email] = null; // stays inexact rather than failing the scan
    }
    setScanState({ done: i + 1, detail: sender.email });
  }

  senders = applyExactCounts(senders, exactCounts);
  const total = senders.reduce((sum, s) => sum + s.count, 0);
  const exactCount = senders.filter(s => s.exact).length;

  await chrome.storage.local.set({
    inboxCleanerData: { senders, scannedAt: Date.now(), total, exactCount },
  });

  setScanState({ status: 'done', detail: '' });
}

chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg.type === 'GET_SCAN_STATE') {
    respond({ ok: true, scanState });
    return true;
  }

  if (msg.type === 'START_SCAN') {
    if (scanState.status === 'scanning') {
      respond({ ok: false, reason: 'already running' });
    } else {
      doScan().catch(e => {
        scanState = { status: 'error', category: 0, total: CATEGORIES.length, error: e.message };
        broadcast('SCAN_STATE', { ...scanState });
      });
      respond({ ok: true });
    }
    return true;
  }
});

async function waitForSearchQuery(query, timeoutMs = RENDER_TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const input = document.querySelector('input[name="q"]');
    if (input && input.value === query) return;
    await sleep(200);
  }
  throw new Error(`Gmail's layout may have changed — search box never reflected the query "${query}"`);
}

async function selectAllMatchingAndTrash(query) {
  location.hash = `search/${encodeURIComponent(query)}`;
  await waitForSearchQuery(query);
  await waitForElement(SELECTORS.selectAllCheckbox);
  await sleep(500); // let the result list settle before selecting

  const checkbox = document.querySelector(SELECTORS.selectAllCheckbox);
  checkbox.click();

  const matchingLink = await waitForElement(SELECTORS.selectAllMatchingLink, 5000).catch(() => null);
  if (matchingLink) matchingLink.click();

  const trash = await waitForElement(SELECTORS.trashButton);
  trash.click();
  await sleep(1000); // let Gmail's own delete animation/toast finish before navigating again
}

let deleteState = { status: 'idle', chunk: 0, total: 0, error: null };

async function doDelete(emails) {
  const queries = InboxCleanerParsing.buildFromQueries(emails);
  deleteState = { status: 'deleting', chunk: 0, total: queries.length, error: null };
  broadcast('DELETE_STATE', { ...deleteState });

  for (let i = 0; i < queries.length; i++) {
    await selectAllMatchingAndTrash(queries[i]);
    deleteState = { status: 'deleting', chunk: i + 1, total: queries.length, error: null };
    broadcast('DELETE_STATE', { ...deleteState });
  }

  const stored = (await chrome.storage.local.get('inboxCleanerData')).inboxCleanerData;
  if (stored) {
    const deletedEmails = new Set(emails);
    stored.senders = stored.senders.filter(s => !deletedEmails.has(s.email));
    stored.total = stored.senders.reduce((sum, s) => sum + s.count, 0);
    await chrome.storage.local.set({ inboxCleanerData: stored });
  }

  deleteState = { status: 'done', chunk: queries.length, total: queries.length, error: null };
  broadcast('DELETE_STATE', { ...deleteState });
}

chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg.type === 'DELETE') {
    doDelete(msg.emails).catch(e => {
      deleteState = { status: 'error', chunk: 0, total: 0, error: e.message };
      broadcast('DELETE_ERROR', e.message);
    });
    respond({ ok: true });
    return true;
  }
});
