// content.js — Inbox Cleaner content script (Gmail DOM automation)
//
// The content script is the enforcement point for account binding and mutation
// (roadmap R03–R09). The popup is UX only: it can be closed at any moment, so
// every destructive boundary re-reads the account from this tab's live DOM.

const {
  parseSenderFromAttrs,
  parseDateFromTitle,
  dedupeRowsByThreadId,
  mergeCategoryResults,
  finalizeSenders,
  parseResultRange,
  hasMorePages,
  buildSenderQuery,
  applyCountResults,
  normalizeAddresses,
  normalizePolicy,
  policyOperators,
  buildPolicyChunks,
  ACTIONS,
  chooseIdentity,
  accountSnapshot,
  migrateContainer,
  putAccountSnapshot,
  isActionableSnapshot,
  appendHistory,
  receiptStatus,
} = self.InboxCleanerParsing;

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
const MAX_PAGES_PER_CATEGORY = 500;
const SCROLL_STALL_LIMIT = 3;
const MAX_SENDERS_TO_COUNT = 250;
const SETTLE_AFTER_ACTION_MS = 1000;

const SELECTORS = {
  row: 'tr.zA',
  senderSpan: 'span[email]',
  dateSpan: 'td.xW span[title]',
  threadIdAttr: 'data-legacy-thread-id',
  selectAllCheckbox: 'div[gh="tm"] div[role="checkbox"]',
  selectAllMatchingLink: 'span.Dj',
  toolbar: 'div[gh="tm"]',
  olderButton: [
    'div[gh="tm"] div[role="button"][aria-label^="Older"]',
    'div[gh="tm"] div[aria-label^="Older"]',
    'div[gh="tm"] div[data-tooltip^="Older"]',
  ],
  // aria-label is localized by Gmail's UI language — these only match an
  // English-language Gmail UI. Unsupported locales fail closed at the control.
  actionButtons: {
    trash: 'div[gh="tm"] div[aria-label="Delete"]',
    archive: 'div[gh="tm"] div[aria-label="Archive"]',
  },
};

// The account control is Gmail's top-right avatar/account link. The address is
// taken from an attribute by regex, never from the words around it, so a
// localized UI still matches. Any ambiguity fails closed (R03 design §3).
const ACCOUNT_SELECTORS = [
  'a[aria-label*="@"]',
  '[role="button"][aria-label*="@"]',
  'img[alt*="@"]',
  '[title*="Google Account"]',
];

const DOCUMENT_ID = (() => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* no crypto in some test contexts */ }
  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
})();

