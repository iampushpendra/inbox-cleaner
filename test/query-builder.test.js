'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildQuery, checkQuery, gmailSearchUrl } = require('../docs/tools/query-builder.js');

test('generates a sender/category/relative-age/size intersection', () => {
  assert.deepEqual(buildQuery({ sender: 'offers@example.com', category: 'promotions', ageMode: 'relative', age: '6', ageUnit: 'm', size: '10', sizeUnit: 'M' }), {
    query: 'from:offers@example.com category:promotions older_than:6m larger:10M', errors: []
  });
});
test('fixed dates replace relative criteria and use slash date operators', () => {
  assert.equal(buildQuery({ ageMode: 'fixed', after: '2024-02-29', before: '2025-01-01', age: '6', ageUnit: 'm' }).query, 'after:2024/02/29 before:2025/01/01');
  assert.equal(buildQuery({ ageMode: 'none', after: '2024-02-29', age: '6' }).query, '');
});
test('rejects invalid calendar dates, reversed and equal date ranges', () => {
  for (const input of [{ after: '2023-02-29' }, { before: '2024-04-31' }, { after: '2024-05-02', before: '2024-05-01' }, { after: '2024-05-01', before: '2024-05-01' }, { before: '0000-01-01' }]) {
    assert.ok(buildQuery({ ageMode: 'fixed', ...input }).errors.length, JSON.stringify(input));
  }
});
test('accepts numeric boundaries and rejects zero, negatives, decimals, overflow and exponents', () => {
  for (const n of ['1', '9999']) assert.equal(buildQuery({ ageMode: 'relative', age: n, ageUnit: 'd' }).errors.length, 0);
  for (const n of ['0', '-1', '1.5', '10000', '1e2', 'Infinity', '2 OR from:me']) assert.ok(buildQuery({ ageMode: 'relative', age: n, ageUnit: 'd' }).errors.length);
  for (const n of ['1', '999999999']) assert.equal(buildQuery({ size: n, sizeUnit: 'bytes' }).errors.length, 0);
  for (const n of ['0', '1.5', '1000000000', '1e6']) assert.ok(buildQuery({ size: n, sizeUnit: 'M' }).errors.length);
});
test('rejects sender and enum injection without emitting a partial usable query', () => {
  for (const input of [{ sender: 'a@example.com OR in:anywhere' }, { sender: '<img src=x onerror=alert(1)>' }, { sender: 'a\n@example.com' }, { sender: 'x:{a}@example.com' }, { category: 'promotions OR in:anywhere' }, { ageMode: 'relative', age: '1', ageUnit: 'x' }, { size: '2', sizeUnit: 'M OR in:anywhere' }, { ageMode: 'unknown' }]) {
    const result = buildQuery(input); assert.ok(result.errors.length); assert.equal(result.query, '');
  }
  assert.equal(buildQuery({ sender: ' user+news@example.co.uk ' }).query, 'from:user+news@example.co.uk');
});
test('empty and broad searches warn, restrictive searches still require Gmail review', () => {
  assert.ok(checkQuery('').errors.length);
  assert.ok(checkQuery('in:anywhere').warnings.some(w => /broad/i.test(w)));
  assert.ok(checkQuery('-is:starred').warnings.some(w => /broad/i.test(w)));
  assert.equal(checkQuery('from:news@example.com older_than:6m').errors.length, 0);
  assert.ok(checkQuery('from:news@example.com').warnings.some(w => /conversation/i.test(w)));
});
test('checks syntax, numeric and date boundaries in edited queries', () => {
  for (const query of ['from:', 'older_than:0m', 'older_than:2w', 'larger:-1', 'before:2023/02/29', 'after:2024/04/31', 'from:(foo', '"unterminated', 'category:bogus', 'a\u0000b', 'a'.repeat(2049), '\ud800']) assert.ok(checkQuery(query).errors.length, query);
  for (const query of ['older_than:1y', 'larger:10M', 'after:2024/02/29', 'from:"Example Sender"', '{from:a from:b}', 'subject:(hello world)', '"hello world"']) assert.equal(checkQuery(query).errors.length, 0, query);
});
test('detects conservative contradictions without treating alternatives as intersections', () => {
  for (const query of ['after:2025/01/01 before:2024/01/01', 'after:2024/01/01 before:2024/01/01', 'larger:10M smaller:5M', 'older_than:6m newer_than:3m', 'category:social category:promotions', 'is:starred -is:starred']) assert.ok(checkQuery(query).errors.length, query);
  assert.equal(checkQuery('{category:social category:promotions}').errors.length, 0);
  assert.equal(checkQuery('category:social OR category:promotions').errors.length, 0);
  assert.ok(checkQuery('subject:hi').warnings.some(w => /not fully checked/i.test(w)));
});
test('Gmail destination uses fixed HTTPS origin and percent-encodes the entire query', () => {
  const query = 'from:user+news@example.com subject:"x & y/#?"';
  const result = gmailSearchUrl(query);
  assert.equal(result, 'https://mail.google.com/mail/#search/from%3Auser%2Bnews%40example.com%20subject%3A%22x%20%26%20y%2F%23%3F%22');
  assert.equal(new URL(result).origin, 'https://mail.google.com');
  assert.equal(decodeURIComponent(new URL(result).hash.slice(8)), query);
  assert.throws(() => gmailSearchUrl(''));
  assert.throws(() => gmailSearchUrl('\ud800'));
});

test('rejects empty groups, empty quoted queries and dangling Boolean operators', () => {
  for (const query of ['""', '()', '{}', 'AND', 'OR', 'from:()', 'subject:()', 'from:a OR', 'OR from:a', 'from:a AND OR from:b']) assert.ok(checkQuery(query).errors.length, query);
  assert.equal(checkQuery('from:a AND from:b').errors.length, 0);
});
test('flags unsupported status/scope values and mixed-unit comparisons as unchecked', () => {
  for (const query of ['is:custom', 'in:custom', 'larger:10M smaller:100000', 'older_than:1y newer_than:6m']) assert.ok(checkQuery(query).warnings.some(w => /not fully checked/i.test(w)), query);
});
