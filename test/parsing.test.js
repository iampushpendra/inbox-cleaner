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
