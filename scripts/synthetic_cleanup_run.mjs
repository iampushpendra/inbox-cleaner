// synthetic_cleanup_run.mjs — one reproducible synthetic native-vs-extension
// cleanup task over a seeded mailbox model.
//
// This runs the shipped sender-grouping logic from parsing.js against a
// generated model and compares two scopes: a native Gmail search selection and
// the extension's sender-wide action. It contacts no mailbox, authenticates to
// nothing, and deletes nothing. Timings measure this harness only and are never
// a Gmail or extension performance benchmark.
//
//   node scripts/synthetic_cleanup_run.mjs [--conversations N] [--seed N] [--out PATH]

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const parsing = require(resolve(ROOT, 'parsing.js'));

const CATEGORIES = ['primary', 'social', 'promotions', 'updates', 'forums'];
const MS_PER_DAY = 86400000;

// A fixed linear congruential generator keeps every run byte-identical, so a
// report can be regenerated and diffed instead of re-measured.
function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function buildMailbox({ conversations = 2000, senders = 60, seed = 20261018, now = Date.parse('2026-10-18T00:00:00Z') } = {}) {
  const random = lcg(seed);
  const senderName = index => `sender${index}@example.com`;
  // A skewed sender distribution so a few senders really do dominate, the way
  // a cluttered mailbox looks, instead of a flat curve.
  const weight = index => 1 / (index + 1) ** 0.85;
  const totalWeight = Array.from({ length: senders }, (_, i) => weight(i)).reduce((a, b) => a + b, 0);
  const pickSender = () => {
    let target = random() * totalWeight;
    for (let i = 0; i < senders; i += 1) {
      target -= weight(i);
      if (target <= 0) return senderName(i);
    }
    return senderName(senders - 1);
  };

  const mailbox = [];
  for (let c = 0; c < conversations; c += 1) {
    const primary = pickSender();
    const messageCount = 1 + (random() < 0.25 ? 1 : 0) + (random() < 0.08 ? 1 : 0);
    const messages = [];
    for (let m = 0; m < messageCount; m += 1) {
      // A minority of conversations carry a second sender. Gmail threads these
      // together, which is what makes sender-wide action ambiguous.
      const mixed = m > 0 && random() < 0.35;
      messages.push({
        id: `${c}-${m}`,
        sender: m === 0 || !mixed ? primary : pickSender(),
        date: new Date(now - Math.floor(random() ** 1.6 * 1095) * MS_PER_DAY).toISOString().slice(0, 10),
        starred: random() < 0.12,
        sizeKb: Math.round((2 + random() ** 3 * 8000) * 10) / 10,
        category: CATEGORIES[Math.floor(random() * CATEGORIES.length)],
      });
    }
    mailbox.push({ id: `thread-${c}`, messages });
  }
  return mailbox;
}

export function nativeSelection(mailbox, query, now = Date.parse('2026-10-18T00:00:00Z')) {
  // The modelled query is `older_than:1y -is:starred`. Gmail matches individual
  // messages but displays whole conversations, so a conversation is returned
  // when any one message satisfies the filter.
  const cutoff = now - 365 * MS_PER_DAY;
  const matches = message => Date.parse(message.date) < cutoff && !message.starred;
  const selected = new Set();
  for (const conversation of mailbox) {
    if (conversation.messages.some(matches)) selected.add(conversation.id);
  }
  return { query, selected, matches };
}

// The extension discovers senders from the sender Gmail displays on each row,
// then acts with a `from:(sender)` query, which matches that sender in *any*
// conversation — including ones the scan never attributed to them.
export function extensionScope(mailbox, topSenders) {
  const accumulator = {};
  for (const category of CATEGORIES) {
    const rows = mailbox
      .filter(conversation => conversation.messages[0].category === category)
      .map(conversation => ({
        email: conversation.messages[0].sender,
        name: conversation.messages[0].sender,
        dateTs: Date.parse(conversation.messages[0].date),
      }));
    parsing.mergeCategoryResults(accumulator, category, rows);
  }
  const ranked = parsing.finalizeSenders(accumulator);
  const chosen = ranked.slice(0, topSenders);
  const chosenSet = new Set(chosen.map(sender => sender.email));
  const selected = new Set();
  for (const conversation of mailbox) {
    if (conversation.messages.some(message => chosenSet.has(message.sender))) selected.add(conversation.id);
  }
  return { selected, chosen, scannedSenders: ranked.length };
}

