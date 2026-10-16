const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parsing = require('../parsing.js');

// Run the actual content script against paginated Gmail-shaped DOM results.
// No mailbox, Chrome profile, credentials, or deletion actions are involved.
function gmail({ total = 10000, counter = true, stalled = false } = {}) {
  let page = 0;
  let clock = 0;
  const range = () => `${page * 100 + 1}–${Math.min(total, (page + 1) * 100)} of ${total.toLocaleString('en-US')}`;
  const older = {
    getAttribute: name => name === 'aria-disabled' ? String((page + 1) * 100 >= total) : null,
    hasAttribute: () => false,
    getClientRects: () => [{}],
    classList: { contains: () => false },
    click() { if (!stalled) page++; },
  };
  const toolbar = { getClientRects: () => [{}], querySelectorAll: () => counter ? [{ textContent: range() }] : [] };
  function rows() {
    return Array.from({ length: Math.min(100, total - page * 100) }, (_, i) => {
      const id = page * 100 + i;
      return {
        id: `row-${id}`, getClientRects: () => [{}],
        getAttribute: name => name === 'data-legacy-thread-id' ? `thread-${id}` : null,
        querySelector: selector => selector.includes('email')
          ? { getAttribute: name => name === 'email' ? `sender${id % 10}@example.com` : `Sender ${id % 10}` }
          : selector.includes('title') ? { getAttribute: () => '2026-10-16T09:00:00Z' } : null,
      };
    });
  }
  const document = {
    querySelector(selector) {
      if (selector === 'tr.zA') return rows()[0];
      if (selector === 'div[gh="tm"]') return toolbar;
      if (selector.includes('Older')) return older;
      if (selector === 'input[name="q"]') return { value: 'category:primary' };
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
  });
  vm.runInContext(fs.readFileSync(require.resolve('../content.js'), 'utf8'), context);
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