function createId(prefix) {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch { /* fall through */ }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CancelledError extends Error {}
class BoundaryError extends Error {
  constructor(reason, message) {
    super(message || reason);
    this.reason = reason;
  }
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

function isEmptyResults() {
  return [...document.querySelectorAll('td.TC')].some(el =>
    el.getClientRects().length && /no conversations|no messages/i.test(el.textContent));
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

async function waitForSearchQuery(query, timeoutMs = RENDER_TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const input = document.querySelector('input[name="q"]');
    if (input && input.value.trim() === query.trim()) return;
    await sleep(200);
  }
  throw new Error(`Gmail's layout may have changed — search box never reflected the query "${query}"`);
}

function throwIfCancelled() {
  if (cancelRequested) throw new CancelledError('Stopped by you');
}

// ── Account identity ───────────────────────────────────────────────────────────

function resolveIdentity() {
  const texts = [];
  for (const selector of ACCOUNT_SELECTORS) {
    for (const el of document.querySelectorAll(selector)) {
      if (el.getClientRects && !el.getClientRects().length) continue;
      for (const attr of ['aria-label', 'title', 'alt']) {
        const value = el.getAttribute ? el.getAttribute(attr) : '';
        if (value) texts.push(value);
      }
    }
  }
  return chooseIdentity({
    texts,
    pathname: typeof location !== 'undefined' ? location.pathname : '',
    documentId: DOCUMENT_ID,
    source: 'avatar',
  });
}

// ── Scan ───────────────────────────────────────────────────────────────────────

async function scanCategory(op, onPage) {
  throwIfCancelled();
  await openScanSearch(`category:${op}`);
  if (!extractVisibleRows().length) return [];

  const rows = [];
  const seen = new Set();
  let pages = 0;

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
    throwIfCancelled();
    await sleep(PAGE_SETTLE_MS);
    const pageIndex = pages;

    let pageRows = extractVisibleRows(pageIndex);
    const range = readResultRange();

    const expected = range ? range.end - range.start + 1 : 0;
    if (expected && pageRows.length < expected) {
      await scrollListToBottom();
      await sleep(SCROLL_SETTLE_MS);
      pageRows = extractVisibleRows(pageIndex);
    }

    record(pageRows);
    pages += 1;
    if (onPage) onPage(pages, seen.size);

    if (range && !hasMorePages(range)) break;

    const older = findOlderButton();
    if (older) {
      if (pages >= MAX_PAGES_PER_CATEGORY) throw new Error('Scan incomplete: category page safety limit reached.');
      older.click();
      if (!(await waitForPageChange(pageRows, range, pageIndex))) throw new Error('Scan incomplete: Gmail did not load the next page. Please retry.');
      continue;
    }

    const before = seen.size;
    let grew = false;
    for (let attempt = 0; attempt < SCROLL_STALL_LIMIT; attempt += 1) {
      throwIfCancelled();
      await scrollListToBottom();
      await sleep(SCROLL_SETTLE_MS);
      record(extractVisibleRows(0));
      if (seen.size > before) { grew = true; break; }
    }
    if (!grew) {
      // Gmail still claims more pages but the list stopped producing rows. This
      // is a partial result, not a complete scan (R07), so it must never be
      // cached as complete or acted on.
      if (range && hasMorePages(range)) {
        const error = new Error('Scan incomplete: Gmail reports more pages but this view stopped loading rows. Please retry.');
        error.partialRows = dedupeRowsByThreadId(rows);
        throw error;
      }
      break;
    }
    if (onPage) onPage(pages, seen.size);
  }

  if (pages >= MAX_PAGES_PER_CATEGORY) throw new Error('Scan incomplete: category page safety limit reached.');
  return dedupeRowsByThreadId(rows);
}

async function countQueryTotal(query) {
  throwIfCancelled();
  const landed = await openScanSearch(query).then(() => true, () => false);
  if (!landed) return { status: 'unknown', reason: 'Gmail did not finish loading the search' };

  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    throwIfCancelled();
    const range = readResultRange();
    if (range) {
      if (range.estimated || range.total === null) {
        return { status: 'unknown', reason: 'Gmail reports "of many"' };
      }
      return { status: 'exact', total: range.total };
    }
    if (!extractVisibleRows().length && isEmptyResults()) return { status: 'exact', total: 0 };
    await sleep(200);
  }
  return { status: 'unknown', reason: 'Gmail did not show a result count' };
}

// Backwards-compatible wrapper used by the focused count tests.
async function countSenderExactly(email) {
  const result = await countQueryTotal(buildSenderQuery(email));
  return result.status === 'exact' ? result.total : null;
}

let scanState = { status: 'idle', phase: 'discovering', done: 0, total: CATEGORIES.length, detail: '', error: null };
let executeState = { status: 'idle', action: 'trash', chunk: 0, total: 0, detail: '', error: null };
let activeRun = null;
let cancelRequested = false;
let countBusy = false;
let lastReview = null; // last COUNT_POLICY result this document produced

function broadcast(type, data) {
  try {
    const sent = chrome.runtime.sendMessage({ type, data });
    if (sent && sent.catch) sent.catch(() => {});
  } catch { /* popup closed */ }
}

function runPayload(state, kind) {
  const run = activeRun && (!kind || activeRun.kind === kind) ? activeRun : null;
  return {
    ...state,
    accountKey: run ? run.accountKey : null,
    documentId: DOCUMENT_ID,
    runId: run ? run.id : null,
  };
}

function setScanState(patch) {
  scanState = { ...scanState, ...patch };
  broadcast('SCAN_STATE', runPayload(scanState, 'scan'));
}

async function readStorage(key) {
  try {
    const data = await chrome.storage.local.get(key);
    return data ? data[key] : undefined;
  } catch {
    return undefined;
  }
}

