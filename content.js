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

// Gmail's newer list view infinite-scrolls instead of paginating: there is no
// Older button and no "1-100 of N" counter. A scroll round that adds no new
// conversation is treated as the end of the list after this many consecutive
// stalls, so a temporarily idle render doesn't stop the walk early.
const SCROLL_STALL_LIMIT = 3;

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
    'div[gh="tm"] div[role="button"][aria-label^="Older"]',
    'div[gh="tm"] div[aria-label^="Older"]',
    'div[gh="tm"] div[data-tooltip^="Older"]',
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

// Gmail's rows normally carry `data-legacy-thread-id`; `rowEl.id` is only a
// fallback and may be positional ("p0", "p1", …), which repeats on every page.
// A bare fallback would collapse page 2 into page 1's conversations, so
// qualify it with the page it was seen on. Rows with neither attribute stay
// id-less and are still dropped by the dedupe.
function extractRow(rowEl, pageIndex = 0) {
  const senderEl = rowEl.querySelector(SELECTORS.senderSpan);
  const dateEl = rowEl.querySelector(SELECTORS.dateSpan);
  const { name, email } = parseSenderFromAttrs({
    emailAttr: senderEl ? senderEl.getAttribute('email') : '',
    nameAttr: senderEl ? senderEl.getAttribute('name') : '',
  });
  const dateTs = parseDateFromTitle(dateEl ? dateEl.getAttribute('title') : '');
  const threadEl = rowEl.querySelector(`[${SELECTORS.threadIdAttr}]`);
  const threadId = rowEl.getAttribute(SELECTORS.threadIdAttr) ||
    (threadEl && threadEl.getAttribute(SELECTORS.threadIdAttr)) ||
    (rowEl.id ? `p${pageIndex}:${rowEl.id}` : '');
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
  const toolbar = [...document.querySelectorAll(SELECTORS.toolbar)].find(el => el.getClientRects().length);
  if (!toolbar) return null;

  let best = null;
  for (const el of toolbar.querySelectorAll('div, span')) {
    const text = el.textContent;
    if (!el.getClientRects().length || !text || text.length > 60) continue;
    const range = parseResultRange(text);
    if (range && (!best || text.length < best.length)) {
      best = { range, length: text.length };
    }
  }
  return best ? best.range : null;
}

function findOlderButton() {
  for (const selector of SELECTORS.olderButton) {
    for (const el of document.querySelectorAll(selector)) {
      if (el.getClientRects().length && el.getAttribute('aria-disabled') !== 'true' &&
          !el.hasAttribute('disabled')) return el;
    }
  }
  return null;
}

// Page-change signal. The dedupe key is page-qualified, so it cannot detect
// advancement (every page tags its rows identically). Signal on what Gmail
// actually re-rendered instead: row identity when it is available, plus row
// CONTENT (sender + date), which differs between real pages even when Gmail
// offers nothing but positional ids and no counter. A counter that advanced is
// a third, independent signal.
function rowSignature(rows) {
  return rows.map(row => `${row.threadId}|${row.email}|${row.dateTs}`).join('\n');
}

async function waitForPageChange(previousRows, previousRange, pageIndex = 0, timeoutMs = RENDER_TIMEOUT_MS) {
  const previousSignature = rowSignature(previousRows);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = extractVisibleRows(pageIndex);
    if (rows.length && rowSignature(rows) !== previousSignature) return true;
    const range = readResultRange();
    if (previousRange && range && range.start !== previousRange.start) return true;
    await sleep(200);
  }
  return false;
}

function extractVisibleRows(pageIndex = 0) {
  return [...document.querySelectorAll(SELECTORS.row)]
    .filter(el => el.getClientRects().length)
    .map(el => extractRow(el, pageIndex));
}

