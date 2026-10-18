const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const load = () => import(path.join(ROOT, 'scripts/synthetic_cleanup_run.mjs'));

// The run is a synthetic scope comparison. It must stay reproducible and must
// never reach a mailbox, so these guard the artifact's honesty as much as its
// arithmetic.
test('the same seed reproduces the same mailbox and the same counts', async () => {
  const { buildMailbox, runTask } = await load();
  assert.deepEqual(buildMailbox({ seed: 7 }), buildMailbox({ seed: 7 }));
  // Timings are excluded on purpose: they measure this machine, not the model.
  const counted = ({ harness_ms, ...rest }) => rest;
  assert.deepEqual(counted(runTask({ seed: 7 }).native), counted(runTask({ seed: 7 }).native));
  assert.notDeepEqual(counted(runTask({ seed: 7 }).native), counted(runTask({ seed: 8 }).native));
});

test('the generated mailbox uses reserved example.com addresses only', async () => {
  const { buildMailbox } = await load();
  const mailbox = buildMailbox({ conversations: 300, seed: 3 });
  for (const conversation of mailbox) {
    for (const message of conversation.messages) {
      assert.match(message.sender, /@example\.com$/);
    }
  }
});

test('native selection returns a conversation when any one message matches', async () => {
  const { buildMailbox, nativeSelection } = await load();
  const now = Date.parse('2026-10-18T00:00:00Z');
  const mailbox = [
    { id: 'all-match', messages: [
      { id: 'a', sender: 'x@example.com', date: '2024-01-01', starred: false, sizeKb: 1 },
      { id: 'b', sender: 'y@example.com', date: '2026-09-01', starred: false, sizeKb: 1 },
    ] },
    { id: 'starred-only', messages: [
      { id: 'c', sender: 'x@example.com', date: '2024-01-01', starred: true, sizeKb: 1 },
    ] },
    { id: 'recent-only', messages: [
      { id: 'd', sender: 'x@example.com', date: '2026-09-01', starred: false, sizeKb: 1 },
    ] },
  ];
  const { selected, matches } = nativeSelection(mailbox, 'older_than:1y -is:starred', now);
  assert.deepEqual([...selected], ['all-match']);
  assert.equal(matches(mailbox[0].messages[1]), false, 'a recent unstarred message fails the age filter');
});

test('the sender-wide action never touches fewer conversations than the scan attributed', async () => {
  const { runTask } = await load();
  const { extension } = runTask({ seed: 20261018, topSenders: 5 });
  assert.ok(extension.chosenSenders > 0);
  for (const sender of extension.undercounted) {
    // A scan that over-counted would be safe to omit; this asserts the
    // documented direction of the gap, which is the scope risk worth stating.
    assert.ok(sender.actionTouches > sender.scanCount,
      `${sender.email} should be reached by more conversations than the scan attributed`);
  }
});

test('both scopes stay internally consistent with the mailbox they removed from', async () => {
  const { runTask } = await load();
  const result = runTask({ seed: 20261018, topSenders: 5 });
  // The report's headline claims must be real, not artefacts of a helper.
  assert.ok(result.native.conversations > 0 && result.extension.conversations > 0);
  assert.ok(result.overlap.extensionOnly > 0,
    'the sender-wide action is expected to reach conversations the modelled query would not return');
  assert.equal(result.overlap.both + result.overlap.nativeOnly, result.native.conversations);
  assert.equal(result.overlap.both + result.overlap.extensionOnly, result.extension.conversations);
  assert.ok(result.extension.messages > result.extension.conversations,
    'mixed conversations mean more messages than conversations are removed');
});

test('the generated report states it is not a benchmark', async () => {
  const { runTask, render } = await load();
  const report = render(runTask({ seed: 20261018 }));
  assert.match(report, /not a benchmark/i);
  assert.match(report, /not Gmail latency/);
  assert.match(report, /No mailbox is connected/);
  // It must not promise byte-identical output; only the counts are reproducible.
  assert.match(report, /reproduces the mailbox, every count and every ratio/i);
  assert.ok(fs.existsSync(path.join(ROOT, 'reports/synthetic-cleanup-run.md')),
    'the committed report should exist alongside the script');
});