async function writeStorage(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

async function startScan(tabId, expectedAccount) {
  const identity = resolveIdentity();
  if (!identity.accountKey) {
    return { ok: false, reason: identity.ambiguous ? 'identity-ambiguous' : 'identity-unknown' };
  }
  if (expectedAccount && identity.accountKey !== expectedAccount) {
    return { ok: false, reason: 'identity-mismatch' };
  }
  if (activeRun || countBusy) return { ok: false, reason: 'run-busy' };

  const binding = {
    id: createId('scan'),
    kind: 'scan',
    accountKey: identity.accountKey,
    uIndex: identity.uIndex,
    tabId: Number.isInteger(tabId) ? tabId : null,
    documentId: DOCUMENT_ID,
    startedAt: Date.now(),
  };
  activeRun = binding;
  cancelRequested = false;
  scanState = {
    status: 'discovering', phase: 'discovering', done: 0, total: CATEGORIES.length,
    detail: '', error: null, startedAt: binding.startedAt,
  };
  broadcast('SCAN_STATE', runPayload(scanState, 'scan'));

  doScan(binding).catch(error => {
    if (error instanceof CancelledError) {
      scanState = {
        ...scanState, status: 'cancelled',
        error: 'Stopped by you. The last complete scan was kept.',
      };
    } else {
      scanState = {
        ...scanState, status: 'failed',
        phase: 'discovering', error: error.message,
      };
    }
    broadcast('SCAN_STATE', runPayload(scanState, 'scan'));
    activeRun = null;
  });

  return { ok: true, runId: binding.id, accountKey: identity.accountKey, documentId: DOCUMENT_ID };
}

async function doScan(binding) {
  let accumulator = {};
  const seenThreads = new Set();
  let partialReason = '';

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    let rows;
    try {
      rows = await scanCategory(cat.op, (pages, rowsSoFar) => {
        setScanState({ detail: `${cat.label} · page ${pages} · ${rowsSoFar} rows` });
      });
    } catch (error) {
      if (error instanceof CancelledError) throw error;
      if (!error.partialRows) throw error;
      rows = error.partialRows;
      partialReason = error.message;
    }

    // Global conversation dedupe across categories (C-5): a thread that appears
    // in PRIMARY and SOCIAL contributes once, not once per category.
    const fresh = rows.filter(row => !row.threadId || !seenThreads.has(row.threadId));
    for (const row of fresh) if (row.threadId) seenThreads.add(row.threadId);
    accumulator = mergeCategoryResults(accumulator, cat.label, fresh);
    setScanState({ done: i + 1 });
    if (partialReason) break;
  }

  let senders = finalizeSenders(accumulator);
  const discoveredConversations = seenThreads.size;
  const targets = senders.slice(0, MAX_SENDERS_TO_COUNT);

  if (!partialReason) {
    setScanState({ phase: 'counting', done: 0, total: targets.length, detail: '' });
    const results = {};
    for (let i = 0; i < targets.length; i++) {
      throwIfCancelled();
      const sender = targets[i];
      try {
        results[sender.email] = await countQueryTotal(buildSenderQuery(sender.email));
      } catch (error) {
        if (error instanceof CancelledError) throw error;
        results[sender.email] = { status: 'unknown', reason: 'Gmail did not answer the count' };
      }
      setScanState({ done: i + 1, detail: sender.email });
    }
    senders = applyCountResults(senders, results);
  }

  // Re-resolve identity after discovery. A scan that started on A and ended on
  // B is discarded; it is never written into either account's snapshot (B-2).
  const identity = resolveIdentity();
  if (!identity.accountKey || identity.accountKey !== binding.accountKey) {
    throw new Error('The Gmail account changed during the scan, so the results were discarded. Rescan this account.');
  }

  const endedAt = Date.now();
  const snapshot = {
    accountKey: binding.accountKey,
    uIndex: binding.uIndex,
    tabId: binding.tabId,
    documentId: DOCUMENT_ID,
    scannedAt: endedAt,
    unit: 'conversations',
    discoveryScope: CATEGORIES.map(cat => `category:${cat.op}`).join(','),
    partial: Boolean(partialReason),
    viewOnly: false,
    senders,
    discoveredConversations,
    exactCount: senders.filter(sender => sender.confidence === 'exact').length,
    total: senders.reduce((sum, sender) => sum + sender.count, 0),
    reason: partialReason || null,
  };

  const raw = await readStorage('inboxCleanerData');
  const box = migrateContainer(raw);

  if (partialReason) {
    const existing = accountSnapshot(box, binding.accountKey);
    if (existing && existing.senders && existing.partial !== true) {
      existing.partialScan = {
        scannedAt: endedAt, senders, discoveredConversations, reason: partialReason,
      };
      box.accounts = { ...box.accounts, [binding.accountKey]: existing };
    } else {
      box.accounts = { ...box.accounts, [binding.accountKey]: snapshot };
    }
    await writeStorage('inboxCleanerData', box);
    scanState = {
      ...scanState, status: 'partial', phase: 'discovering',
      error: partialReason,
    };
    broadcast('SCAN_STATE', runPayload(scanState, 'scan'));
    activeRun = null;
    return;
  }

  await writeStorage('inboxCleanerData', putAccountSnapshot(box, binding.accountKey, snapshot));
  scanState = {
    ...scanState, status: 'completed', phase: 'counting',
    done: scanState.total, detail: '',
  };
  broadcast('SCAN_STATE', runPayload(scanState, 'scan'));
  activeRun = null;
}