// Wait for a new query's visible result list. Gmail retains old hidden tables,
// and updates its search input before it finishes replacing the old results.
async function openScanSearch(query) {
  const input = document.querySelector('input[name="q"]');
  const sameQuery = input && input.value.trim() === query.trim() &&
    !/\/p\d+$/.test(location.hash);
  const previousFirstRow = [...document.querySelectorAll(SELECTORS.row)].find(el => el.getClientRects().length);
  const previousEmpty = [...document.querySelectorAll('td.TC')].filter(el => el.getClientRects().length);
  const previousRows = extractVisibleRows();
  const previousSignature = rowSignature(previousRows);
  location.hash = `search/${encodeURIComponent(query)}`;
  await waitForSearchQuery(query);
  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const rows = extractVisibleRows();
    const changed = rowSignature(rows) !== previousSignature;
    const firstRow = [...document.querySelectorAll(SELECTORS.row)].find(el => el.getClientRects().length);
    const replaced = firstRow && firstRow !== previousFirstRow;
    if (rows.length && (sameQuery || changed || replaced)) {
      await sleep(PAGE_SETTLE_MS);
      if (extractVisibleRows().length) return;
    }
    const empty = [...document.querySelectorAll('td.TC')].some(el =>
      el.getClientRects().length && (sameQuery || !previousEmpty.includes(el)) &&
      /no conversations|no messages/i.test(el.textContent));
    if (!rows.length && empty) return;
    await sleep(200);
  }
  throw new Error('Scan incomplete: Gmail did not finish loading the search results. Please retry.');
}

// Phase A: walk every rendered page of a category, then scroll only when Gmail
// provides no pagination control. Hidden tables never contribute scan rows.
async function scanCategory(op, onPage) {
  await openScanSearch(`category:${op}`);
  if (!extractVisibleRows().length) return [];

  const rows = [];
  const seen = new Set();
  let pages = 0;

  // Conversations are deduped on the way in, so the count of distinct
  // conversations is the size of `seen` — recounting `rows` would re-add ids
  // that `record` has already seen and report zero progress.
  const record = batch => {
    for (const row of batch) {
      if (row.threadId) {
        if (seen.has(row.threadId)) continue;
        seen.add(row.threadId);
      }
      rows.push(row);
    }
  };

  while (pages < MAX_PAGES_PER_CATEGORY) {
    await sleep(PAGE_SETTLE_MS);

    // Capture the page index once: these rows are tagged with it, and
    // waitForPageChange must compare them against rows tagged with the SAME
    // index. Passing the already-incremented `pages` would make every id
    // differ by its prefix and report a page change before Gmail re-rendered.
    const pageIndex = pages;

    let pageRows = extractVisibleRows(pageIndex);
    const range = readResultRange();

    // If Gmail rendered fewer rows than the page claims to hold, the list is
    // lazily filling — scroll once and re-read rather than losing the rest.
    const expected = range ? range.end - range.start + 1 : 0;
    if (expected && pageRows.length < expected) {
      await scrollListToBottom();
      await sleep(SCROLL_SETTLE_MS);
      pageRows = extractVisibleRows(pageIndex);
    }

    record(pageRows);
    pages += 1;
    if (onPage) onPage(pages, seen.size);

    // The counter is optional: an enabled Older button is enough to continue.
    // Never mistake a hidden/unparseable counter for the end of the mailbox.
    if (range && !hasMorePages(range)) break;

    const older = findOlderButton();
    if (older) {
      if (pages >= MAX_PAGES_PER_CATEGORY) throw new Error('Scan incomplete: category page safety limit reached.');
      older.click();
      if (!(await waitForPageChange(pageRows, range, pageIndex))) throw new Error('Scan incomplete: Gmail did not load the next page. Please retry.');
      continue;
    }

    // No Older button and no counter: Gmail is infinite-scrolling this view
    // rather than paginating it. Treating that as "end of category" is what
    // silently truncated large mailboxes to the first screenful, so keep
    // scrolling and accumulate until the list genuinely stops growing.
    //
    // Scroll rows are read with a FIXED index: this is one continuous list, so
    // re-tagging the same row with a new page index each round would give it a
    // fresh id and defeat the dedupe that counts conversations.
    const before = seen.size;
    let grew = false;
    for (let attempt = 0; attempt < SCROLL_STALL_LIMIT; attempt += 1) {
      await scrollListToBottom();
      await sleep(SCROLL_SETTLE_MS);
      record(extractVisibleRows(0));
      if (seen.size > before) { grew = true; break; }
    }
    if (!grew) {
      // The list stopped growing. If Gmail still claims more pages, the walk
      // is incomplete and must be reported rather than cached as a full scan.
      if (range && hasMorePages(range)) throw new Error('Scan incomplete: Gmail reports more pages but this view stopped loading rows. Please retry.');
      break;
    }
    if (onPage) onPage(pages, seen.size);
  }

  if (pages >= MAX_PAGES_PER_CATEGORY) throw new Error('Scan incomplete: category page safety limit reached.');
  return dedupeRowsByThreadId(rows);
}

