const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parsing = require('../parsing.js');

// Run the actual content script against paginated Gmail-shaped DOM results.
// No mailbox, Chrome profile, credentials, or deletion actions are involved.
function gmail({ total = 10000, counter = true, stalled = false, searchConfirms = true, positionalIds = false, identicalPages = false } = {}) {
  let page = 0;
  let clock = 0;
  const range = () => `${page * 100 + 1}–${Math.min(total, (page + 1) * 100)} of ${total.toLocaleString('en-US')}`;
  const older = {
    getAttribute: name => name === 'aria-disabled' ? String((page + 1) * 100 >= total) : null,
    hasAttribute: () => false,
    getClientRects: () => [{}],
    classList: { contains: () => false },
    click() { dom.olderClicks += 1; if (!stalled) page++; },
  };
  const dom = { olderClicks: 0 };
  const toolbar = { getClientRects: () => [{}], querySelectorAll: () => counter ? [{ textContent: range() }] : [] };
  function rows() {
    return Array.from({ length: Math.min(100, total - page * 100) }, (_, i) => {
      const id = page * 100 + i;
      // `identicalPages` models a pathological mailbox where two consecutive
      // pages show the same senders on the same date — the only case where a
      // page with no ids and no counter is genuinely indistinguishable from the
      // one before it.
      const senderId = identicalPages ? i % 10 : id;
      return {
        id: positionalIds ? `p${i}` : `row-${id}`, getClientRects: () => [{}],
        getAttribute: name => name === 'data-legacy-thread-id' && !positionalIds ? `thread-${id}` : null,
        querySelector: selector => selector.includes('email')
          ? { getAttribute: name => name === 'email' ? `sender${senderId}@example.com` : `Sender ${senderId}` }
          : selector.includes('title') ? { getAttribute: () => '2026-10-16T09:00:00Z' } : null,
      };
    });
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
      if (selector === 'tr.zA') return rows();
      if (selector === 'div[gh="tm"]') return [toolbar];
      if (selector.includes('Older')) return [older];
      return [];
    },
  };
  const context = vm.createContext({
    self: { InboxCleanerParsing: parsing }, InboxCleanerParsing: parsing,
    document, location: { hash: '' },
    chrome: { runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} } },
    Date: class extends Date { static now() { return clock; } },
    setTimeout(callback, ms) { clock += ms; queueMicrotask(callback); return 0; },
    clearTimeout() {},
    MutationObserver: class { observe() {} disconnect() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../content.js'), 'utf8'), context);
  context.__dom = dom;
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
  const rowEls = () => Array.from({ length: revealed }, (_, i) => ({
    getClientRects: () => [{}],
    getAttribute: name => name === 'data-legacy-thread-id' ? `thread-${i}` : null,
    querySelector: selector => selector.includes('email')
      ? { getAttribute: name => name === 'email' ? `sender${i}@example.com` : `Sender ${i}` }
      : selector.includes('title') ? { getAttribute: () => '2026-10-18T09:00:00Z' } : null,
    parentElement: container,
  }));

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
    querySelectorAll: () => (counterText ? [{ textContent: counterText }] : []),
  };

  const context = vm.createContext({
    self: { InboxCleanerParsing: parsing }, InboxCleanerParsing: parsing,
    location: { hash: '' },
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
      if (selector === 'tr.zA') return rowEls()[0];
      if (selector === 'div[gh="tm"]') return stillClaimsMore ? toolbar : null;
      return null;
    },
    querySelectorAll: selector => (selector === 'tr.zA' ? rowEls() : []),
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