// ── Review count (read-only) ────────────────────────────────────────────────────

function assertBoundary(accountKey) {
  if (!accountKey) throw new BoundaryError('identity-required', 'No verified account was supplied.');
  const identity = resolveIdentity();
  if (!identity.accountKey) {
    throw new BoundaryError('identity-unknown', 'The Gmail account could not be verified.');
  }
  if (identity.accountKey !== accountKey) {
    throw new BoundaryError('identity-changed', 'The Gmail account changed. Nothing further was moved.');
  }
}

async function countPolicy(policy, expectedAccount) {
  if (!expectedAccount) return { ok: false, reason: 'identity-required' };
  if (activeRun || countBusy) return { ok: false, reason: 'run-busy' };

  countBusy = true;
  try {
    const identity = resolveIdentity();
    if (!identity.accountKey) return { ok: false, reason: 'identity-unknown' };
    if (identity.accountKey !== expectedAccount) return { ok: false, reason: 'identity-mismatch' };

    const snapshotRaw = await readStorage('inboxCleanerData');
    const snapshot = accountSnapshot(snapshotRaw, expectedAccount);
    if (!isActionableSnapshot(snapshot, expectedAccount)) {
      return { ok: false, reason: 'snapshot-unbound' };
    }

    const chunks = buildPolicyChunks(policy);
    if (!chunks.length) return { ok: false, reason: 'no-senders' };

    const results = [];
    for (const chunk of chunks) {
      assertBoundary(expectedAccount);
      const counted = await countQueryTotal(chunk.query);
      results.push({ query: chunk.query, status: counted.status, total: counted.total, reason: counted.reason });
    }
    const allExact = results.every(result => result.status === 'exact');
    const sum = allExact ? results.reduce((total, result) => total + result.total, 0) : null;
    // A single chunk's Gmail counter is exact for that union query. With more
    // than one chunk the sum is only an upper bound until C-8's Gmail behaviour
    // is confirmed in a disposable mailbox (C-19), so it never becomes `total`.
    const union = !allExact
      ? {
        status: 'unknown',
        total: null,
        upperBound: null,
        reason: (results.find(result => result.reason) || {}).reason || 'Gmail did not give an exact count',
      }
      : chunks.length === 1
        ? { status: 'exact', total: sum, upperBound: null, reason: '' }
        : {
          status: 'bounded',
          total: null,
          upperBound: sum,
          reason: 'summed across batches; a conversation can match more than one batch',
        };
    lastReview = {
      accountKey: expectedAccount,
      policyKey: chunks.map(chunk => chunk.query).join('|'),
      total: union.total,
      confidence: union.status,
    };
    return {
      ok: true,
      accountKey: expectedAccount,
      uIndex: identity.uIndex,
      documentId: DOCUMENT_ID,
      policy,
      chunks: results,
      union,
      previewQuery: chunks[0].query,
    };
  } catch (error) {
    return { ok: false, reason: error.reason || 'identity-changed', error: error.message };
  } finally {
    countBusy = false;
  }
}

// ── Execute (Trash / Archive) ──────────────────────────────────────────────────

function normalizeAction(value) {
  return value === 'archive' ? 'archive' : 'trash';
}

async function selectAllMatchingAndAction(query, action, accountKey) {
  await openScanSearch(query);
  await waitForElement(SELECTORS.selectAllCheckbox);
  await sleep(500);
  throwIfCancelled();

  const checkbox = document.querySelector(SELECTORS.selectAllCheckbox);
  checkbox.click();

  const matchingLink = await waitForElement(SELECTORS.selectAllMatchingLink, 5000).catch(() => null);
  if (!matchingLink) {
    throw new Error('Gmail\'s "select all conversations that match" control is unavailable, so only the visible page would have been affected. Nothing was moved.');
  }
  matchingLink.click();

  const selector = SELECTORS.actionButtons[action] || SELECTORS.actionButtons.trash;
  const control = await waitForElement(selector);
  // Last boundary check before the only click that moves mail (R03 §8 B-c).
  assertBoundary(accountKey);
  control.click();
  await sleep(SETTLE_AFTER_ACTION_MS);

  return await verifyChunkEmpty();
}