function measure(mailbox, selected) {
  let conversations = 0;
  let messages = 0;
  let kb = 0;
  for (const conversation of mailbox) {
    if (!selected.has(conversation.id)) continue;
    conversations += 1;
    for (const message of conversation.messages) {
      messages += 1;
      kb += message.sizeKb;
    }
  }
  return { conversations, messages, kb: Math.round(kb) };
}

// The honest failure list: a sender the scan counted fewer conversations for
// than its action will actually touch, because other conversations carried that
// sender without displaying it.
function undercountedSenders(mailbox, chosen) {
  const counts = [];
  for (const sender of chosen) {
    const touched = mailbox.filter(c => c.messages.some(m => m.sender === sender.email)).length;
    const attributed = sender.count;
    if (touched > attributed) counts.push({ email: sender.email, scanCount: attributed, actionTouches: touched });
  }
  return counts;
}

function messagesOutsideQuery(mailbox, selected, matches) {
  let messages = 0;
  let conversations = 0;
  for (const conversation of mailbox) {
    if (!selected.has(conversation.id)) continue;
    const unwanted = conversation.messages.filter(message => !matches(message));
    if (!unwanted.length) continue;
    conversations += 1;
    messages += unwanted.length;
  }
  return { conversations, messages };
}

export function runTask(options = {}) {
  const config = { conversations: 2000, seed: 20261018, topSenders: 5, ...options };
  const mailbox = buildMailbox(config);

  const nativeStart = process.hrtime.bigint();
  const native = nativeSelection(mailbox, 'older_than:1y -is:starred');
  const nativeMs = Number(process.hrtime.bigint() - nativeStart) / 1e6;

  const extensionStart = process.hrtime.bigint();
  const extension = extensionScope(mailbox, config.topSenders);
  const extensionMs = Number(process.hrtime.bigint() - extensionStart) / 1e6;

  const nativeMeasure = measure(mailbox, native.selected);
  const extensionMeasure = measure(mailbox, extension.selected);

  return {
    config,
    mailboxSize: {
      conversations: mailbox.length,
      messages: mailbox.reduce((total, c) => total + c.messages.length, 0),
      senders: new Set(mailbox.flatMap(c => c.messages.map(m => m.sender))).size,
    },
    native: {
      ...nativeMeasure,
      harness_ms: Math.round(nativeMs * 1000) / 1000,
      outsideQuery: messagesOutsideQuery(mailbox, native.selected, native.matches),
    },
    extension: {
      ...extensionMeasure,
      harness_ms: Math.round(extensionMs * 1000) / 1000,
      scannedSenders: extension.scannedSenders,
      chosenSenders: extension.chosen.length,
      undercounted: undercountedSenders(mailbox, extension.chosen),
    },
    overlap: {
      both: [...native.selected].filter(id => extension.selected.has(id)).length,
      nativeOnly: [...native.selected].filter(id => !extension.selected.has(id)).length,
      extensionOnly: [...extension.selected].filter(id => !native.selected.has(id)).length,
    },
  };
}

