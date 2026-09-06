# DOM Automation Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Inbox Cleaner's Gmail API + OAuth architecture with a content script that automates the live Gmail web UI on `mail.google.com`, eliminating Google's restricted-scope OAuth verification wall.

**Architecture:** `background.js` (OAuth + API calls) is deleted entirely. A new content script (`content.js` + `parsing.js`) runs inside the user's own Gmail tab, navigates Gmail's own `category:`/`from:` search operators, reads rendered conversation rows, and drives Gmail's native "select all matching search" bulk-trash action. `popup.js` talks to this content script via `chrome.tabs.sendMessage` instead of `chrome.runtime.sendMessage` to a service worker, and reads cached results directly from `chrome.storage.local`.

**Tech Stack:** Vanilla JS, Manifest V3, zero build step (unchanged project convention). Dev-only tests use Node's built-in `node:test`/`node:assert` (Node v25 confirmed installed) — no new dependency, no `package.json` added.

**Spec:** `docs/superpowers/specs/2026-09-06-dom-automation-architecture-design.md`

## Global Constraints

- No new runtime dependencies and no build step for the extension itself (per existing project convention — "zero dependencies, zero build step").
- Version bumps to **3.0.0** everywhere (`manifest.json`, `VERSION`, `README.md`, `CHANGELOG.md`) — breaking change to permissions + core mechanism.
- Extension **requires** a `mail.google.com` tab already open — never auto-opens one.
- Scan is a **full scan** (auto-scrolls each category to completion), not a capped sample.
- Delete uses Gmail's **native "select all conversations that match this search"** bulk action, never manual per-row selection.
- UI **stays the toolbar popup** — no injected in-page overlay.
- All Gmail DOM selectors live in one `SELECTORS` object at the top of `content.js` — any future Gmail markup change should require editing only that object.
- This plan touches only the **Chrome extension** (`manifest.json`, `background.js`, `popup.*`, new `content.js`/`parsing.js`). The separate web app under `docs/` (`docs/index.html`/`docs/app.js`, Google Identity Services token flow) is a different product surface and is out of scope — do not modify it.

---

### Task 1: Manifest overhaul — drop OAuth/API, add Gmail host access

**Files:**
- Modify: `manifest.json`
- Delete: `background.js`
- Create: `parsing.js`
- Create: `content.js`

**Interfaces:**
- Produces: `content_scripts` entry loading `parsing.js` then `content.js` into every `https://mail.google.com/*` page. `parsing.js` exposes `self.InboxCleanerParsing` (empty object for now — filled in Task 2).

- [ ] **Step 1: Replace `manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "Inbox Cleaner",
  "version": "3.0.0",
  "description": "See who's filling your Gmail. Select and delete in one click.",
  "permissions": ["storage", "tabs"],
  "host_permissions": [
    "https://mail.google.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://mail.google.com/*"],
      "js": ["parsing.js", "content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 2: Delete the old service worker**

```bash
git rm background.js
```

- [ ] **Step 3: Create the `parsing.js` stub**

```js
// parsing.js — pure Gmail-row parsing logic, shared between content.js
// (loaded as a plain content script) and this repo's Node tests (loaded
// via require()). Filled in by Task 2.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InboxCleanerParsing = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  return {};
});
```

- [ ] **Step 4: Create the `content.js` stub**

```js
// content.js — Inbox Cleaner content script (Gmail DOM automation)
console.log('[Inbox Cleaner] content script loaded');
```

- [ ] **Step 5: Manual verification — load unpacked and confirm clean permissions**

1. Open `chrome://extensions`, enable Developer mode if needed.
2. If Inbox Cleaner is already loaded, click the reload icon on its card; otherwise "Load unpacked" → select the repo root.
3. Confirm there are **no errors** on the extension's card (a red "Errors" button would indicate a manifest or content-script load problem).
4. Click "Details" → confirm the permissions list shows only host access to `mail.google.com` — no more `gmail.googleapis.com`/`www.googleapis.com`, no more "identity"/OAuth.
5. Open a `mail.google.com` tab, open DevTools console, confirm `[Inbox Cleaner] content script loaded` appears.

