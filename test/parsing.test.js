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

test('buildFromQueries filters out falsy/invalid entries before chunking', () => {
  const queries = buildFromQueries(['a@x.com', '', 'b@x.com'], 2);
  assert.deepEqual(queries, ['from:(a@x.com OR b@x.com)']);
});

test('buildFromQueries chunks at the default chunkSize of 20', () => {
  const emails = Array.from({ length: 25 }, (_, i) => `user${i}@x.com`);
  const queries = buildFromQueries(emails);
  assert.equal(queries.length, 2);
  assert.equal(queries[0], `from:(${emails.slice(0, 20).join(' OR ')})`);
  assert.equal(queries[1], `from:(${emails.slice(20).join(' OR ')})`);
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

test('mergeCategoryResults skips a row with an empty email', () => {
  const rows = [
    { name: 'Unknown', email: '', dateTs: 100, threadId: 't1' },
    { name: 'A', email: 'a@x.com', dateTs: 200, threadId: 't2' },
  ];
  const acc = mergeCategoryResults({}, 'PRIMARY', rows);
  assert.deepEqual(acc, {
    'a@x.com': { name: 'A', email: 'a@x.com', count: 1, latest: 200, categories: ['PRIMARY'] },
  });
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

// --- pagination + exact-count logic (A+B) ---

const {
  parseResultRange,
  hasMorePages,
  buildSenderQuery,
  applyExactCounts,
} = require('../parsing.js');

test('parseResultRange parses Gmail\'s en-dash range with a comma-grouped total', () => {
  assert.deepEqual(parseResultRange('1–100 of 12,847'), {
    start: 1, end: 100, total: 12847, estimated: false,
  });
});

test('parseResultRange accepts an ASCII hyphen as the range separator', () => {
  assert.deepEqual(parseResultRange('101-200 of 900'), {
    start: 101, end: 200, total: 900, estimated: false,
  });
});

test('parseResultRange handles Indian digit grouping in the total', () => {
  assert.equal(parseResultRange('1–100 of 1,00,000').total, 100000);
});

test('parseResultRange treats "of many" as an estimate with an unknown total', () => {
  assert.deepEqual(parseResultRange('1–100 of many'), {
    start: 1, end: 100, total: null, estimated: true,
  });
});

test('parseResultRange tolerates non-breaking spaces', () => {
  assert.equal(parseResultRange('1 – 100 of 250').total, 250);
});

test('parseResultRange returns null for text that is not a result range', () => {
  assert.equal(parseResultRange(''), null);
  assert.equal(parseResultRange('Inbox'), null);
  assert.equal(parseResultRange(undefined), null);
});

test('hasMorePages is true when the page end is short of the total', () => {
  assert.equal(hasMorePages({ start: 1, end: 100, total: 12847, estimated: false }), true);
});

test('hasMorePages is false on the last page', () => {
  assert.equal(hasMorePages({ start: 201, end: 250, total: 250, estimated: false }), false);
});

test('hasMorePages is true when the total is an unknown estimate', () => {
  assert.equal(hasMorePages({ start: 1, end: 100, total: null, estimated: true }), true);
});

test('hasMorePages is false when the range could not be parsed', () => {
  assert.equal(hasMorePages(null), false);
});

test('buildSenderQuery builds an All Mail from: query for one sender', () => {
  assert.equal(buildSenderQuery('News@Shop.com'), 'from:(news@shop.com)');
});

test('applyExactCounts replaces the sampled count and preserves it as sampledCount', () => {
  const senders = [{ name: 'A', email: 'a@x.com', count: 23, latest: 5, categories: ['PROMOTIONS'] }];
  const result = applyExactCounts(senders, { 'a@x.com': 812 });
  assert.deepEqual(result, [{
    name: 'A', email: 'a@x.com', count: 812, sampledCount: 23,
    latest: 5, categories: ['PROMOTIONS'], exact: true,
  }]);
});

test('applyExactCounts keeps the sampled count when no exact total is available', () => {
  const senders = [{ name: 'A', email: 'a@x.com', count: 23, latest: 5, categories: [] }];
  const result = applyExactCounts(senders, { 'a@x.com': null });
  assert.equal(result[0].count, 23);
  assert.equal(result[0].sampledCount, 23);
  assert.equal(result[0].exact, false);
});

test('applyExactCounts re-sorts by the exact count, not the sampled one', () => {
  const senders = [
    { name: 'A', email: 'a@x.com', count: 50, latest: 1, categories: [] },
    { name: 'B', email: 'b@y.com', count: 10, latest: 1, categories: [] },
  ];
  const result = applyExactCounts(senders, { 'a@x.com': 60, 'b@y.com': 4000 });
  assert.deepEqual(result.map(s => s.email), ['b@y.com', 'a@x.com']);
});

// --- cleanup contract (R03–R09): policy, counts, identity, storage ---

const {
  normalizeAddress,
  normalizeAddresses,
  normalizePolicy,
  normalizeDateInput,
  policyOperators,
  buildPolicyQuery,
  buildPolicyChunks,
  applyCountResults,
  confidenceOf,
  formatCount,
  summarizeSelection,
  formatSelectionSummary,
  formatUpperBound,
  receiptStatus,
  extractAddresses,
  chooseIdentity,
  buildGmailSearchUrl,
  buildGmailTrashUrl,
  migrateContainer,
  accountSnapshot,
  putAccountSnapshot,
  isActionableSnapshot,
  appendHistory,
} = require('../parsing.js');

test('normalizeAddresses lowercases, trims, dedupes and rejects non-addresses', () => {
  assert.deepEqual(
    normalizeAddresses([' A@X.com ', 'a@x.com', 'not-an-email', 'two words@x.com', 'b@x.com']),
    ['a@x.com', 'b@x.com'],
  );
  assert.equal(normalizeAddress(''), '');
  assert.equal(normalizeAddress('a@x.com)OR(from:victim@x.com'), '', 'query syntax cannot ride in on an address');
  assert.equal(normalizeAddress('"a"@x.com'), '');
});

test('policy chunks are disjoint and carry the same operators (C-18)', () => {
  const policy = normalizePolicy({
    emails: ['A@X.com', 'b@x.com', 'a@x.com'],
    action: 'trash',
    protect: { starred: true, important: true },
  });
  assert.deepEqual(policy.emails, ['a@x.com', 'b@x.com']);
  assert.deepEqual(buildPolicyChunks(policy), [{
    emails: ['a@x.com', 'b@x.com'],
    query: 'from:(a@x.com OR b@x.com) -in:trash -is:starred -is:important',
  }]);
  assert.equal(buildPolicyQuery(policy), 'from:(a@x.com OR b@x.com) -in:trash -is:starred -is:important');
});

test('archive is scoped to Inbox and never includes mail already in Trash', () => {
  const policy = normalizePolicy({
    emails: ['a@x.com'], action: 'archive', protect: { starred: false, important: false, unread: true },
    before: '2025-01-02',
  });
  assert.deepEqual(policyOperators(policy), ['in:inbox', '-in:trash', '-is:unread', 'before:2025/01/02']);
  assert.equal(buildPolicyChunks(policy)[0].query,
    'from:(a@x.com) in:inbox -in:trash -is:unread before:2025/01/02');
});

test('protections default ON and unread defaults OFF', () => {
  assert.deepEqual(normalizePolicy({ emails: ['a@x.com'] }).protect,
    { starred: true, important: true, unread: false });
});

test('normalizeDateInput accepts only real calendar dates and normalizes separators', () => {
  assert.equal(normalizeDateInput('2026-02-03'), '2026/02/03');
  assert.equal(normalizeDateInput('2026/02/03'), '2026/02/03');
  assert.equal(normalizeDateInput('2026-02-30'), '', 'February 30 does not exist');
  assert.equal(normalizeDateInput('2026-2-03'), '');
  assert.equal(normalizeDateInput('tomorrow'), '');
});

test('an exact union count is the only destructive total; a sender sum stays an upper bound', () => {
  const senders = [
    { email: 'a@x.com', count: 10, confidence: 'exact' },
    { email: 'b@x.com', count: 5, confidence: 'sampled' },
  ];
  const exact = summarizeSelection({ senders, union: { status: 'exact', total: 12 } });
  assert.equal(exact.total, 12);
  assert.equal(exact.senderSum, 15);
  assert.equal(formatSelectionSummary(exact), '2 senders · 12 conversations');
  assert.match(formatUpperBound(exact), /up to 15 conversations/);

  const unknown = summarizeSelection({ senders, union: { status: 'unknown', total: 12, reason: 'of many' } });
  assert.equal(unknown.total, null, 'a number from an inexact scope is never promoted to a total');
  assert.equal(formatSelectionSummary(unknown), '2 senders · total unknown (of many)');

  const bounded = summarizeSelection({
    senders, union: { status: 'bounded', total: null, upperBound: 12, reason: 'summed across batches' },
  });
  assert.equal(bounded.total, null);
  assert.equal(bounded.upperBound, 12);
  assert.equal(formatSelectionSummary(bounded),
    '2 senders · up to 12 conversations (summed across batches)');
});

test('a hostile or missing union cannot supply a total', () => {
  const summary = summarizeSelection({ senders: [{ email: 'a@x.com', count: 3 }] });
  assert.equal(summary.confidence, 'unverified');
  assert.equal(summary.total, null);
});

test('applyCountResults never upgrades an unknown count to exact and preserves the sample', () => {
  const senders = [
    { email: 'a@x.com', count: 5 },
    { email: 'b@x.com', count: 7 },
    { email: 'c@x.com', count: 9 },
  ];
  const result = applyCountResults(senders, {
    'a@x.com': { status: 'exact', total: 40 },
    'b@x.com': { status: 'unknown', reason: 'of many' },
  });
  const byEmail = Object.fromEntries(result.map(sender => [sender.email, sender]));
  assert.deepEqual(
    { count: byEmail['a@x.com'].count, sampledCount: byEmail['a@x.com'].sampledCount, confidence: byEmail['a@x.com'].confidence },
    { count: 40, sampledCount: 5, confidence: 'exact' },
  );
  assert.deepEqual(
    { count: byEmail['b@x.com'].count, confidence: byEmail['b@x.com'].confidence },
    { count: 7, confidence: 'unknown' },
  );
  assert.deepEqual(
    { count: byEmail['c@x.com'].count, confidence: byEmail['c@x.com'].confidence },
    { count: 9, confidence: 'sampled' },
  );
  assert.equal(confidenceOf({ exact: true }), 'exact');
  assert.equal(confidenceOf({}), 'sampled');
});

test('formatCount labels unknown and unverified without a number', () => {
  assert.equal(formatCount(10, 'exact'), '10 conversations');
  assert.equal(formatCount(10, 'sampled'), '≈10 conversations');
  assert.equal(formatCount(10, 'unknown'), 'total unknown');
  assert.equal(formatCount(10, 'unverified'), 'could not be verified');
});

test('receiptStatus reports only what the chunks prove', () => {
  assert.equal(receiptStatus([]), 'failed');
  assert.equal(receiptStatus([{ outcome: 'not-attempted' }]), 'cancelled');
  assert.equal(receiptStatus([{ outcome: 'verified' }, { outcome: 'verified' }]), 'completed');
  assert.equal(receiptStatus([{ outcome: 'verified' }, { outcome: 'not-attempted' }]), 'partial');
  assert.equal(receiptStatus([{ outcome: 'verified' }, { outcome: 'unknown' }]), 'partial');
  assert.equal(receiptStatus([{ outcome: 'unknown' }]), 'unknown');
  assert.equal(receiptStatus([{ outcome: 'failed' }]), 'failed');
  assert.equal(receiptStatus([{ outcome: 'verified' }, { outcome: 'failed' }]), 'partial');
});

test('identity is the single addressed account, never a guess between accounts', () => {
  assert.deepEqual(
    chooseIdentity({ texts: ['Account: Owner@Example.com'], pathname: '/mail/u/3/', documentId: 'doc-1' }),
    { accountKey: 'owner@example.com', ambiguous: false, uIndex: 3, source: 'avatar', documentId: 'doc-1' },
  );
  const two = chooseIdentity({ texts: ['a@x.com', 'b@x.com'], pathname: '/mail/u/0/' });
  assert.equal(two.accountKey, null);
  assert.equal(two.ambiguous, true);
  assert.equal(two.source, 'unknown');
  assert.equal(chooseIdentity({ texts: ['no address here'] }).accountKey, null);
  assert.deepEqual(extractAddresses(['A@X.com', 'a@x.com b@y.com']), ['a@x.com', 'b@y.com']);
});

test('Gmail links use the verified account index', () => {
  assert.equal(buildGmailSearchUrl(2, 'from:(a@x.com)'),
    'https://mail.google.com/mail/u/2/#search/from%3A(a%40x.com)');
  assert.equal(buildGmailSearchUrl(undefined, 'x'), 'https://mail.google.com/mail/u/0/#search/x');
  assert.equal(buildGmailTrashUrl(1), 'https://mail.google.com/mail/u/1/#trash');
});

test('legacy payloads migrate read-only and can never be acted on', () => {
  const legacy = migrateContainer({ total: 3, senders: [{ email: 'old@x.com' }] });
  assert.equal(legacy.version, 2);
  assert.deepEqual(legacy.accounts, {});
  assert.equal(legacy.legacyUnbound.viewOnly, true);
  assert.equal(legacy.legacyUnbound.accountKey, null);
  assert.equal(isActionableSnapshot(legacy.legacyUnbound, null), false);

  const snapshot = { accountKey: 'owner@example.com', senders: [] };
  const bound = putAccountSnapshot(legacy, 'owner@example.com', snapshot);
  assert.equal(accountSnapshot(bound, 'owner@example.com'), snapshot);
  assert.equal(isActionableSnapshot(snapshot, 'owner@example.com'), true);
  assert.equal(isActionableSnapshot(snapshot, 'other@example.com'), false, 'snapshots are per account');
  assert.equal(isActionableSnapshot({ ...snapshot, partial: true }, 'owner@example.com'), false);
  assert.equal(isActionableSnapshot({ ...snapshot, viewOnly: true }, 'owner@example.com'), false);
});

test('account snapshots for different accounts do not overwrite each other', () => {
  let box = putAccountSnapshot({}, 'a@x.com', { accountKey: 'a@x.com', senders: [] });
  box = putAccountSnapshot(box, 'b@x.com', { accountKey: 'b@x.com', senders: [] });
  assert.equal(accountSnapshot(box, 'a@x.com').accountKey, 'a@x.com');
  assert.equal(accountSnapshot(box, 'b@x.com').accountKey, 'b@x.com');
});

test('appendHistory keeps newest first and caps the record count', () => {
  let history = appendHistory(null, { id: 1 }, 2);
  history = appendHistory(history, { id: 2 }, 2);
  history = appendHistory(history, { id: 3 }, 2);
  assert.deepEqual(history, { version: 1, entries: [{ id: 3 }, { id: 2 }] });
});