async function verifyChunkEmpty() {
  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (!document.querySelector(SELECTORS.row)) return true;
    await sleep(200);
  }
  return false;
}

async function startExecute(payload) {
  const policy = normalizePolicy(payload.policy || { emails: payload.emails, action: payload.action });
  const action = normalizeAction(policy.action);
  const accountKey = payload.expectedAccount;

  if (!accountKey) return { ok: false, reason: 'identity-required' };
  if (payload.expectedDocumentId && payload.expectedDocumentId !== DOCUMENT_ID) {
    return { ok: false, reason: 'interrupted-document' };
  }
  if (activeRun) return { ok: false, reason: 'run-busy' };
  if (countBusy) return { ok: false, reason: 'run-busy' };
  if (!policy.emails.length) return { ok: false, reason: 'no-senders' };

  const identity = resolveIdentity();
  if (!identity.accountKey) return { ok: false, reason: 'identity-unknown' };
  if (identity.accountKey !== accountKey) return { ok: false, reason: 'identity-mismatch' };

  // Reserve the run before the first await so two EXECUTE messages arriving in
  // the same tick cannot both pass the run-busy guard.
  const binding = {
    id: createId('run'),
    kind: 'execute',
    accountKey,
    uIndex: identity.uIndex,
    documentId: DOCUMENT_ID,
    startedAt: Date.now(),
  };
  activeRun = binding;

  const snapshot = accountSnapshot(await readStorage('inboxCleanerData'), accountKey);
  if (!isActionableSnapshot(snapshot, accountKey)) {
    activeRun = null;
    return { ok: false, reason: 'snapshot-unbound' };
  }

  const chunks = buildPolicyChunks(policy);
  cancelRequested = false;
  executeState = {
    status: 'executing', action, chunk: 0, total: chunks.length, detail: '',
    error: null, accountKey, startedAt: binding.startedAt,
  };
  broadcast('DELETE_STATE', runPayload(executeState, 'execute'));

  doExecute(policy, chunks, binding).catch(async error => {
    executeState = {
      ...executeState,
      status: 'failed',
      error: error.message,
    };
    broadcast('DELETE_STATE', runPayload(executeState, 'execute'));
    activeRun = null;
  });

  return { ok: true, runId: binding.id, accountKey, documentId: DOCUMENT_ID, total: chunks.length };
}