- [ ] **Step 6: Commit**

```bash
git add manifest.json parsing.js content.js
git rm background.js
git commit -m "feat: replace OAuth/Gmail API manifest with mail.google.com content script"
```

---

### Task 2: `parsing.js` — pure row/query logic with tests

**Files:**
- Modify: `parsing.js`
- Test: `test/parsing.test.js`

**Interfaces:**
- Consumes: nothing (pure functions, no DOM, no Chrome APIs).
- Produces (via `InboxCleanerParsing` / `module.exports`):
  - `parseSenderFromAttrs({ emailAttr, nameAttr }) -> { name: string, email: string }`
  - `parseDateFromTitle(titleAttr: string) -> number` (epoch ms, or `0` if unparseable)
  - `dedupeRowsByThreadId(rows: Array<{threadId}>) -> Array` (drops rows with a falsy `threadId`, keeps first occurrence of each id)
  - `buildFromQueries(emails: string[], chunkSize = 20) -> string[]`
  - `mergeCategoryResults(accumulator: object, category: string, rows: Array<{name,email,dateTs,threadId}>) -> object` (mutates and returns `accumulator`, keyed by email: `{name, email, count, latest, categories: string[]}`)
  - `finalizeSenders(accumulator: object) -> Array` (sorted descending by `count`)

- [ ] **Step 1: Write the failing tests**

```js
// test/parsing.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseSenderFromAttrs,
  parseDateFromTitle,
  dedupeRowsByThreadId,
  buildFromQueries,
  mergeCategoryResults,
  finalizeSenders,
} = require('../parsing.js');

test('parseSenderFromAttrs trims and lowercases the email', () => {
  const result = parseSenderFromAttrs({ emailAttr: '  Sender@Example.com  ', nameAttr: ' Some Sender ' });
  assert.deepEqual(result, { name: 'Some Sender', email: 'sender@example.com' });
});

test('parseSenderFromAttrs falls back to the email local-part when name is missing', () => {
  const result = parseSenderFromAttrs({ emailAttr: 'news@shop.com', nameAttr: '' });
  assert.deepEqual(result, { name: 'news', email: 'news@shop.com' });
});

test('parseSenderFromAttrs falls back to "Unknown" when both attrs are missing', () => {
  const result = parseSenderFromAttrs({ emailAttr: '', nameAttr: '' });
  assert.deepEqual(result, { name: 'Unknown', email: '' });
});

test('parseDateFromTitle parses a valid date string', () => {
  const ts = parseDateFromTitle('2026-09-03T14:30:00Z');
  assert.equal(ts, Date.parse('2026-09-03T14:30:00Z'));
});

test('parseDateFromTitle returns 0 for empty or unparseable input', () => {
  assert.equal(parseDateFromTitle(''), 0);
  assert.equal(parseDateFromTitle('not a date'), 0);
});

test('dedupeRowsByThreadId keeps the first occurrence of each thread id', () => {
  const rows = [
    { threadId: 't1', n: 1 },
    { threadId: 't2', n: 2 },
    { threadId: 't1', n: 3 },
  ];
  assert.deepEqual(dedupeRowsByThreadId(rows), [
    { threadId: 't1', n: 1 },
    { threadId: 't2', n: 2 },
  ]);
});

test('dedupeRowsByThreadId drops rows with no thread id', () => {
  const rows = [{ threadId: '', n: 1 }, { threadId: 't1', n: 2 }];
  assert.deepEqual(dedupeRowsByThreadId(rows), [{ threadId: 't1', n: 2 }]);
});

test('buildFromQueries chunks emails into OR-joined from: queries', () => {
  const queries = buildFromQueries(['a@x.com', 'b@x.com', 'c@x.com'], 2);
  assert.deepEqual(queries, ['from:(a@x.com OR b@x.com)', 'from:(c@x.com)']);
});

test('buildFromQueries returns an empty array for no emails', () => {
  assert.deepEqual(buildFromQueries([]), []);
});

test('mergeCategoryResults aggregates count/latest/categories for a fresh accumulator', () => {
  const rows = [
    { name: 'A', email: 'a@x.com', dateTs: 100, threadId: 't1' },
    { name: 'A', email: 'a@x.com', dateTs: 200, threadId: 't2' },
  ];
  const acc = mergeCategoryResults({}, 'PRIMARY', rows);
  assert.deepEqual(acc, {
    'a@x.com': { name: 'A', email: 'a@x.com', count: 2, latest: 200, categories: ['PRIMARY'] },
  });
});

test('mergeCategoryResults merges a second category into an existing accumulator', () => {
  let acc = mergeCategoryResults({}, 'PRIMARY', [
    { name: 'A', email: 'a@x.com', dateTs: 200, threadId: 't1' },
  ]);
  acc = mergeCategoryResults(acc, 'SOCIAL', [
    { name: 'A', email: 'a@x.com', dateTs: 150, threadId: 't2' },
    { name: 'B', email: 'b@y.com', dateTs: 50, threadId: 't3' },
  ]);
  assert.deepEqual(acc['a@x.com'], { name: 'A', email: 'a@x.com', count: 2, latest: 200, categories: ['PRIMARY', 'SOCIAL'] });
  assert.deepEqual(acc['b@y.com'], { name: 'B', email: 'b@y.com', count: 1, latest: 50, categories: ['SOCIAL'] });
});

test('finalizeSenders sorts descending by count', () => {
  const acc = {
    'a@x.com': { name: 'A', email: 'a@x.com', count: 1, latest: 1, categories: [] },
    'b@y.com': { name: 'B', email: 'b@y.com', count: 5, latest: 1, categories: [] },
  };
  const result = finalizeSenders(acc);
  assert.equal(result[0].email, 'b@y.com');
  assert.equal(result[1].email, 'a@x.com');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/parsing.test.js`
