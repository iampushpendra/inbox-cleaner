const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parsing = require('../parsing.js');

// Run the actual content script against paginated Gmail-shaped DOM results.
// No mailbox, Chrome profile, credentials, or deletion actions are involved.
function gmail({ total = 10000, counter = true, stalled = false, searchConfirms = true, positionalIds = false, identicalPages = false, enabledStyle = false, hiddenRows = false, nestedIds = false, queryAware = false } = {}) {
  let page = 0;
  let clock = 0;
  const range = () => `${page * 100 + 1}–${Math.min(total, (page + 1) * 100)} of ${total.toLocaleString('en-US')}`;
  const older = {
    getAttribute: name => name === 'aria-disabled' ? String((page + 1) * 100 >= total) : null,
    hasAttribute: () => false,
    getClientRects: () => [{}],
    classList: { contains: name => enabledStyle && name === 'T-I-Js-Gs' },
    click() { dom.olderClicks += 1; if (!stalled) page++; },
  };
  const dom = { olderClicks: 0, broadcasts: [], listeners: [], cache: null };
  const toolbar = { getClientRects: () => [{}], querySelectorAll: () => counter ? [{ textContent: range(), getClientRects: () => [{}] }] : [] };
  let cachedRowKey = null;
  let cachedRows = [];
  function rows() {
    const rowKey = `${page}:${queryAware ? context.location.hash : ''}`;
    if (rowKey === cachedRowKey) return cachedRows;
    cachedRowKey = rowKey;
    cachedRows = Array.from({ length: Math.min(100, total - page * 100) }, (_, i) => {
      const id = page * 100 + i;
      // `identicalPages` models a pathological mailbox where two consecutive
      // pages show the same senders on the same date — the only case where a
      // page with no ids and no counter is genuinely indistinguishable from the
      // one before it.
      const senderId = identicalPages ? i % 10 : id;
      const query = decodeURIComponent(context.location.hash.replace(/^search\//, ''));
      const category = query.match(/category:(\w+)|from:\((\w+)@example.com\)/);
      const key = queryAware && category ? category[1] || category[2] : null;
      return {
        id: positionalIds ? `p${i}` : `row-${id}`, getClientRects: () => [{}],
        getAttribute: name => name === 'data-legacy-thread-id' && !positionalIds && !nestedIds ? `${key || "thread"}-${id}` : null,
        querySelector: selector => selector === '[data-legacy-thread-id]' && nestedIds
          ? { getAttribute: () => `${key || "thread"}-${id}` }
          : selector.includes('email')
          ? { getAttribute: name => name === 'email' ? (key ? `${key}@example.com` : `sender${senderId}@example.com`) : `Sender ${senderId}` }
          : selector.includes('title') ? { getAttribute: () => '2026-10-16T09:00:00Z' } : null,
      };
    });
    return cachedRows;
  }
  const document = {
    querySelector(selector) {
      if (selector === 'tr.zA') return rows()[0];
      if (selector === 'div[gh="tm"]') return toolbar;
      if (selector.includes('Older')) return older;
      if (selector === 'input[name="q"]') return { get value() { return searchConfirms ? decodeURIComponent(context.location.hash.replace(/^search\//, '')) : 'stale-query'; } };
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'tr.zA') return hiddenRows
        ? [{ ...rows()[0], id: 'hidden', getClientRects: () => [], getAttribute: () => 'hidden-thread' }, ...rows()]
        : rows();
      if (selector === 'div[gh="tm"]') return [toolbar];
      if (selector.includes('Older')) return [older];
      return [];
    },
  };
  const context = vm.createContext({
    self: { InboxCleanerParsing: parsing }, InboxCleanerParsing: parsing,
    document, location: { hash: 'search/category:primary' },
    chrome: {
      runtime: { onMessage: { addListener(fn) { dom.listeners.push(fn); } }, sendMessage: async msg => { dom.broadcasts.push(msg); } },
      storage: { local: { set: async data => { dom.cache = data.inboxCleanerData; } } },
    },
    Date: class extends Date { static now() { return clock; } },
    setTimeout(callback, ms) { clock += ms; queueMicrotask(callback); return 0; },
    clearTimeout() {},
    MutationObserver: class { observe() {} disconnect() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../content.js'), 'utf8'), context);
  context.__dom = dom;
  if (queryAware) {
    let hash = context.location.hash;
    Object.defineProperty(context.location, 'hash', {
      get: () => hash,
      set: value => { hash = value; page = 0; },
    });
  }
  return context;
}

test('one scan reads 10000 conversations when Gmail hides its result counter', async () => {
  const context = gmail({ counter: false });
  const rows = await vm.runInContext('scanCategory("primary")', context);
  assert.equal(rows.length, 10000);
  assert.equal(new Set(rows.map(row => row.threadId)).size, 10000);
});

test('one scan reads all 10000 conversations with the result counter visible', async () => {
  const rows = await vm.runInContext('scanCategory("primary")', gmail());
  assert.equal(rows.length, 10000);
});

test('a stuck Older button reports an incomplete scan instead of success at 100', async () => {
  await assert.rejects(vm.runInContext('scanCategory("primary")', gmail({ stalled: true })), /page|incomplete/i);
});

// Gmail's newer list view models a real large mailbox: no Older button, no
// "1-100 of N" counter, and a list that grows as it is scrolled. This is the
// shape that truncated a large mailbox to its first screenful.
function gmailInfiniteScroll({ total = 18000, firstBatch = 50, perScroll = 50, stillClaimsMore = false } = {}) {
  let clock = 0;
  let revealed = Math.min(firstBatch, total);
  let stalled = false;
  let lastRevealed = -1, cachedRows = [];
  const rowEls = () => {
    if (lastRevealed === revealed) return cachedRows;
    lastRevealed = revealed;
    return cachedRows = Array.from({ length: revealed }, (_, i) => ({
    getClientRects: () => [{}],
    getAttribute: name => name === 'data-legacy-thread-id' ? `thread-${i}` : null,
    querySelector: selector => selector.includes('email')
      ? { getAttribute: name => name === 'email' ? `sender${i}@example.com` : `Sender ${i}` }
      : selector.includes('title') ? { getAttribute: () => '2026-10-18T09:00:00Z' } : null,
    parentElement: container,
  }));
  };

  // findScrollableAncestor walks up looking for scrollHeight > clientHeight, so
  // the container must report a viewport smaller than its content even for the
  // very first batch.
  const container = {
    parentElement: null,
    clientHeight: 400,
    dispatchEvent() {},
  };
  Object.defineProperty(container, 'scrollHeight', { get: () => (revealed + 5) * 10 });
  Object.defineProperty(container, 'scrollTop', {
    get: () => 0,
    // A scroll to the bottom reveals one more batch, exactly as Gmail lazily
    // renders the next screenful. Once everything is rendered it adds nothing.
    set: () => {
      if (!stalled && revealed < total) revealed = Math.min(revealed + perScroll, total);
    },
  });

  const dom = {
    get revealed() { return revealed; },
    freeze() { stalled = true; },
  };
  // A counter is optional: by default this view shows none. `stillClaimsMore`
  // models the contradictory case where a counter insists pages remain while
  // the list has stopped producing rows.
  const counterText = stillClaimsMore ? `1-${revealed} of ${total.toLocaleString('en-US')}` : '';
  const toolbar = {
    getClientRects: () => [{}],
    querySelectorAll: () => (counterText ? [{ textContent: counterText, getClientRects: () => [{}] }] : []),
  };

  const context = vm.createContext({
    self: { InboxCleanerParsing: parsing }, InboxCleanerParsing: parsing,
    location: { hash: 'search/category:primary' },
    chrome: { runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} } },
    Date: class extends Date { static now() { return clock; } },
    setTimeout(callback, ms) { clock += ms; queueMicrotask(callback); return 0; },
    clearTimeout() {},
    MutationObserver: class { observe() {} disconnect() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../content.js'), 'utf8'), context);
  context.__dom = dom;
  context.Event = class { constructor(type) { this.type = type; } };
  context.document = {
    querySelector: selector => {
      if (selector === 'input[name="q"]') return { value: decodeURIComponent(context.location.hash.replace(/^search\//, '')) };
      if (selector === 'tr.zA') return rowEls()[0];
      if (selector === 'div[gh="tm"]') return stillClaimsMore ? toolbar : null;
      return null;
    },
    querySelectorAll: selector => selector === 'tr.zA' ? rowEls() : selector === 'div[gh="tm"]' && stillClaimsMore ? [toolbar] : [],
  };
  return context;
}

test('an infinite-scrolling mailbox is walked to the end, not truncated to the first screenful', async () => {
  const rows = await vm.runInContext('scanCategory("primary")', gmailInfiniteScroll({ total: 18000 }));
  assert.equal(rows.length, 18000, 'every conversation in the category must be reached');
  assert.equal(new Set(rows.map(row => row.threadId)).size, 18000, 'each conversation is counted once');
});

test('a small infinite-scrolling list stops once it genuinely stops growing', async () => {
  const context = gmailInfiniteScroll({ total: 120 });
  const rows = await vm.runInContext('scanCategory("primary")', context);
  assert.equal(rows.length, 120);
  assert.equal(context.__dom.revealed, 120, 'the walk ends at the end of the list, not past it');
});

test('an infinite scroll that stops while Gmail reports more pages is an incomplete scan', async () => {
  const context = gmailInfiniteScroll({ total: 18000, stillClaimsMore: true });
  context.__dom.freeze();
  await assert.rejects(vm.runInContext('scanCategory("primary")', context), /incomplete/i);
});

// Gmail-shaped DOM for the delete path: search box, page checkbox, the "select
// all matching" banner, and the toolbar's Trash button. Rows vanish when Trash
// is clicked, as Gmail's do. `banner: false` models Gmail never rendering the
// banner; `clearOnTrash: false` models Gmail leaving the rows in place.
function gmailDelete({ banner = true, clearOnTrash = true } = {}) {
  let clock = 0;
  let rows = 4;
  const dom = { trashClicks: 0, bannerClicks: 0 };
  const rowEls = () => Array.from({ length: rows }, (_, i) => ({
    getAttribute: name => name === 'data-legacy-thread-id' ? `thread-${i}` : null,
    querySelector: () => ({ getAttribute: name => name === 'email' ? 'sender@example.com' : null }),
  }));
  const trash = { getAttribute: () => null, click() { dom.trashClicks += 1; if (clearOnTrash) rows = 0; } };
  const bannerEl = { click() { dom.bannerClicks += 1; } };
  const listeners = [];
  const context = vm.createContext({
    self: { InboxCleanerParsing: parsing }, InboxCleanerParsing: parsing,
    location: { hash: '' },
    chrome: {
      runtime: {
        onMessage: { addListener(fn) { listeners.push(fn); } },
        sendMessage: async message => { context.broadcasts.push({ type: message.type, data: message.data }); },
      },
      storage: { local: { get: async () => ({}), set: async () => {} } },
    },
    Date: class extends Date { static now() { return clock; } },
    setTimeout(callback, ms) { clock += ms; queueMicrotask(callback); return 0; },
    clearTimeout() {},
    MutationObserver: class { observe() {} disconnect() {} },
  });
  context.broadcasts = [];
  context.__listeners = listeners;
  context.__dom = dom;
  context.document = {
    querySelector(selector) {
      if (selector === 'input[name="q"]') return { get value() { return decodeURIComponent(context.location.hash.replace(/^search\//, '')); } };
      if (selector === 'tr.zA') return rowEls()[0] || null;
      if (selector === 'div[gh="tm"]') return null;
      if (selector === 'div[gh="tm"] div[role="checkbox"]') return { click() {} };
      if (selector === 'span.Dj') return banner ? bannerEl : null;
      if (selector === 'div[gh="tm"] div[aria-label="Delete"]') return trash;
      return null;
    },
    querySelectorAll(selector) { return selector === 'tr.zA' ? rowEls() : []; },
  };
  vm.runInContext(fs.readFileSync(require.resolve('../content.js'), 'utf8'), context);
  return context;
}

// The fake clock resolves everything through microtasks, so one macrotask turn
// drains the whole delete run.
const drain = () => new Promise(resolve => setImmediate(resolve));

function send(context, msg) {
  for (const listener of context.__listeners) {
    let out;
    listener(msg, {}, value => { out = value; });
    if (out !== undefined) return out;
  }
  return undefined;
}

const lastState = context => context.broadcasts.filter(m => m.type === 'DELETE_STATE').pop();
const lastError = context => context.broadcasts.filter(m => m.type === 'DELETE_ERROR').pop();

test('a missing "select all matching" banner never clicks Trash and never reports completion', async () => {
  const context = gmailDelete({ banner: false });
  send(context, { type: 'DELETE', emails: ['sender@example.com'] });
  await drain();

  assert.equal(context.__dom.trashClicks, 0);
  assert.notEqual(lastState(context).data.status, 'done');
  assert.match(lastError(context).data, /select all matching|layout may have changed/i);
});

test('a chunk Gmail leaves in place is reported as unverified, not complete', async () => {
  const context = gmailDelete({ clearOnTrash: false });
  send(context, { type: 'DELETE', emails: ['sender@example.com'] });
  await drain();

  assert.equal(context.__dom.trashClicks, 1);
  assert.equal(lastState(context).data.status, 'unverified');
});

test('a query the search box never confirms yields no exact count, not the previous sender total', async () => {
  const context = gmail({ searchConfirms: false });
  const count = await vm.runInContext('countSenderExactly("sender@example.com")', context);
  assert.equal(count, null);
  assert.equal(await vm.runInContext('readResultRange().total', context), 10000, 'precondition: a stale counter is on screen');
});

test('duplicate and mixed-case addresses in one DELETE are actioned once', async () => {
  const context = gmailDelete();
  send(context, { type: 'DELETE', emails: ['Sender@Example.com', 'sender@example.com', 'sender@EXAMPLE.com'] });
  await drain();

  assert.equal(context.__dom.trashClicks, 1);
  assert.equal(decodeURIComponent(context.location.hash), 'search/from:(sender@example.com)');
});

test('a DELETE arriving while a delete is already running is rejected', async () => {
  const context = gmailDelete();
  const first = send(context, { type: 'DELETE', emails: ['sender@example.com'] });
  const second = send(context, { type: 'DELETE', emails: ['sender@example.com'] });

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'already running');
  await drain();
  assert.equal(context.__dom.trashClicks, 1);
});

test('rows identified only by positional ids survive pagination instead of collapsing', async () => {
  const rows = await vm.runInContext('scanCategory("primary")', gmail({ total: 200, positionalIds: true }));
  assert.equal(rows.length, 200);
  assert.equal(new Set(rows.map(row => row.threadId)).size, 200);
});

test('positional ids still paginate the whole category when no result counter exists', async () => {
  const rows = await vm.runInContext(
    'scanCategory("primary")', gmail({ total: 10000, counter: false, positionalIds: true }));
  assert.equal(rows.length, 10000);
  assert.equal(new Set(rows.map(row => row.threadId)).size, 10000);
});

// Documented limitation, locked in as the SAFE failure direction. With no
// thread ids and no result counter, two adjacent pages showing identical
// senders and dates are indistinguishable from a page that never loaded.
// Guessing "it advanced" would silently under-count the mailbox; the scan must
// stop loudly instead, so the user retries and no partial result is trusted.
test('indistinguishable adjacent pages fail the scan loudly instead of under-counting', async () => {
  await assert.rejects(
    vm.runInContext('scanCategory("primary")',
      gmail({ total: 10000, counter: false, positionalIds: true, identicalPages: true })),
    /did not load the next page/i,
  );
});

// Regression: when rows carry only positional ids and Gmail shows no result
// counter, the page-change detector has no signal left except "did the rows
// actually change". If it reports a change without Gmail re-rendering, a stuck
// Older button is mistaken for forward progress and the scan silently re-reads
// the same page until it hits the safety limit.
test('a stuck Older button is still detected when only positional ids and no counter exist', async () => {
  const context = gmail({ total: 10000, counter: false, stalled: true, positionalIds: true });
  await assert.rejects(
    vm.runInContext('scanCategory("primary")', context),
    /did not load the next page/i,
  );
  assert.equal(context.__dom.olderClicks, 1, 'Older must be tried once, then the stall reported');
});

// Captured live Gmail structure on 2026-10-21: T-I-Js-Gs is present on the
// ENABLED Older button; only Newer has aria-disabled="true" on page one.
test('Gmail enabled Older styling does not prevent a complete scan', async () => {
  const rows = await vm.runInContext('scanCategory("primary")', gmail({ total: 350, enabledStyle: true }));
  assert.equal(rows.length, 350);
});

test('hidden rows retained by Gmail are excluded from sender discovery', async () => {
  const rows = await vm.runInContext('scanCategory("primary")', gmail({ total: 200, hiddenRows: true }));
  assert.equal(rows.length, 200);
  assert.equal(rows.some(row => row.threadId === 'hidden-thread'), false);
});

test('thread ids on descendant spans survive row id changes', async () => {
  const rows = await vm.runInContext('scanCategory("primary")', gmail({ total: 200, nestedIds: true }));
  assert.equal(rows.length, 200);
  assert.equal(rows[0].threadId, 'thread-0');
  assert.equal(rows[199].threadId, 'thread-199');
});

test('a category scan waits for the new search results rather than counting stale rows', async () => {
  const context = gmail({ total: 3 });
  const oldQuery = context.document.querySelector;
  const oldAll = context.document.querySelectorAll;
  let elapsed = 0;
  const timeout = context.setTimeout;
  context.setTimeout = (fn, ms) => { elapsed += ms; return timeout(fn, ms); };
  const currentRows = () => oldAll('tr.zA').map(row => elapsed < 1500 ? row : ({
    ...row,
    getAttribute: () => 'social-' + row.id,
    querySelector: selector => selector.includes('email')
      ? { getAttribute: attr => attr === 'email' ? 'social@example.com' : 'Social sender' }
      : row.querySelector(selector),
  }));
  context.document.querySelector = selector => selector === 'input[name="q"]'
    ? { value: elapsed < 200 ? 'category:primary' : 'category:social ' }
    : selector === 'tr.zA' ? currentRows()[0] : oldQuery(selector);
  context.document.querySelectorAll = selector => selector === 'tr.zA' ? currentRows() : oldAll(selector);
  const rows = await vm.runInContext('scanCategory("social")', context);
  assert.equal(rows.length, 3);
  assert.equal(rows.every(row => row.email === 'social@example.com'), true);
});

test('an empty category ignores retained hidden rows and completes without old senders', async () => {
  const context = gmail({ total: 3 });
  const oldAll = context.document.querySelectorAll;
  context.document.querySelectorAll = selector => {
    if (selector === 'tr.zA') return oldAll(selector).map(row => ({ ...row, getClientRects: () => [] }));
    if (selector === 'td.TC') return [{ getClientRects: () => [{}], textContent: 'No messages matched your search.' }];
    return oldAll(selector);
  };
  const rows = await vm.runInContext('scanCategory("primary")', context);
  assert.equal(rows.length, 0);
});

test('an unconfirmed category search fails instead of accepting the previous category', async () => {
  await assert.rejects(vm.runInContext('scanCategory("social")', gmail({ searchConfirms: false })), /search|query/i);
});

test('exact sender counts wait for the sender result counter instead of reading a stale category total', async () => {
  const context = gmail({ total: 200 });
  const oldQuery = context.document.querySelector;
  const oldAll = context.document.querySelectorAll;
  let elapsed = 0;
  const timeout = context.setTimeout;
  context.setTimeout = (fn, ms) => { elapsed += ms; return timeout(fn, ms); };
  context.document.querySelector = selector => selector === 'input[name="q"]'
    ? { value: elapsed < 200 ? 'category:primary' : 'from:(target@example.com) ' }
    : oldQuery(selector);
  context.document.querySelectorAll = selector => {
    if (selector === 'div[gh="tm"]' && elapsed >= 1500) return [{
      getClientRects: () => [{}],
      querySelectorAll: () => [{ textContent: '1–7 of 7', getClientRects: () => [{}] }],
    }];
    if (selector === 'tr.zA' && elapsed >= 1500) return oldAll(selector).slice(0, 7).map(row => ({
      ...row, getAttribute: () => 'sender-result-' + row.id,
    }));
    return oldAll(selector);
  };
  assert.equal(await vm.runInContext('countSenderExactly("target@example.com")', context), 7);
});


test('Refresh scans all five paginated categories and saves only their visible senders', async () => {
  const context = gmail({ total: 350, enabledStyle: true, hiddenRows: true, nestedIds: true, queryAware: true });
  const replies = [];
  for (const listener of context.__dom.listeners) listener({ type: 'START_SCAN' }, {}, reply => replies.push(reply));
  await drain();
  const final = context.__dom.broadcasts.filter(msg => msg.type === 'SCAN_STATE').pop();
  assert.equal(final.data.status, 'done');
  assert.equal(context.__dom.cache.total, 1750);
  assert.equal(context.__dom.cache.senders.length, 5);
  for (const sender of context.__dom.cache.senders) {
    assert.equal(sender.sampledCount, 350);
    assert.equal(sender.count, 350);
    assert.equal(sender.categories.length, 1);
    assert.equal(sender.categories[0], sender.email.split('@')[0].toUpperCase());
  }
});

test('a failed Refresh preserves the last complete cache and reports failure', async () => {
  const context = gmail({ total: 350, enabledStyle: true, stalled: true });
  const previous = { total: 123, senders: [{ email: 'old@example.com' }] };
  context.__dom.cache = previous;
  for (const listener of context.__dom.listeners) listener({ type: 'START_SCAN' }, {}, () => {});
  await drain();
  assert.equal(context.__dom.cache, previous);
  const final = context.__dom.broadcasts.filter(msg => msg.type === 'SCAN_STATE').pop();
  assert.equal(final.data.status, 'error');
  assert.match(final.data.error, /next page/i);
});

test('an empty category cannot make the next nonempty category finish before its rows load', async () => {
  const context = gmail({ total: 3 });
  const oldAll = context.document.querySelectorAll;
  const oldQuery = context.document.querySelector;
  const empty = { getClientRects: () => [{}], textContent: 'No messages matched your search.' };
  let elapsed = 0;
  const timeout = context.setTimeout;
  context.setTimeout = (fn, ms) => { elapsed += ms; return timeout(fn, ms); };
  context.document.querySelector = selector => selector === 'input[name="q"]'
    ? { value: elapsed < 200 ? 'category:primary' : 'category:social ' } : oldQuery(selector);
  context.document.querySelectorAll = selector => {
    if (selector === 'tr.zA') return elapsed < 1500 ? [] : oldAll(selector);
    if (selector === 'td.TC') return elapsed < 1500 ? [empty] : [];
    return oldAll(selector);
  };
  const rows = await vm.runInContext('scanCategory("social")', context);
  assert.equal(rows.length, 3);
});

test('a new query with identical conversations can still resolve its exact count after rendering', async () => {
  const context = gmail({ total: 3 });
  const oldAll = context.document.querySelectorAll;
  const oldQuery = context.document.querySelector;
  const original = oldAll('tr.zA');
  const replacement = original.map(row => ({ ...row }));
  let elapsed = 0;
  const timeout = context.setTimeout;
  context.setTimeout = (fn, ms) => { elapsed += ms; return timeout(fn, ms); };
  context.document.querySelector = selector => selector === 'input[name="q"]'
    ? { value: elapsed < 200 ? 'category:primary' : 'from:(sender@example.com)' } : oldQuery(selector);
  context.document.querySelectorAll = selector => selector === 'tr.zA'
    ? elapsed < 1500 ? original : replacement : oldAll(selector);
  assert.equal(await vm.runInContext('countSenderExactly("sender@example.com")', context), 3);
});