export function render(result) {
  const { config, mailboxSize, native, extension, overlap } = result;
  const undercounted = extension.undercounted;
  const lines = [
    '# Synthetic native-vs-extension cleanup run',
    '',
    `Generated ${new Date().toISOString().slice(0, 10)} by \`node scripts/synthetic_cleanup_run.mjs\` from seed ${config.seed}.`,
    'Re-running with the same seed reproduces the mailbox, every count and every ratio below exactly. The generation',
    'date and the harness timings differ between runs, which is why they carry no weight in this comparison.',
    '',
    '## What this is, and what it is not',
    '',
    'This is a synthetic scope comparison. It runs the shipped sender-grouping logic from `parsing.js` over a',
    `generated mailbox of ${mailboxSize.conversations} conversations, ${mailboxSize.messages} messages and ${mailboxSize.senders} senders`,
    'using reserved `example.com` addresses. No mailbox is connected, no account is authenticated, nothing is deleted,',
    'and no screenshot is presented as proof of real Gmail or extension behaviour.',
    '',
    `The millisecond figures below are timings for this harness only — a Node process walking an in-memory array. They are`,
    'not Gmail latency, not extension scan time, and must never be quoted as a benchmark or a speed claim.',
    '',
    '## Task setup',
    '',
    '| Setting | Value |',
    '|---|---|',
    `| Seed | ${config.seed} |`,
    `| Conversations | ${configSize(config.conversations)} |`,
    `| Senders | ${mailboxSize.senders} (skewed distribution) |`,
    `| Native query | \`older_than:1y -is:starred\`, then select all conversations matching this search |`,
    `| Extension action | Delete sender-wide for the top ${extension.chosenSenders} senders by scan count |`,
    '| Mixed conversations | ~35% of follow-up messages belong to a second sender |',
    '| Environment | Local Node script, synthetic model, no browser, no Gmail, no Chrome |',
    '',
    '## Counts',
    '',
    '| Scope | Conversations removed | Messages removed | Declared KB |',
    '|---|---:|---:|---:|',
    `| Native search selection | ${native.conversations} | ${native.messages} | ${native.kb} |`,
    `| Extension sender-wide action | ${extension.conversations} | ${extension.messages} | ${extension.kb} |`,
    '',
    'Overlap between the two scopes: ' +
      `${overlap.both} conversations removed by both, ${overlap.nativeOnly} native only, ${overlap.extensionOnly} extension only.`,
    '',
    '## Observed failure modes',
    '',
    'Both paths over-remove, for different reasons. These are the modelled, reproducible differences.',
    '',
    `1. **Native selection removes messages the query never asked for.** ${native.outsideQuery.conversations} of the`,
    `   ${native.conversations} removed conversations contain at least one message that fails the filter,`,
    `   ${native.outsideQuery.messages} messages in total. Gmail returns a conversation when any single message matches,`,
    '   which is the caveat in Google’s own search-operator documentation.',
    `2. **The sender-wide action reaches conversations outside the search.** ${overlap.extensionOnly} conversations are`,
    '   removed by the extension but would not have been returned by the modelled query at all, because the action',
    '   inherits no date, size, category or starred restriction.',
    `3. **Scan counts and action scope disagree on mixed conversations.** ${undercounted.length} of the`,
    `   ${extension.chosenSenders} chosen senders are touched by more conversations than the scan attributed to them.`,
    '   The scan reads the sender Gmail displays on a row; the `from:` action matches that sender anywhere in a',
    '   conversation. The number a user sees before acting can understate what the action will remove.',
    '',
    undercounted.length
      ? '| Sender | Scan-attributed conversations | Conversations the action actually touches | Difference |\n|---|---:|---:|---:|\n' +
        undercounted.map(s => `| \`${s.email}\` | ${s.scanCount} | ${s.actionTouches} | +${s.actionTouches - s.scanCount} |`).join('\n') +
        '\n'
      : 'No chosen sender showed a scan/action mismatch in this run.\n',
    '## Harness timings (not a benchmark)',
    '',
    '| Step | Harness ms |',
    '|---|---:|',
    `| Native selection | ${native.harness_ms} |`,
    `| Extension scan and scope | ${extension.harness_ms} |`,
    '',
    '## Limitations',
    '',
    '- The mailbox is generated, so its sender skew, mixed-conversation rate and message sizes are assumptions, not a',
    '  captured mailbox. Real distributions will differ and can change every ratio above.',
    '- Threading is modelled as a fixed conversation with a displayed first message. Gmail’s real threading, aliases and',
    '  participant handling are not reproduced.',
    '- Only one query and one action shape are modelled. Other filters produce different mixed-conversation exposure.',
    '- Declared KB sums synthetic message sizes. It is not a quota forecast, and no storage is reclaimed by this script.',
    '- Timings measure an in-memory array, not Gmail’s network, DOM or extension host. They carry no performance meaning.',
    '- This closes no external gate. Installed-package verification, live Gmail walkthroughs, competitor trials and',
    '  post-recrawl analytics remain open.',
    '',
    '## How to reproduce',
    '',
    '```',
    `node scripts/synthetic_cleanup_run.mjs --conversations ${config.conversations} --seed ${config.seed}`,
    '```',
    '',
    'Change the seed or the conversation count to see how sensitive each ratio is to the model, not to Gmail.',
    '',
  ];
  return lines.join('\n');
}

const configSize = value => value.toLocaleString('en-US');

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--conversations') options.conversations = Number(argv[++i]);
    if (argv[i] === '--seed') options.seed = Number(argv[++i]);
    if (argv[i] === '--top-senders') options.topSenders = Number(argv[++i]);
    if (argv[i] === '--out') options.out = argv[++i];
  }
  return options;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const result = runTask(options);
  const out = resolve(ROOT, options.out || 'reports/synthetic-cleanup-run.md');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(result));
  console.log(`Synthetic cleanup run written: ${out}`);
  console.log(`Native ${result.native.conversations} conversations / extension ${result.extension.conversations} conversations`);
}
