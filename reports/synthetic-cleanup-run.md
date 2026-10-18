# Synthetic native-vs-extension cleanup run

Generated 2026-10-18 by `node scripts/synthetic_cleanup_run.mjs` from seed 20261018.
Re-running with the same seed reproduces the mailbox, every count and every ratio below exactly. The generation
date and the harness timings differ between runs, which is why they carry no weight in this comparison.

## What this is, and what it is not

This is a synthetic scope comparison. It runs the shipped sender-grouping logic from `parsing.js` over a
generated mailbox of 2000 conversations, 2675 messages and 60 senders
using reserved `example.com` addresses. No mailbox is connected, no account is authenticated, nothing is deleted,
and no screenshot is presented as proof of real Gmail or extension behaviour.

The millisecond figures below are timings for this harness only — a Node process walking an in-memory array. They are
not Gmail latency, not extension scan time, and must never be quoted as a benchmark or a speed claim.

## Task setup

| Setting | Value |
|---|---|
| Seed | 20261018 |
| Conversations | 2,000 |
| Senders | 60 (skewed distribution) |
| Native query | `older_than:1y -is:starred`, then select all conversations matching this search |
| Extension action | Delete sender-wide for the top 5 senders by scan count |
| Mixed conversations | ~35% of follow-up messages belong to a second sender |
| Environment | Local Node script, synthetic model, no browser, no Gmail, no Chrome |

## Counts

| Scope | Conversations removed | Messages removed | Declared KB |
|---|---:|---:|---:|
| Native search selection | 1045 | 1518 | 3035495 |
| Extension sender-wide action | 880 | 1216 | 2379707 |

Overlap between the two scopes: 484 conversations removed by both, 561 native only, 396 extension only.

## Observed failure modes

Both paths over-remove, for different reasons. These are the modelled, reproducible differences.

1. **Native selection removes messages the query never asked for.** 323 of the
   1045 removed conversations contain at least one message that fails the filter,
   339 messages in total. Gmail returns a conversation when any single message matches,
   which is the caveat in Google’s own search-operator documentation.
2. **The sender-wide action reaches conversations outside the search.** 396 conversations are
   removed by the extension but would not have been returned by the modelled query at all, because the action
   inherits no date, size, category or starred restriction.
3. **Scan counts and action scope disagree on mixed conversations.** 5 of the
   5 chosen senders are touched by more conversations than the scan attributed to them.
   The scan reads the sender Gmail displays on a row; the `from:` action matches that sender anywhere in a
   conversation. The number a user sees before acting can understate what the action will remove.

| Sender | Scan-attributed conversations | Conversations the action actually touches | Difference |
|---|---:|---:|---:|
| `sender0@example.com` | 329 | 352 | +23 |
| `sender1@example.com` | 197 | 216 | +19 |
| `sender2@example.com` | 127 | 147 | +20 |
| `sender3@example.com` | 103 | 113 | +10 |
| `sender5@example.com` | 75 | 82 | +7 |

## Harness timings (not a benchmark)

| Step | Harness ms |
|---|---:|
| Native selection | 0.454 |
| Extension scan and scope | 1.151 |

## Limitations

- The mailbox is generated, so its sender skew, mixed-conversation rate and message sizes are assumptions, not a
  captured mailbox. Real distributions will differ and can change every ratio above.
- Threading is modelled as a fixed conversation with a displayed first message. Gmail’s real threading, aliases and
  participant handling are not reproduced.
- Only one query and one action shape are modelled. Other filters produce different mixed-conversation exposure.
- Declared KB sums synthetic message sizes. It is not a quota forecast, and no storage is reclaimed by this script.
- Timings measure an in-memory array, not Gmail’s network, DOM or extension host. They carry no performance meaning.
- This closes no external gate. Installed-package verification, live Gmail walkthroughs, competitor trials and
  post-recrawl analytics remain open.

## How to reproduce

```
node scripts/synthetic_cleanup_run.mjs --conversations 2000 --seed 20261018
```

Change the seed or the conversation count to see how sensitive each ratio is to the model, not to Gmail.
