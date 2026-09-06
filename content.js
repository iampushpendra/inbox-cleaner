// content.js — Inbox Cleaner content script (Gmail DOM automation)

const {
  parseSenderFromAttrs,
  parseDateFromTitle,
  dedupeRowsByThreadId,
  mergeCategoryResults,
  finalizeSenders,
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

const SCROLL_STABLE_LIMIT = 3;
const RENDER_TIMEOUT_MS = 15000;
const SCROLL_SETTLE_MS = 700;

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

async function scrollUntilStable() {
  let stableCount = 0;
  let lastRowCount = -1;

  while (stableCount < SCROLL_STABLE_LIMIT) {
    const container = findListContainer();
    if (container) {
      container.scrollTop = container.scrollHeight;
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
    }
    await sleep(SCROLL_SETTLE_MS);

    const rowCount = document.querySelectorAll(SELECTORS.row).length;
    if (rowCount === lastRowCount) {
      stableCount += 1;
    } else {
      stableCount = 0;
      lastRowCount = rowCount;
    }
  }
}

async function scanCategory(op) {
  location.hash = `search/category:${op}`;
  try {
    await waitForElement(SELECTORS.row);
  } catch {
    return []; // empty category — no rows to scroll or extract
  }
  await scrollUntilStable();

  const rows = [...document.querySelectorAll(SELECTORS.row)].map(extractRow);
  return dedupeRowsByThreadId(rows);
}

let scanState = { status: 'idle', category: 0, total: CATEGORIES.length, error: null };

function broadcast(type, data) {
  chrome.runtime.sendMessage({ type, data }).catch(() => {});
}

async function doScan() {
  scanState = { status: 'scanning', category: 0, total: CATEGORIES.length, error: null };
  broadcast('SCAN_STATE', { ...scanState });

  let accumulator = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const rows = await scanCategory(cat.op);
    accumulator = mergeCategoryResults(accumulator, cat.label, rows);

    scanState = { status: 'scanning', category: i + 1, total: CATEGORIES.length, error: null };
    broadcast('SCAN_STATE', { ...scanState });
  }

  const senders = finalizeSenders(accumulator);
  const total = senders.reduce((sum, s) => sum + s.count, 0);

  await chrome.storage.local.set({
    inboxCleanerData: { senders, scannedAt: Date.now(), total },
  });

  scanState = { status: 'done', category: CATEGORIES.length, total: CATEGORIES.length, error: null };
  broadcast('SCAN_STATE', { ...scanState });
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
