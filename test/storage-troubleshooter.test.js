const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const scriptPath = require('node:path').join(__dirname, '../docs/tools/storage-troubleshooter.js');
const source = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : '';
const context = { module: { exports: {} } };
vm.runInNewContext(source, context);
const diagnose = context.module.exports.diagnose;

test('unknown values do not become zero usage or a full-account diagnosis', () => {
  assert.equal(typeof diagnose, 'function');
  const result = diagnose({});
  assert.equal(result.status, 'unknown');
  assert.equal(result.total, null);
  assert.equal(result.dominant, null);
});

test('zero usage is valid while invalid numeric entries stop the diagnosis', () => {
  assert.equal(diagnose({ gmail: '0', drive: 0, photos: 0, quota: 15 }).status, 'below');
  for (const value of [-1, 'NaN', NaN, Infinity, '1e999', 'abc', true]) {
    assert.equal(diagnose({ gmail: value, quota: 15 }).status, 'invalid');
  }
  assert.equal(diagnose({ quota: 0 }).status, 'invalid');
});

test('full status uses actual quota and keeps over-quota usage valid', () => {
  assert.equal(diagnose({ gmail: 10, drive: 4, photos: 1, quota: 15 }).status, 'full');
  const over = diagnose({ gmail: 20, drive: 4, photos: 1, quota: 15 });
  assert.equal(over.status, 'full');
  assert.ok(over.notes.some(n => /exceeds/.test(n)));
  assert.equal(diagnose({ gmail: 20, drive: 4, photos: 1, quota: 100 }).status, 'below');
});

test('partial usage never proves free space but can prove the limit is reached', () => {
  assert.equal(diagnose({ gmail: 5, quota: 15 }).status, 'unknown');
  assert.equal(diagnose({ gmail: 15, quota: 15 }).status, 'full');
  assert.equal(diagnose({ gmail: 15 }).status, 'unknown');
});

test('only a complete breakdown identifies a unique largest service', () => {
  assert.equal(diagnose({ gmail: 12, drive: 2, photos: 1 }).dominant, 'gmail');
  assert.equal(diagnose({ gmail: 1, drive: 12, photos: 2 }).dominant, 'drive');
  assert.equal(diagnose({ gmail: 1, drive: 2, photos: 12 }).dominant, 'photos');
  assert.equal(diagnose({ gmail: 2, drive: 2, photos: 0 }).dominant, null);
  assert.equal(diagnose({ gmail: 12 }).dominant, null);
  assert.equal(diagnose({ gmail: 0, drive: 0, photos: 0 }).dominant, null);
});

test('trash and recent-empty symptoms surface review and meter-delay guidance', () => {
  const trash = diagnose({ symptom: 'trash' });
  assert.ok(trash.steps.some(s => /still counts/.test(s)));
  assert.ok(trash.steps.some(s => /recover/.test(s)));
  const recent = diagnose({ symptom: 'recent' });
  assert.ok(recent.steps.some(s => /48–72/.test(s)));
  assert.ok(recent.steps.some(s => /Avoid repeated/.test(s)));
});

test('receiving trouble with reported headroom does not promise a storage fix', () => {
  const result = diagnose({ gmail: 1, drive: 1, photos: 1, quota: 100, symptom: 'receive' });
  assert.equal(result.status, 'below');
  assert.ok(result.steps.some(s => /does not establish/.test(s)));
  assert.ok(diagnose({ symptom: 'receive' }).steps.some(s => /returned/.test(s)));
});

test('unknown symptoms are handled without inventing an account diagnosis', () => {
  assert.equal(diagnose({ symptom: 'unexpected', quota: '' }).status, 'unknown');
  assert.equal(diagnose({ gmail: '  ', quota: null }).total, null);
});