Expected: FAIL — `InboxCleanerParsing`/`module.exports` returns `{}`, so every destructured import is `undefined` and calling it throws `TypeError: parseSenderFromAttrs is not a function`.

- [ ] **Step 3: Implement `parsing.js`**

```js
// parsing.js — pure Gmail-row parsing logic, shared between content.js
// (loaded as a plain content script) and this repo's Node tests (loaded
// via require()).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InboxCleanerParsing = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  function parseSenderFromAttrs({ emailAttr, nameAttr }) {
    const email = (emailAttr || '').trim().toLowerCase();
    const name = (nameAttr || '').trim() || email.split('@')[0] || 'Unknown';
    return { name, email };
  }

  function parseDateFromTitle(titleAttr) {
    if (!titleAttr) return 0;
    const ts = Date.parse(titleAttr);
    return Number.isNaN(ts) ? 0 : ts;
  }

  function dedupeRowsByThreadId(rows) {
    const seen = new Set();
    const result = [];
    for (const row of rows) {
      if (!row.threadId || seen.has(row.threadId)) continue;
      seen.add(row.threadId);
      result.push(row);
    }
    return result;
  }

  function buildFromQueries(emails, chunkSize = 20) {
    const queries = [];
    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      queries.push(`from:(${chunk.join(' OR ')})`);
    }
    return queries;
  }

  function mergeCategoryResults(accumulator, category, rows) {
    for (const row of rows) {
      const key = row.email;
      if (!accumulator[key]) {
        accumulator[key] = { name: row.name, email: row.email, count: 0, latest: 0, categories: [] };
      }
      const entry = accumulator[key];
      entry.count += 1;
      if (row.dateTs > entry.latest) entry.latest = row.dateTs;
      if (!entry.categories.includes(category)) entry.categories.push(category);
    }
    return accumulator;
  }

  function finalizeSenders(accumulator) {
    return Object.values(accumulator).sort((a, b) => b.count - a.count);
  }

  return {
    parseSenderFromAttrs,
    parseDateFromTitle,
    dedupeRowsByThreadId,
    buildFromQueries,
    mergeCategoryResults,
    finalizeSenders,
  };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/parsing.test.js`