// Phase B: ask Gmail how many messages this sender actually has across All
// Mail, instead of trusting how many happened to land in the scanned pages.
// This is the same scope the delete step uses, so the number shown is the
// number that will be trashed. Returns null when Gmail won't give an exact
// total (an estimated "of many" result, or no counter at all).
async function countSenderExactly(email) {
  const query = buildSenderQuery(email);
  // A query/input change alone is not evidence that the old counter was
  // replaced. Use the same visible-result readiness check as discovery.
  const landed = await openScanSearch(query).then(() => true, () => false);
  if (!landed) return null;

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
    if (input && input.value.trim() === query.trim()) return;
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

  // The banner is what widens the selection from this page's ~100 visible rows to
  // every matching conversation. Without it Trash would move only the visible
  // page, so a missing banner must fail the chunk rather than under-delete
  // silently and report it as the whole set.
  const matchingLink = await waitForElement(SELECTORS.selectAllMatchingLink, 5000).catch(() => null);
  if (!matchingLink) {
    throw new Error('Gmail\'s layout may have changed — the "select all conversations that match" banner is unavailable, so only the visible page would have been deleted. Nothing was deleted; please retry.');
  }
  matchingLink.click();

  const trash = await waitForElement(SELECTORS.trashButton);
  trash.click();
  await sleep(1000); // let Gmail's own delete animation/toast finish before navigating again

  return await verifyChunkEmpty();
}

// Post-state evidence for one chunk: after trashing everything matching the
// chunk's own query, that query should come back with no rows. Rows still there
// means the outcome is unknown — not success.
async function verifyChunkEmpty() {
  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (!document.querySelector(SELECTORS.row)) return true;
    await sleep(200);
  }
  return false;
}

let deleteState = { status: 'idle', chunk: 0, total: 0, error: null };

async function doDelete(emails) {
  const queries = InboxCleanerParsing.buildFromQueries(emails);
  deleteState = { status: 'deleting', chunk: 0, total: queries.length, error: null };
  broadcast('DELETE_STATE', { ...deleteState });

  let unverified = 0;
  for (let i = 0; i < queries.length; i++) {
    if (!(await selectAllMatchingAndTrash(queries[i]))) unverified += 1;
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

  // Completion is only claimed when every chunk was verified; anything left
  // unverified is reported as partial rather than as a finished deletion.
  deleteState = {
    status: unverified ? 'unverified' : 'done',
    chunk: queries.length, total: queries.length, unverified, error: null,
  };
  broadcast('DELETE_STATE', { ...deleteState });
}

// `msg.emails` crosses a trust boundary (any extension page can send it), and a
// duplicate or differently-cased address would be actioned twice — so
// normalize once, here.
function normalizeAddresses(emails) {
  const list = Array.isArray(emails) ? emails : [];
  const seen = new Set();
  const unique = [];
  for (const raw of list) {
    const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (!email.includes('@') || seen.has(email)) continue;
    seen.add(email);
    unique.push(email);
  }
  return unique;
}

chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg.type === 'DELETE') {
    if (deleteState.status === 'deleting') {
      respond({ ok: false, reason: 'already running' });
      return true;
    }
    const emails = normalizeAddresses(msg.emails);
    if (!emails.length) {
      respond({ ok: false, reason: 'no valid email addresses' });
      return true;
    }
    doDelete(emails).catch(e => {
      deleteState = { status: 'error', chunk: 0, total: 0, error: e.message };
      broadcast('DELETE_ERROR', e.message);
    });
    respond({ ok: true });
    return true;
  }
});