async function doExecute(policy, chunks, binding) {
  const action = normalizeAction(policy.action);
  const outcomes = [];
  let stopped = false;
  const cancellationReasons = [];

  for (let i = 0; i < chunks.length; i++) {
    if (cancelRequested) {
      stopped = true;
      break;
    }
    const chunk = chunks[i];
    try {
      assertBoundary(binding.accountKey);
      const verified = await selectAllMatchingAndAction(chunk.query, action, binding.accountKey);
      // One more identity read after the action: a change does not retroactively
      // make this chunk verified, but it must stop the next chunk.
      outcomes.push({ query: chunk.query, senders: chunk.emails, outcome: verified ? 'verified' : 'unknown' });
    } catch (error) {
      if (error instanceof CancelledError) {
        stopped = true;
        break;
      }
      if (error instanceof BoundaryError) {
        cancellationReasons.push(error.reason);
        outcomes.push({ query: chunk.query, senders: chunk.emails, outcome: 'not-attempted', error: error.message });
        stopped = true;
        break;
      }
      // Before the action control is clicked nothing moved (failed). If the
      // action was issued and verification failed, it is unknown (C-25).
      const moved = error && error.afterAction === true;
      outcomes.push({
        query: chunk.query,
        senders: chunk.emails,
        outcome: moved ? 'unknown' : 'failed',
        error: error.message,
      });
    }
    executeState = {
      ...executeState, chunk: i + 1, total: chunks.length, detail: chunk.emails[0] || '',
    };
    broadcast('DELETE_STATE', runPayload(executeState, 'execute'));
  }

  if (stopped) {
    for (let i = outcomes.length; i < chunks.length; i++) {
      outcomes.push({ query: chunks[i].query, senders: chunks[i].emails, outcome: 'not-attempted' });
    }
  }

  const anyOutcome = outcomes.some(chunk => chunk.outcome === 'verified' || chunk.outcome === 'unknown');
  let status = receiptStatus(outcomes);
  if (stopped) status = anyOutcome ? 'partial' : 'cancelled';
  if (cancellationReasons.length && !anyOutcome) status = 'failed';

  const endedAt = Date.now();
  const policyKey = chunks.map(chunk => chunk.query).join('|');
  const reviewedTotal = lastReview && lastReview.accountKey === binding.accountKey &&
    lastReview.policyKey === policyKey ? lastReview.total : null;
  const verifiedChunks = outcomes.filter(chunk => chunk.outcome === 'verified');
  const verifiedSenders = new Set(verifiedChunks.flatMap(chunk => chunk.senders));
  const receipt = {
    id: binding.id,
    accountKey: binding.accountKey,
    action,
    status,
    unit: 'conversations',
    startedAt: binding.startedAt,
    endedAt,
    total: status === 'completed' ? reviewedTotal : null,
    reviewedTotal,
    senders: policy.emails,
    operators: policyOperators(policy),
    chunks: outcomes,
    error: cancellationReasons.length ? cancellationReasons.join(', ') : null,
  };

  const raw = await readStorage('inboxCleanerData');
  const box = migrateContainer(raw);
  const snapshot = accountSnapshot(box, binding.accountKey);
  let storageError = null;
  if (snapshot && snapshot.accountKey === binding.accountKey) {
    if (verifiedSenders.size) {
      snapshot.senders = (snapshot.senders || []).filter(sender => !verifiedSenders.has(sender.email));
      snapshot.total = snapshot.senders.reduce((sum, sender) => sum + sender.count, 0);
    }
    snapshot.stale = anyOutcome === true || verifiedSenders.size > 0;
    snapshot.updatedAt = endedAt;
    box.accounts = { ...box.accounts, [binding.accountKey]: snapshot };
    try {
      await writeStorage('inboxCleanerData', box);
    } catch (error) {
      storageError = error.message;
    }
  }

  try {
    const history = await readStorage('inboxCleanerHistory');
    await writeStorage('inboxCleanerHistory', appendHistory(history, receipt, 20));
  } catch (error) {
    storageError = storageError || error.message;
  }

  executeState = {
    ...executeState,
    status,
    chunk: outcomes.filter(chunk => chunk.outcome !== 'not-attempted').length,
    total: chunks.length,
    detail: '',
    error: receipt.error || storageError || (outcomes.find(chunk => chunk.error) || {}).error || null,
  };
  broadcast('DELETE_STATE', runPayload(executeState, 'execute'));
  broadcast('RECEIPT', receipt);
  activeRun = null;
}

// ── Messaging ──────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (!msg || !msg.type) return undefined;

  if (msg.type === 'GET_IDENTITY' || msg.type === 'GET_SCAN_STATE' || msg.type === 'GET_STATE') {
    const state = {
      identity: resolveIdentity(),
      scanState: runPayload(scanState, 'scan'),
      executeState: runPayload(executeState, 'execute'),
      documentId: DOCUMENT_ID,
    };
    respond({ ok: true, ...state });
    return true;
  }

  if (msg.type === 'START_SCAN') {
    startScan(msg.tabId, msg.expectedAccount).then(respond);
    return true;
  }

  if (msg.type === 'COUNT_POLICY') {
    countPolicy(msg.policy, msg.expectedAccount).then(respond);
    return true;
  }

  if (msg.type === 'EXECUTE' || msg.type === 'DELETE') {
    const payload = msg.type === 'DELETE'
      ? { ...msg, policy: { emails: normalizeAddresses(msg.emails), action: 'trash' } }
      : msg;
    startExecute(payload).then(respond);
    return true;
  }

  if (msg.type === 'STOP_RUN') {
    if (!activeRun) {
      respond({ ok: false, reason: 'no-run' });
      return true;
    }
    if (msg.runId && msg.runId !== activeRun.id) {
      respond({ ok: false, reason: 'stale-run' });
      return true;
    }
    cancelRequested = true;
    if (activeRun.kind === 'scan') {
      setScanState({ status: activeRun.kind === 'scan' ? 'stopping' : scanState.status });
    } else {
      executeState = { ...executeState, status: 'stopping' };
      broadcast('DELETE_STATE', runPayload(executeState, 'execute'));
    }
    respond({ ok: true });
    return true;
  }

  return undefined;
});