Expected: PASS — all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add parsing.js test/parsing.test.js
git commit -m "feat: implement pure Gmail-row parsing/aggregation logic with tests"
```

---

### Task 3: `content.js` — scan implementation

**Files:**
- Modify: `content.js`

**Interfaces:**
- Consumes: `InboxCleanerParsing.{parseSenderFromAttrs, parseDateFromTitle, dedupeRowsByThreadId, mergeCategoryResults, finalizeSenders}` (Task 2).
- Produces:
  - Runtime message handler for `{ type: 'GET_SCAN_STATE' }` → responds `{ ok: true, scanState }`
  - Runtime message handler for `{ type: 'START_SCAN' }` → responds `{ ok: true }` or `{ ok: false, reason: 'already running' }`
  - Broadcasts `chrome.runtime.sendMessage({ type: 'SCAN_STATE', data: scanState })` where `scanState` is `{ status: 'idle'|'scanning'|'done'|'error', category: number, total: number, error: string|null }`
  - Writes `chrome.storage.local.set({ inboxCleanerData: { senders, scannedAt, total } })` on completion — same shape Task 5's `popup.js` already expects to read directly from storage.

- [ ] **Step 1: Verify Gmail DOM selectors against a live Gmail session**

This can't be unit tested — it's a live-DOM check, done once now and re-run any time a later step reports "Gmail's layout may have changed."

1. Open `mail.google.com` in a tab with a reasonably full inbox (Primary tab).
2. Open DevTools console and run each of the following, confirming the result count is what's noted:
   - `document.querySelectorAll('tr.zA').length` → should roughly match the number of visible conversation rows.
   - `document.querySelector('tr.zA span[email]')` → should be a non-null element whose `email` attribute is a real sender address.
   - `document.querySelector('tr.zA td.xW span[title]')` → should be a non-null element whose `title` attribute is a full date/time string.
   - `document.querySelector('tr.zA').getAttribute('data-legacy-thread-id')` → note whether this returns a value or `null`. If `null`, content.js's fallback to the row's `id` attribute will be used instead — no code change needed either way, just note which one is live.
3. If any selector above returns nothing, inspect the row element in the Elements panel, find the equivalent current attribute/class, and update the `SELECTORS` object in Step 2 below accordingly **before** continuing.

- [ ] **Step 2: Append scan implementation to `content.js`**

```js
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

function findListContainer() {
  const anyRow = document.querySelector(SELECTORS.row);
  return anyRow ? (anyRow.closest('table') || anyRow.parentElement) : null;
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
  await waitForElement(SELECTORS.row);
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
```

- [ ] **Step 3: Manual end-to-end scan test**

1. Reload the unpacked extension in `chrome://extensions`.
2. Open a real Gmail tab (an account with mail spread across at least 2-3 categories works best for this check).
3. Open the extension popup — it will still be on the old empty-state UI until Task 5 rewires it, so instead drive the scan directly from the DevTools console on the Gmail tab: `chrome.runtime.sendMessage({ type: 'START_SCAN' })`.
4. Watch the tab's address bar hash change through `#search/category:primary`, `#search/category:social`, etc., and the list visibly scroll.
5. Once it settles back to idle, run `chrome.storage.local.get('inboxCleanerData', console.log)` in the console — confirm `senders` is a non-empty array, each entry has a plausible `count`, `latest` (epoch ms), and `categories` (e.g. `['PRIMARY']` or `['PRIMARY','SOCIAL']` for a sender appearing in more than one).
6. Spot-check one sender's `count` against Gmail's own search (`from:<that address>` in the Gmail search box) to confirm the DOM-scraped count is accurate.

- [ ] **Step 4: Commit**

```bash
git add content.js
git commit -m "feat: implement Gmail category scan via content-script DOM automation"
```

---

### Task 4: `content.js` — delete implementation

**Files:**
- Modify: `content.js`

**Interfaces:**
- Consumes: `InboxCleanerParsing.buildFromQueries` (Task 2), `SELECTORS`/`waitForElement`/`sleep`/`broadcast` (Task 3).
- Produces:
  - Runtime message handler for `{ type: 'DELETE', emails: string[] }` → responds `{ ok: true }`
  - Broadcasts `chrome.runtime.sendMessage({ type: 'DELETE_STATE', data })` where `data` is `{ status: 'deleting'|'done'|'error', chunk: number, total: number, error: string|null }`
  - Broadcasts `chrome.runtime.sendMessage({ type: 'DELETE_ERROR', data: string })` on failure.

- [ ] **Step 1: Verify delete-flow selectors against a live Gmail session**

1. In the Gmail tab, search for something guaranteed to match a handful of your own emails (e.g. `from:` your own address, or any sender you're comfortable test-trashing).
2. In DevTools console: `document.querySelector('div[gh="tm"] div[role="checkbox"]')` → should be non-null (the toolbar's "select all on this page" checkbox).
3. Click that checkbox manually in the UI, then run `document.querySelector('span.Dj')` → should be non-null and its `textContent` should read something like "Select all N conversations that match this search".
4. With that link clicked, run `document.querySelector('div[gh="tm"] div[aria-label="Delete"]')` → should be non-null (the toolbar Trash button).
5. If any of these are `null`, inspect the real element and update `SELECTORS.selectAllCheckbox` / `SELECTORS.selectAllMatchingLink` / `SELECTORS.trashButton` in `content.js` before continuing.

- [ ] **Step 2: Append delete implementation to `content.js`**

```js
async function selectAllMatchingAndTrash(query) {
  location.hash = `search/${encodeURIComponent(query)}`;
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
```

Note: `content.js` now references `InboxCleanerParsing.buildFromQueries` with the full namespace (rather than destructuring it at the top like the Task 3 functions) since it's only used here — either style works given `self.InboxCleanerParsing` is a plain global object, but keep this call as-is to avoid re-editing Task 3's destructuring line.

- [ ] **Step 3: Manual end-to-end delete test**

**Use a sender/query you are genuinely fine with trashing — this moves real mail to Trash.**

1. Reload the unpacked extension, open the Gmail tab used for Task 3's scan.
2. In DevTools console: `chrome.runtime.sendMessage({ type: 'DELETE', emails: ['<a real test sender address from your own scan results>'] })`.
3. Watch the tab navigate to the `from:(...)` search, the select-all checkbox get checked, the "match this search" link get clicked, and the Trash button fire.
4. Confirm in Gmail's own UI that those conversations are now in Trash.
5. Run `chrome.storage.local.get('inboxCleanerData', console.log)` and confirm that sender is no longer present in the cached list.
6. Repeat with an `emails` array of 2-3 senders to confirm the single combined `from:(a OR b OR c)` query path also works.

- [ ] **Step 4: Commit**

```bash
git add content.js
git commit -m "feat: implement bulk-trash via Gmail's native select-all-matching action"
```

---

### Task 5: `popup.js`/`popup.html` — talk to the content script instead of a service worker

**Files:**
- Modify: `popup.js`
- Modify: `popup.html`

**Interfaces:**
- Consumes: `content.js`'s message contract from Tasks 3-4 (`GET_SCAN_STATE`, `START_SCAN`, `DELETE`, and the `SCAN_STATE`/`DELETE_STATE`/`DELETE_ERROR` broadcasts).
- Produces: same rendered UI screens as before (`loading`, `empty`, `main`, `deleting`), plus a new `no-tab` screen.

- [ ] **Step 1: Add the "no Gmail tab open" screen to `popup.html`**

Insert this block immediately after the existing `<div id="screen-empty" ...>` block (before `<!-- ── Main ── -->`):

```html
<!-- ── No Gmail tab open ────────────────────────────────────────────────────── -->
<div id="screen-no-tab" class="screen hidden">
  <div class="center-col">
    <div class="hero-icon">📥</div>
    <h2>Inbox Cleaner</h2>
    <p class="muted">Open Gmail in a tab, then come back here to scan your inbox.</p>
    <button id="btn-retry-tab" class="btn-primary btn-lg">Retry</button>
  </div>
</div>
```

- [ ] **Step 2: Replace `popup.js`**

```js
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
```

- [ ] **Step 3: Manual end-to-end popup test**

1. Reload the unpacked extension.
2. **No-tab path:** close every Gmail tab, click the toolbar icon → confirm the new "Open Gmail in a tab first" screen appears. Open a Gmail tab, click "Retry" → confirm it moves past that screen.
3. **First scan:** with a Gmail tab open and no prior cache (clear it via `chrome.storage.local.clear()` in the popup's own DevTools if needed), click "Scan my inbox" → confirm the progress bar advances through "Scanning category 1 of 5…" up to 5, then the ranked sender list renders with correct counts, badges, and dates.
4. **Selection + delete:** select 2-3 senders, click "Move to Trash", confirm the modal, confirm the deleting screen shows "Deleting batch 1 of 1…", and confirm those senders disappear from the list afterward.
5. **Re-scan:** click the refresh icon and confirm it re-runs cleanly.

- [ ] **Step 4: Commit**

```bash
git add popup.js popup.html
git commit -m "feat: wire popup to content-script messaging instead of background service worker"
```

---

### Task 6: Rollout — version, changelog, README, store listing docs

**Files:**
- Modify: `VERSION`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/CHROME_WEB_STORE.md`

- [ ] **Step 1: Bump `VERSION`**

```
3.0.0
```

- [ ] **Step 2: Update `CHANGELOG.md`**

Replace the `## [Unreleased]` heading and its contents with a new `## [3.0.0] - 2026-09-06` section that folds in the already-pending fixes plus this migration:

```markdown
## [3.0.0] - 2026-09-06

### Changed
- **Breaking:** replaced the Gmail API + OAuth architecture (`chrome.identity`, `gmail.readonly`/`gmail.modify` scopes, `background.js` service worker) with a content script (`content.js`/`parsing.js`) that automates the live Gmail web UI directly on `mail.google.com`. This eliminates Google's restricted-scope OAuth "unverified app" verification wall, which was blocking every real user except the developer/test accounts from signing in. Scanning is slower (renders and scrolls each category instead of batched API calls) and depends on Gmail's DOM staying stable, but requires no OAuth consent screen at all.
- Extension now requires a `mail.google.com` tab to already be open — it does not auto-open one.

### Fixed
- `manifest.json` `version` was stuck at `1.0.0` while the app/README/CHANGELOG had moved to `2.1.0` — fixed to keep the extension zip in sync with the rest of the project before Chrome Web Store submission.
- `scripts/daily_publish.sh` used `set -e` with no failure signal — a failed run (expired `claude` CLI auth on 2026-09-01, dropped SSH connection on 2026-09-02) just stopped silently with nothing but a log line nobody was watching. Now each step is checked explicitly and a macOS notification fires on failure, with a hint to re-run `claude` interactively if the auth session expired.

### Added
- `docs/CHROME_WEB_STORE.md` — draft Web Store listing copy, permission-justification answers, and pre-submission checklist.
```

- [ ] **Step 3: Update `README.md`**

Replace the version line near the top:

```markdown
**v3.0.0** — see [CHANGELOG.md](CHANGELOG.md) for what's new.
```

Replace the "How it works" section (this describes the extension specifically; the separate web app under `docs/` is unaffected and keeps its own OAuth+API flow, so add a note distinguishing them):

```markdown
## How it works

**Chrome extension** (this repo's `manifest.json`/`content.js`/`popup.js`) — no OAuth, no API, no backend:

```
Open Gmail in a tab
       │
       ▼
Content script navigates category:primary / social / promotions / updates / forums
  Scrolls each category's results to completion, reads sender + date off each row
       │
       ▼
Group by sender → ranked list (chrome.storage.local)
       │
  [You select senders + click "Move to Trash"]
       │
       ▼
  from:(a OR b OR ...) search → Gmail's own "select all matching search" + Trash
```

**Web app** (`docs/index.html` at [iampushpendra.github.io/inbox-cleaner](https://iampushpendra.github.io/inbox-cleaner/)) is a separate surface that still uses Google Identity Services + the Gmail API directly — see `docs/app.js`.
```

Replace the "Privacy" section's first two bullets (extension-specific; the web app privacy bullets about `gmail.googleapis.com` still apply to the web app only):

```markdown
## Privacy

**Chrome extension:**
- **No API, no OAuth** — the content script reads sender/date directly off Gmail's own rendered page inside your browser; nothing is sent anywhere
- **Local cache** — scan results live in `chrome.storage.local` on your device
- **Trash, not delete** — emails go to Gmail Trash and stay there 30 days before auto-purge; you can restore them any time

**Web app:** all API calls go directly from your browser to `gmail.googleapis.com`; only `From`/`Date` headers are read.

[Full privacy policy →](https://iampushpendra.github.io/inbox-cleaner/privacy.html)
```

Replace the "Chrome Extension setup" section's last line:

```markdown
No sign-in step — the extension reads whichever Gmail tab you already have open.
```

Replace the "Tech stack" table's extension-related rows:

```markdown
| Layer | Detail |
|-------|--------|
| Auth (web app) | Google Identity Services `initTokenClient` — token flow, no backend |
| Auth (extension) | None — content script reads the page you're already signed into |
| Scan (extension) | Content-script DOM automation — Gmail's `category:` search operator + auto-scroll |
| Trash (extension) | Gmail's native "select all conversations that match this search" bulk action |
| Storage | `localStorage` (web) · `chrome.storage.local` (extension) |
| Framework | None — vanilla JS, zero dependencies, zero build step |
```

Replace the "Folder structure" block's extension file list:

```markdown
├── content.js          ← Extension content script (Gmail DOM automation)
├── parsing.js           ← Pure parsing/aggregation logic (shared with test/)
├── popup.html          ← Extension popup
├── popup.css
├── popup.js
├── manifest.json       ← Manifest V3
├── test/               ← Node built-in test runner (`node --test`)
└── icons/
```

- [ ] **Step 4: Update `docs/CHROME_WEB_STORE.md`**

Replace the permission-justification bullets:

```markdown
- **Permission justifications**:
  - `host_permissions` (`mail.google.com`) — "Used to run a content script inside
    the user's own already-authenticated Gmail tab, reading the rendered sender
    name and date off each conversation row and driving Gmail's own bulk
    'move to Trash' action. No network requests are made by the extension and
    no other host is contacted."
  - `storage` — "Caches the scan results (sender name, email, count, category,
    last-received date) in chrome.storage.local so the user doesn't have to
    rescan on every popup open."
  - `tabs` — "Used only to locate an already-open mail.google.com tab to send
    scan/delete commands to; the extension does not read tab contents from
    any other site."
```

Replace the zip command (drop `background.js`, add the new files):

```bash
cd /Users/pushpendrasingh/projects/inbox-cleaner
zip -r inbox-cleaner-extension.zip manifest.json content.js parsing.js popup.html popup.js popup.css icons/
```

- [ ] **Step 5: Commit**

```bash
git add VERSION CHANGELOG.md README.md docs/CHROME_WEB_STORE.md
git commit -m "docs: update version/changelog/README/store listing for 3.0.0 DOM-automation migration"
```
