# Cleanup contract — count, scope, snapshot and operation

**Task:** R02 (roadmap `docs/superpowers/plans/2026-10-17-inbox-cleaner-roadmap.md`).
**Status:** Investigation and contract only. No production code changed. Nothing here is a
method-signature decision; rules are stated so a test can be written against them, and the
signatures are deliberately left to R03–R09.
**Date:** 17 October 2026. Extension version under investigation: 3.2.1 (`manifest.json:4`).

## 0. How to read this document

- §1–§8 are the **contract**: normative rules. Each rule has a stable id (`C-*`) so tests and
  later tasks can cite it.
- §9 is the **divergence register**: what the current code actually does, with `file:line`,
  where it differs from the contract. This is a description of bugs, not of intended behaviour.
- §10 is the **worked example** (seeded mailbox → expected labels and confirmation total).
- §11 lists what a human must verify in a **disposable Gmail mailbox**. Anything not verifiable
  from this repository is marked `UNVERIFIED-NEEDS-LIVE-GMAIL` and is **not** asserted as fact
  anywhere in §1–§8.
- §12 is the test plan (fixtures and expected values, not written yet).
- §13 lists what this task deliberately did not decide.
- §14 records which register findings an adversarial review **confirmed** (with severity and owning
  task) and which it **refuted or partly refuted**. Refuted findings are marked in place and must not
  be re-raised as open defects.

Vocabulary used throughout:

| Term | Meaning |
|---|---|
| **message** | One mail as Gmail stores it. |
| **conversation** | A Gmail thread as the list view groups messages. The extension never reads message ids. |
| **row** | One `tr.zA` list row, i.e. one conversation as currently rendered (`content.js:46`). |
| **sender** | One normalized email address (`parsing.js:12-16`). A conversation may match more than one sender. |
| **snapshot** | The persisted result of one completed scan. |
| **scope** | The Gmail query the action runs against. |

---

## 1. The displayed unit (C-1 … C-4)

**C-1 (unit).** Every number the extension displays is a count of **conversations matched by a
Gmail query**, never a count of messages. The word "messages" must not be used for a query
result count. Rationale: every number available to this extension comes from a Gmail result
counter over a thread list (`content.js:127-141`, `content.js:223-235`) or from a list row
(`content.js:91-101`); no per-message count is observable. Whether Gmail's own counter counts
conversations or messages depends on the account's conversation-view setting —
`UNVERIFIED-NEEDS-LIVE-GMAIL` (§11.1). Until that is confirmed in a disposable mailbox, the
product labels the unit as "conversations", which is the weaker claim and stays true in both
settings.

**C-2 (label follows the weaker reading).** If a count's unit is unconfirmed (threaded vs
unthreaded view), it may still be displayed as a number, but the product must not call it
"messages" and must not call it "conversations you own"; it says
`<n> (Gmail's count for this search)`.

**C-3 (no message claims).** No receipt, dialog, badge or row may state a message count derived
from conversation evidence. Derived multiples (messages ≈ conversations × k) are forbidden.

**C-4 (storage).** No surface may state reclaimed storage. Trash is not deletion, and the
30-day auto-purge sentence (`popup.js:268`, `popup.js:270`) describes Gmail's behaviour, not a
guarantee by this product.

## 2. Entities and dedup (C-5 … C-8)

**C-5 (dedup key).** A discovered row is identified by `data-legacy-thread-id`
(`content.js:49`, `content.js:99`). Deduplication happens **globally across all categories in
one snapshot**, not per category. Two rows with the same conversation id contribute at most one
count, regardless of how many category searches returned them. `rowEl.id` is *not* a valid
fallback dedup key: it is a positional list id that repeats across pages (§9 bug 3).

**C-6 (sender attribution is not exclusive).** A conversation can be attributed to more than one
sender. The product must model this as a set (conversation → set of matched senders), never as a
single owner. Attribution used for *discovery* (which category badge a sender gets) and for
*scoping* (which conversations a sender's query matches) may differ; the contract only requires
that scoping be defined by the query, not by the row.

**C-7 (per-sender counts are not additive).** The sum of per-sender counts **may exceed** the
number of conversations any single query matches, whenever one conversation matches two or more
selected senders. Therefore:

- Any total computed by adding per-sender counts is an **upper bound on distinct conversations**,
  never "the number that will move".
- A destructive total must come from a **union query counter** (§4), not from a sum.

**C-8 (sum across disjoint sender groups — sound *only* on an unconfirmed Gmail behaviour).**
The action executes in chunks of sender addresses (`parsing.js:35-43`). If the chunk sender sets are
disjoint sets of *normalized* addresses, then a conversation matches at most one chunk (a
conversation matches chunk *i* only via a message from a sender in chunk *i*), and **the sum of the
per-chunk union counters would be exact** for the whole action — provided each per-chunk counter is
itself exact. Overlap would then be only a within-chunk problem, which Gmail's counter is assumed to
deduplicate.

> **Status: UNVERIFIED — do not treat as established.** The exactness conclusion rests on two
> unconfirmed Gmail behaviours, both `UNVERIFIED-NEEDS-LIVE-GMAIL`:
> (a) that a Gmail **result counter** and the **"select all matching" banner** cover the *same*
> conversation set — if the banner covers fewer conversations than the counter reported, the summed
> counters overstate what actually moves (§11.7); and
> (b) that an **unscoped `from:`** query and its counter include the same set that the banner acts
> on — in particular archived, Spam and Trash placement (§11.3).
> Both must be confirmed by a human in a disposable mailbox before C-8's exactness claim is usable.
> **What would falsify it:** one observed run in which the number of conversations a chunked action
> actually moved differs from the sum of that run's per-chunk counters. On that observation C-8's
> exactness fails, §10's union total is still the right number to show, and any summed chunk total
> must degrade to an approximate or `unknown` figure.

**C-8a (disjointness is a caller precondition, not a property of `buildFromQueries`).**
`buildFromQueries` (`parsing.js:35-43`) filters only on `e.includes('@')`. It does **not**
deduplicate, does **not** lowercase, and does **not** validate against the normalized address form
(`parsing.js:12-16`). An input list containing the same address twice — or containing one spelling
in two cases — puts that address into two different chunks, the same conversation is then reachable
through both chunks, and the sum of per-chunk counters exceeds the true total. Therefore:

- Disjoint, normalized chunk sender sets are a **precondition the caller must establish and test**
  before any sum is trusted. The function does not enforce it.
- Today that precondition holds only **incidentally**, because the popup keeps selection in a
  `Set` (`popup.js:7`) keyed by the normalized address. That is an accident of one caller's data
  structure, not a guarantee of the function.
- The canonical query object (C-18) is therefore responsible for carrying a deduplicated,
  normalized address list; any caller that can supply a repeated or differently-cased spelling
  invalidates C-8 and must re-derive or abort.

## 3. Count confidence (C-9 … C-15)

Four confidence levels. Every displayed count carries exactly one.

| Level | Produced by | May be shown as a bare number? |
|---|---|---|
| `exact` | Gmail's own result counter for the canonical scope returned a numeric total | Yes, with unit + scope label |
| `sampled` | Distinct conversations discovered by Phase A only | No — prefixed `≈` |
| `unknown` | The counter said `of many`, was absent, or could not be tied to the query | No — "unknown total" |
| `unverified` | Evidence exists but could not be attributed to the intended query | No — "could not be verified" |

**C-9 (sampled is a floor only under global dedup).** A `sampled` count is a **lower bound** on
the number of All-Mail conversations matching that sender's query *only if* it was produced with
global conversation dedup (C-5) and only if the row's displayed sender is a sender of a message
inside that conversation. Both preconditions are `UNVERIFIED-NEEDS-LIVE-GMAIL` (§11.2). Until
verified, `sampled` must be rendered as an estimate (`≈`) and **must not** be rendered as "at
least n" (§9 bug 6).

**C-10 (never upgrade).** A count's confidence may only be downgraded, never upgraded, by a
later operation: applying a filter, changing scope, aging, or a partial failure. In particular a
`sampled` count may not be presented as `exact` because the sender's query happened to return a
total for a *different* scope.

**C-11 (a count is exact only for its own scope).** `exact` means: "for the query recorded
alongside this count, Gmail returned this total." It does not mean exact for All Mail, exact for
the Inbox, or exact today. Any place where a count is shown must be able to name the scope.

**C-12 (hard rule — destructive totals are never rounded or summed naively).** A total shown in
a confirmation dialog or a receipt is rendered by exactly one formatter, and:

1. If any contributing count is not `exact` **for the action scope**, the total is not `exact`
   and is rendered as approximate with the reason named (`≈`, "unknown for 1 sender").
2. The total is the union-scope counter (§4). Summing per-sender counts is allowed only for a
   non-destructive list summary and must be labelled as a sum.
3. Rounding for display width (`1.2k`, `popup.js:189`) is allowed on a row chip only. A
   confirmation total is never abbreviated, and its unabbreviated value is what the receipt
   records.

**C-13 (mixed selections).** A selection with mixed confidence renders: sender count, the union
total when available, and an explicit breakdown naming only §3's four levels (e.g.
"2 exact, 1 unknown, 1 sampled"). "At least n" is forbidden because the sampled direction is
unproven (C-9).

**C-14 (zero is not evidence of absence).** A count of 0 in a non-`exact` state means "nothing
found in the scanned pages", not "this sender has no mail". A sender whose scope count becomes 0
must be re-counted, not deleted from the list.

**C-15 (unknown stays unknown).** If the counter cannot be read, the count is `unknown`. It is
never replaced by the sampled value while *labelled* as exact, and never silently dropped.

## 4. Scope: discovery vs action (C-16 … C-19)

**C-16 (two scopes, named differently).**

- **Discovery scope** = the union of five category searches `category:{primary,social,
  promotions,updates,forums}` (`content.js:19-25`, `content.js:172`). It is *Inbox-category
  coverage* only. Category badges describe discovery and describe nothing about the action.
- **Action scope** = the single canonical union query `from:(a OR b OR c …)` chunked by
  `buildFromQueries` (`parsing.js:35-43`, `content.js:344`). It is *not restricted to the Inbox
  and not restricted to the five categories*.

The extension does not currently restrict either query (there is no `in:anywhere`, `in:inbox` or
`-in:trash` operator anywhere in the repo — verified by grep). Whether an unscoped `from:` query
and its counter include archived, Spam and Trash mail is `UNVERIFIED-NEEDS-LIVE-GMAIL` (§11.3).
Until confirmed, the product must say "including archived mail" and must not say "all their mail
in your inbox".

**C-17 (per-sender counting uses the action scope, not the discovery scope).** The count shown
next to a sender must come from that sender's own `from:` query, because that is the query that
decides whether its conversations are affected. Category discovery decides *whether a sender is
listed at all*; it must never be the source of a destructive count.

**C-18 (canonical query object).** There is exactly one object that produces (a) the action
query, (b) the count query, (c) the preview, and (d) the confirmation numbers. It records:
account key, normalized sender addresses, chunk size, scope operators, and the protection
policy. Both preview and action must be rendered from this object; no second query builder may
exist (§9 bug 8).

**C-19 (union total for the action — exact only under C-8's unverified precondition).** Before a
destructive confirmation, the product reads the union counter for each chunk from Gmail itself.
**If** the chunk sender sets are disjoint and normalized (C-8a — a caller duty, satisfied today only
incidentally by the popup's `Set`) **and** each chunk counter is exact, the sum of per-chunk counters
is the exact action total. **This exactness is conditional and unverified**: it additionally depends
on the Gmail behaviours in §11.3 and §11.7 that C-8 flags. Until a human confirms them in a
disposable mailbox, the summed chunk total must not be presented as settled fact — it may be used
only with its uncertainty stated, and any divergence between a summed total and an observed move
count demotes it (`C-10`).

Subject to that same condition, this is what makes a "of many" individual sender (§10) harmless to
the destructive total: the union total is one number.

## 5. Snapshot identity and invalidation (C-20 … C-24)

**C-20 (snapshot binding).** A snapshot is bound to: `accountKey` (a stable per-account
identifier, not `/u/0` — R03), the Gmail tab it was taken in, `scannedAt`, the discovery scope,
the unit (C-1), and the per-count scopes. A snapshot missing any of these is **unbound**.

**C-21 (legacy unbound cache).** A snapshot persisted without an account key (all data written
by 3.2.1, `content.js:287-289`; single global key `inboxCleanerData`, `popup.js:67`) is shown
read-only, clearly labelled "from an earlier version, account not verified", and **all mutation
paths are disabled**. It is never migrated into an actionable state by guessing. Deleting it is
offered, not assumed.

**C-22 (what invalidates a snapshot).** Any of: account key differs from the active Gmail tab;
snapshot age exceeds the agreed maximum; Gmail navigation or a Gmail-side change since
`scannedAt`; the discovery scope or policy changed; the count for any contributing sender
changed when re-read. After invalidation the product must present a route back to a fresh scan
and must not offer a confirm button.

**C-23 (revalidation at the mutation boundary).** The confirmation review is bound to the
canonical object (C-18) and its account key. Confirming re-reads the account key and, if it
differs from the review, the review is discarded and the user returns to review. A review whose
union total has since changed requires a new review — the dialog is not silently re-labelled.

**C-24 (preserve the last complete snapshot).** A failed or interrupted run must not overwrite a
previous complete snapshot, and a partial run must be distinguishable from a complete one
(`content.js:304-307` sets `status:'error'` while keeping the previous cache only because
`chrome.storage.local.set` is never reached — that is incidental, not designed).

## 6. Attempted vs verified vs unknown outcomes (C-25 … C-28)

**C-25 (three outcome classes).** Every unit of work in an operation is exactly one of:

- `attempted` — the product issued the Gmail interaction; no post-state evidence gathered.
- `verified` — post-state evidence from Gmail shows the intended effect for that unit.
- `unknown` — the product cannot distinguish success from failure.

`failed` is a fourth class meaning evidence shows the intended effect did **not** occur.

**C-26 (no unconditional success).** An operation may only be reported as complete if every unit
is `verified`. Any `unknown` unit makes the operation `partial`, and the receipt must say so.
Today the product reports unconditional success after a fixed sleep
(`content.js:338` → `content.js:362` → `popup.js:319`, "Deletion complete ✓") with no evidence
at all — §9 bug 1.

**C-27 (verify per chunk, not per run).** Verification granularity is the chunk, because the
chunk is the unit the product can re-query. A verified chunk means: re-running the chunk's union
query no longer returns the affected conversations in the expected scope, or Gmail's post-action
counter is consistent with the removal. A chunk whose re-query fails, times out, or returns an
unrelated view is `unknown`.

**C-28 (retries never assume failure).** Re-running an operation whose state is `unknown` is not
a retry of a failed action. The product must state that the previous attempt's outcome is
unknown and must not report a second run's counts as the total removed.

## 7. Preview / action parity (C-29 … C-31)

**C-29 (one policy, one query).** Preview and action consume the same canonical object (C-18).
A preview that cannot be produced from that object is not shown.

**C-30 (no mutation during discovery or preview).** Scan and preview are read-only. They navigate
Gmail and read counters; they never click `Delete`/`Archive`. Navigation is not mutation, but
changing `location.hash` during preview means the popup must re-verify account state afterwards
(R03).

**C-31 (review must state).** The final review states: verified account address, the selected
sender addresses (full, not display names), the action, the scope and its exclusions, the
unit, the confidence breakdown, archived-mail inclusion, and the total with its confidence. A
review missing any item cannot be confirmed.

## 8. Safety invariants (C-32 … C-34)

**C-32.** No permanent delete. The only mutations in committed scope are Move to Trash and, later,
Archive. No path may ever click a permanently-delete or "empty trash" control.

**C-33.** Filtering is never called unsubscribe. No automatic unsubscribe request is in core scope
(R20).

**C-34.** No preselected senders. Every destructive operation starts from an empty selection and
an explicit user confirmation bound to a snapshot.

---

## 9. Divergence register — what the code does today

Each item is a real defect against §1–§8, with the current line and the scenario that breaks a
naive implementation.

**Bug 1 — unconditional success with zero verification.** `content.js:338` sleeps 1 s after
clicking Trash and `content.js:362` sets `status:'done'`; `popup.js:319` toasts
"Deletion complete ✓". If Gmail's toolbar never rendered (`content.js:327` `waitForElement`
throws), or the "select all matching" banner was absent, or the user changed tabs mid-flight, the
product still claims success. Violates C-25/C-26.

**Bug 2 — silent under-delete when "select all matching" is missing.** `content.js:333`
(`waitForElement(SELECTORS.selectAllMatchingLink, 5000).catch(() => null)`) swallows the timeout
and `content.js:334` only clicks the banner if present. Gmail's page checkbox
(`content.js:330-331`) selects only the ~100 visible rows on the current page. A markup change, a
locale change (`popup`/`content.js:52-62` are English-UI-only) or a slow render therefore trashes
a fraction of the intended set and still reports success. This is the single worst failure mode:
a *smaller* mutation than promised, presented as the promised one.

**Bug 3 — positional `rowEl.id` fallback used as a dedup key (`PARTLY REFUTED — mechanism
unverified, open question, not a confirmed defect`).** `content.js:99` falls back to
`rowEl.id` when `data-legacy-thread-id` is missing, and `dedupeRowsByThreadId` (`parsing.js:24-33`)
uses that value as the dedup key. The *review's original claim* was that `rowEl.id` is a positional
list id (`p0`, `p1`, …) that repeats across pages, so page 2+ rows collapse into page 1's
conversations. **That mechanism was asserted, not verified.** Whether `tr.zA` rows actually carry
positional ids in supported Gmail versions is an **open question**, not a finding: `data-legacy-
thread-id` may in practice always be present, in which case the fallback never fires and no
corruption occurs. The defensive consequence is still real and is a contract requirement, not a bug
report: `waitForPageChange` (`content.js:154-158`) compares the same ids, so if a repeat ever *is*
observed it reads as "the page did not change" → `content.js:212` throws "Scan incomplete".
Resolution: verify in a disposable mailbox whether the fallback is ever reached (`UNVERIFIED-NEEDS-
LIVE-GMAIL`, new §11.9); the contract requirement in C-5 — `rowEl.id` is not a valid fallback dedup
key — stands regardless. Owner: R04.

**Bug 4 — cross-category double counting makes "≈" not a floor.** Dedupe is per category
(`content.js:215`), and `mergeCategoryResults` adds rows per category (`parsing.js:46-56`).
A conversation containing both a Primary and a Social message is returned by both
`category:primary` and `category:social`, and is counted twice for whichever sender it is
attributed to. `entry.categories` dedupes the *labels* (`parsing.js:55`) but not the *count*.
Consequence: the sampled count can **exceed** the true conversation count, so the dialog's
"at least n emails" (`popup.js:269`) is unsound in both directions. Violates C-5/C-9/C-13.

**Bug 5 — a query that never landed still yields an "exact" count.** `content.js:226`
(`waitForSearchQuery(query).catch(() => {})`) discards the failure, then `content.js:230-231`
reads whatever counter is on screen. If Gmail is slow to apply the previous hash, the counter
still belongs to the *previous* sender's query and is recorded as that sender's exact total
(`content.js:276`). Nothing cross-checks that `range.end >= 1` belongs to the current query.
Violates C-11/C-15.

**Bug 6 — "at least" and "emails" are both wrong.** `popup.js:269` says "at least n emails" for
inexact selections; per Bug 4 the sample is not a floor, and per C-1 the unit is not messages.
`popup.js:268` prints "n emails, counted across All Mail including archived" for exact selections
— the scope claim ("All Mail") is an assumption about unscoped `from:` semantics
(§11.3), and the total still double counts multi-sender conversations (Bug 7).

**Bug 7 — every total in the UI is a per-sender sum.** `content.js:284` (header total),
`content.js:358` (post-delete total), `popup.js:110-112` (header "n emails"), `popup.js:221-222`
(action bar "n emails"), `popup.js:259` (confirmation) all sum per-sender counts. With two
selected senders sharing one conversation, every one of those numbers overstates the distinct
conversations affected, and the header/action-bar numbers carry **no** confidence qualifier at
all even though `exactCount` is available in the cache (`content.js:288`, `popup.js:103`).
Violates C-7/C-12.

**Bug 8 — counting and acting are two independent query builders.** Counting uses
`buildSenderQuery` (`parsing.js:95-97`, one address); acting uses `buildFromQueries`
(`parsing.js:35-43`, OR-chunks of 20). Nothing enforces that the per-sender count and the action
query cover the same scope, and nothing re-counts at confirm time. Violates C-17/C-18/C-29.

**Bug 9 — category badges imply a scope they do not have.** Badges come from the five discovery
queries (`popup.js:172-174`, `content.js:262`). A sender badged `SOCIAL` whose archived mail
matches the unscoped action query is about to have that archived mail moved. The disclosure only
appears in the inexact branch of the dialog (`popup.js:270`). Violates C-16/C-31.

**Bug 10 — long tail is estimated without saying so at the aggregate level.**
`content.js:38` (`MAX_SENDERS_TO_COUNT = 250`) keeps the sampled count for every sender past the
250th, and `parsing.js:103-116` marks it `exact:false`. The row chip shows `~`
(`popup.js:189`), which is honest, but `exactCount` (`content.js:285`) is only surfaced in a
transient toast (`popup.js:298-300`) and never in the list, the action bar or the confirmation —
which print a bare unqualified total (Bug 7). Violates C-12/C-31.

**Bug 11 — RETRACTED (was: "truncated display value for a destructive number").** The original
entry claimed `popup.js:189` (`1.2k`) and `popup.js:259` (`1,247`) were "two different numbers for
one entity on one screen" and violated C-12. **Refuted:** these are the *same* value, `1,247`
displayed in the row chip's abbreviated form per C-12 rule 3, which explicitly *permits* `k`-style
abbreviation on a row chip and forbids it only on a confirmation total. There is no disagreement and
no C-12 violation. Nothing to fix; the row-chip abbreviation may stay.

**Bug 12 — an estimated counter aborts the whole scan.** `hasMorePages` returns `true`
unconditionally for `estimated` (`parsing.js:91`), so `content.js:203` never breaks on
"of many"; the scan then depends entirely on the Older button, and `content.js:206` throws
"Scan incomplete" when it is absent. One huge category loses the entire snapshot rather than
recording a partial one. Violates C-24 (a partial run must be distinguishable and must not be
lost).

**Bug 13 — stale counts silently persist after the action.** `content.js:354-360` removes the
deleted senders and recomputes a total from the *remaining* counts, which were measured before
the action. New mail, threads unarchived by other devices, or a partial failure are invisible.
Violates C-22/C-28.

**Bug 14 — no account identity anywhere.** The cache key is a single global
`inboxCleanerData` (`content.js:288`, `popup.js:67`); `findGmailTabId` picks the active or first
Gmail tab (`popup.js:44-49`); `scanState` is a module-global in whichever tab responded
(`content.js:237-248`, `content.js:294-298`). Account A's counts can be displayed while account
B is the active tab, and `confirmDelete` (`popup.js:274-286`) revalidates nothing. R03 owns the
fix; the contract consequence is C-20/C-21/C-22.

**Bug 15 — selection is destroyed on failure.** `popup.js:277` clears `selected` before the
request; if `resp.ok === false` (`popup.js:282`) the user is returned to the main screen with an
empty selection and no record of what they had chosen. Violates C-34 (user must be able to
re-derive an explicit decision).

**Bug 16 — no error-path state integrity.** `content.js:305` replaces `scanState` with an object
lacking `phase`/`done`, while `updateProgress` (`popup.js:245-247`) reads both; and the error is
broadcast twice (`content.js:306` plus the `catch` in `popup.js:302`). Cosmetic today, but it
means "was the scan complete?" is not recoverable from state — which C-24 requires.

---

## 10. Worked example (seeded disposable mailbox)

**Fixture.** One Gmail account, conversation view at its default setting, no filters. Seed:

| Conversation | Senders | Location | Category search hit |
|---|---|---|---|
| `c1` | `news@shop.example` (A) **and** `billing@corp.example` (B) | Inbox | `category:promotions` (A badge), `category:updates` (B badge) |
| `c2` | A | Inbox | promotions |
| `c3` | B | Inbox | updates |
| `c4` | B | Inbox | updates |
| `c5` | `social@net.example` (C) | Inbox | social — counter for `from:(C)` returns `1–100 of many` |
| `c6` | `news@shop.example` (A) | **Archived, not in Inbox** | none — never discovered |
| `c7` | `digest@blog.example` (D) | Inbox | forums — sender ranks 4th, so outside the top-250 counting budget |

**Expected Phase A (discovery) result under the contract:**

- Distinct conversations discovered: `c1,c2,c3,c4,c5,c7` = 6 (`c6` is invisible to category
  discovery — this is expected, not a bug, and the product must not imply otherwise).
- Senders listed: A, B, C, D. A and B each carry two badges (`PROMOTIONS`+`UPDATES`), and the
  badge is labelled "found in", never "in".
- `c1` contributes **one** conversation to the snapshot, attributed to the set {A, B}.
  Summing per-sender sampled counts here gives 7 — one more than 6. This is Bug 4 made
  observable and is the test that proves global dedup.

**Expected Phase B (per-sender counts) under the contract:**

| Sender | Query | Gmail counter (fixture) | Level | Rendered row |
|---|---|---|---|---|
| A | `from:(news@shop.example)` | `1–100 of 3` | `exact` | `3 conversations` + `All Mail` |
| B | `from:(billing@corp.example)` | `1–100 of 3` | `exact` | `3 conversations` + `All Mail` |
| C | `from:(social@net.example)` | `1–100 of many` | `unknown` | `total unknown (Gmail reports "of many")`, sampled `≈1` shown separately as a floor, **not** as the count |
| D | `from:(digest@blog.example)` | not requested (outside budget) | `sampled` | `≈1` + `sampled from Inbox categories only` |

Note that A's exact 3 counts `c6`, the archived conversation that discovery never saw — so the
fixture's counter values already *assume* that an unscoped `from:` includes archived mail. That
assumption is §11.3's open question and is not established. The row must therefore say the scope
may include archived mail (C-16/C-31), otherwise the user learns at confirmation that 3 was not what
the badge implied.

**Expected selection and confirmation, selecting A+B+C+D:**

- **Per-sender sum = 8**, not 9. Computed from the fixture, from first principles:
  `A = 3` (c1, c2, c6) `+ B = 3` (c1, c3, c4) `+ C = 1` (c5) `+ D = 1` (c7) `= 3+3+1+1 = 8`.
  C's contribution is *not displayed* as a count — its counter reads "of many", so its level is
  `unknown` — but the conversation c5 is inside the union set, so substituting its true value 1
  gives 8. The sum exceeds the union total by exactly 1 because `c1` is counted under both A and B
  (C-7). `8` is therefore an **upper bound on distinct conversations**, never "the number that will
  move", and it is not an acceptable total.
- Canonical union query, chunk 1 (`from:(news@shop.example OR billing@corp.example OR
  social@net.example OR digest@blog.example)`), counter returns `1–100 of 7` → `exact`, because the
  union query deduplicates `c1` to a single match: `c1, c2, c3, c4, c5, c6, c7` = 7 distinct
  conversations.
- With >20 senders the chunks are disjoint **only if the caller supplies deduplicated, normalized
  addresses** (C-8a). Even then, summing per-chunk counters is exact **only under C-8's unverified
  Gmail precondition** (§11.3, §11.7) and must be labelled as such until a human confirms it.
- Confirmation text must be equivalent to:
  **"Move mail from 4 senders to Trash — 7 conversations, Gmail's count for this search in
  your account. This search may include archived mail (unverified — §11.3), so the affected set may
  be larger than what appears in your Inbox. Gmail removes Trash contents after 30 days."** Plus
  the archived caveat and the policy line. The number of archived conversations affected is **not
  stated**: subtracting the discovery count (6) from the union count (7) to obtain "1 archived
  conversation" is only valid if an unscoped `from:` equals Inbox ∪ archived exactly, which is §11.3's
  open question and is unverified.
- Explicitly **forbidden** outputs: `8 emails` (the per-sender sum), `at least 8 emails`,
  `8 messages`, `storage freed`, and any statement that C's count is included as a known number (it
  is `unknown`; the union total already covers C's conversations, and that is why it is safe to act).
  `9` is not derivable from this fixture at all and must not appear.
- If the union counter had returned `of many`, the total renders as `unknown — Gmail reports
  "of many"` with the `≈` sampled figure beside it, and the confirm button remains available
  because the *scope* is unambiguous even when the *number* is not. Scope certainty and number
  certainty are independent (C-12).

**Expected post-action receipt (contract, C-25–C-27):** one chunk, `attempted` at click time,
then re-query the chunk's union query. If `c1…c7` no longer return in scope → `verified`, receipt
says "Moved 7 conversations to Trash". If the re-query cannot be trusted → `unknown`, receipt says
so and points to Trash. Never "Deletion complete ✓" unconditionally.

---

## 11. Open questions for a human with a disposable Gmail mailbox

Each item states exactly what to do and what it unblocks. None of these can be answered from the
repository.

**11.1 — Unit of Gmail's counter (`UNVERIFIED-NEEDS-LIVE-GMAIL`).** With conversation view ON
(default) and OFF, seed 3 conversations where one sender has sent 5 messages spread across 3
threads. Record what the result counter reads for `from:(sender)` in each mode. Confirms or
refutes C-1 and decides whether the word "conversations" is always safe.

**11.2 — Is the displayed row sender always a sender inside that conversation (`C-9`)?** Seed a
thread where A starts and B replies last; record the row's `email`/`name` attributes. Also seed a
mailing-list thread and a BCC/DMARC-rewritten thread. Decides whether a global dedup can produce a
true lower bound, and therefore whether "at least n" is ever permissible.

**11.3 — Scope of an unscoped `from:` query (`C-16`).** Seed one conversation in Inbox, one
archived-only, one in Spam, one already in Trash. Record (a) the counter for `from:(sender)` and
(b) what "select all matching" actually selects and moves, per conversation. Decides whether the
product must add explicit scope operators (e.g. `in:anywhere`, `-in:trash`) and whether
`content.js:268`'s "All Mail" wording is true.

**11.4 — Does `from:` match a conversation via *any* message (`C-6`)?** Seed a conversation where
the sender appears only in the middle. Determines whether per-sender counts and row attribution
can disagree, and how often.

**11.5 — Cross-category duplication (`Bug 4`).** Seed one conversation containing both a Primary
and a Social message. Confirm whether it appears in both `category:primary` and
`category:social`, and with which sender attributed. Decides whether the sampled estimate can
exceed the true count, and therefore the correct estimate direction.

**11.6 — Is "of many" ever numeric? (`C-11`)** Find the threshold (or a setting) at which Gmail
replaces the total with "of many", and whether it applies to `in:anywhere`-style searches. Decides
whether `unknown` is a rare or common state.

**11.7 — "Select all matching" behaviour (`Bug 2`).** With >100 results, click the page checkbox
and inspect the banner text: does it select all matching conversations across pages, and does the
confirmation dialog say conversations or messages? Also determine the failure appearance when the
banner is missing, so the product can detect it rather than silently under-deleting.

**11.8 — Trash/verification evidence (`C-27`).** Determine a cheap, reliable re-query that proves
a chunk moved: whether `label:inbox`, `in:anywhere`, or the counter delta is stable immediately
after the action, and whether trashing a conversation that is partly archived changes scope
unexpectedly.

**11.9 — Is the positional-id dedup fallback ever reached? (`Bug 3`, refuted-as-reported).**
Inspect a `tr.zA` row in the inbox and in a category search and record whether
`data-legacy-thread-id` is ever absent. If it is always present, the `rowEl.id` fallback at
`content.js:99` never fires and the dedup-corruption mechanism is unreachable; if it is sometimes
absent, record what `rowEl.id` actually contains (`p0`, `p1`, … or something stable). Decides
whether Bug 3 is a real defect or a defensive requirement.

---

## 12. Test plan (not yet written)

No tests are written by this task. The plan below is what R03/R04 would implement, mapped to the
files that must change. Rules in brackets are the assertions' justification; every destructive
case needs a fixture whose expected value comes from a disposable mailbox observation
(§11), never from this repository.

**Fixtures.** `test/fixtures/mailbox/` — a seeded-mailbox JSON model used by both Node tests and
the human verification run:
`{ conversations: [{ id, senders[], location: inbox|archived|spam|trash, category, messageCount }],
counters: { query → "1–100 of N" | "1–100 of many" | null }, policy: {...} }`.
Seeded set = the §10 mailbox (`c1`…`c7`), plus a `c8` conversation with 5 messages from one
sender (11.1) and a `c9` conversation matching two senders only in a middle message (11.4).

### `test/parsing.test.js` — extend (pure, no DOM)

1. `dedupeRowsByThreadId` / a cross-category dedup function: the §10 `c1` row appearing in both
   the PRIMARY and the UPDATES result set yields **one** snapshot entry, and per-sender sampled
   totals sum to 6, not 7. [C-5, Bug 4]
2. Rows with no conversation id are **kept and marked unverified**, not silently dropped — the
   current `parsing.js:28` `continue` must not silently shrink the set. [C-5]
3. A positional id (`p0`, `p1`) supplied as the id is rejected as a dedup key — asserted as a
   contract requirement (C-5), independent of whether the `content.js:99` fallback is ever reached
   (see Bug 3's open question and §11.9). [C-5, Bug 3]
4. Confidence derivation: `{count:3, counter:'1–100 of 3'}` → `exact`; `{counter:'of many'}` →
   `unknown` with the sampled value preserved separately and *not* substituted; `{no counter}` →
   `unknown`, never `exact`. [C-9, C-15]
5. Confidence never upgrades: applying a policy/scope change to an `exact` count yields
   `sampled`/`unverified`, not `exact`. [C-10]
6. Disjointness is a caller precondition, not a property of `buildFromQueries`: a repeated or
   differently-cased address in the caller's list lands in two chunks and must be rejected or
   deduplicated before any sum is trusted. Given deduplicated normalized chunks, a conversation
   matching two senders inside one chunk is counted once by the chunk counter; the per-sender sum is
   returned separately and labelled as a sum. Assert the sum as **exact only under a fixture that
   documents the §11.3/§11.7 precondition as satisfied** — until then assert it is labelled, not
   claimed. [C-7, C-8, C-8a, C-19]
7. The single total formatter: `exact` union → `7 conversations`; any unknown contributor →
   `unknown — Gmail reports "of many"` with `≈` beside it; never `at least n`; never `n emails`;
   never `n messages`; never an abbreviated `k` form. [C-1, C-12, C-13]
8. An `estimated` counter makes `hasMorePages` **degrade to partial**, not loop forever and not
   throw away the whole snapshot. [C-24, Bug 12]
9. Query builders: one canonical builder emits the action chunk, the per-sender count query and
   the preview query for the same policy object; a chunk boundary split never separates two
   spellings of the same address (normalization lowercases at `parsing.js:13`). [C-17, C-18]

### `test/content.test.js` — extend (extend the existing `vm` harness at `test/content.test.js:9`)

10. `countSenderExactly` returns `unknown` — not the previous sender's number — when the search
    box never reflects the query (today: swallowed at `content.js:226`). Assert the counter read
    is never attributed to a query that did not load. [C-11, C-15, Bug 5]
11. A scan that stops at `of many` produces a **partial** snapshot marked partial, with the last
    complete snapshot untouched on disk. [C-24, Bug 12]
12. A scan interrupted mid-category leaves the previous snapshot readable and is distinguishable
    from a complete scan in `GET_SCAN_STATE`. [C-24, Bug 16]
13. A snapshot is written with `accountKey`, `tabId`, `scannedAt`, `unit`, and per-count scope;
    a legacy payload without them round-trips as `unbound` and is rejected by the action path.
    [C-20, C-21]
14. `selectAllMatchingAndTrash` **fails loudly** when the "select all matching" banner is absent
    instead of trashing the visible page and reporting success. [C-25, C-26, Bug 2]
15. Chunk verification: after a simulated Gmail action, a chunk whose re-query returns the
    conversations is `unknown`, never `done`; a chunk whose re-query is clean is `verified`.
    [C-25, C-27]
16. Two concurrent `START_SCAN`/`DELETE` messages: the second is rejected and no second Gmail
    mutation is issued. [C-25, C-28]

### `test/popup.test.js` — new

The file must export the pure parts (formatter, selection reducer, view-model builder,
confirmation-text builder) so they can be tested without a browser; `popup.js` is currently
top-level DOM code with no exports and would need that seam first (a test-shaped change, not a
contract change).

17. View model for the §10 mailbox renders exactly: `3 conversations · All Mail` (A),
    `3 conversations · All Mail` (B), `total unknown — Gmail reports "of many"` + `≈1` (C),
    `≈1 · sampled from Inbox categories only` (D); A shows both badges and the archived-inclusion
    note. [C-11, C-16, C-31, Bug 9]
18. Action bar with all four selected: sender count 4, **union total 7**, confidence breakdown
    `2 exact, 1 unknown, 1 sampled` (§3's levels, matching §10: A/B exact, C unknown, D sampled),
    and no unqualified "n emails". [C-12, C-13, Bug 7]
19. Confirmation text contains "7 conversations" and names the account; it states that the search
    may include archived mail and contains none of: the per-sender sum `8`, `at least`, `messages`,
    `storage freed`, `unsubscribe`, or an exact archived-conversation count. [C-3, C-4, C-12, C-33]
20. Selection with a single unknown contributor still permits confirmation but renders an
    `unknown` total (scope certainty is independent of number certainty). [C-12]
21. Switching Gmail tabs/account between scan and confirm invalidates the review and disables the
    confirm button until a fresh scan. [C-20, C-22, C-23]
22. Legacy unbound snapshot: list renders read-only with the "account not verified" label and the
    action bar never appears. [C-21, Bug 14]
23. A failed `DELETE` response keeps the selection intact. [C-34, Bug 15]
24. The **confirmation** total is never abbreviated and is the value the receipt records; a row
    chip for the same sender may use the `k` form C-12 rule 3 permits, and both must round-trip to
    the same number. (The original "row chip vs confirmation disagree" framing was refuted — see
    Bug 11.) [C-12]
25. Hostile display name (`<img onerror=…>`) renders as text in row, review and receipt.
    [C-31]

### Milestone gate

`node --test test/parsing.test.js test/content.test.js test/popup.test.js` plus a live disposable
mailbox run of the §10 fixture, recording observed counters against §10's expected values. Any
divergence is a spec amendment, not a test edit.

---

## 13. Deliberately not decided here

- **Method signatures, class shapes, storage schema, message types.** The roadmap forbids locking
  these before the entity is resolved (R02 "Done when"), and R03–R09 own the interfaces. Rules
  above are stated so any interface satisfying them passes.
- **Whether per-sender rows should show the union-aware count.** Depends on 11.4 and on cost;
  the contract only requires the *destructive* total to be union-derived (C-19).
- **The exact wording of labels.** Owned by R04/R11 copy; §10 gives semantic requirements
  ("must be equivalent to"), not final strings.
- **Max snapshot age, MAX_SENDERS_TO_COUNT value, chunk size.** Policy constants, not contracts.
  Changing them cannot make an inexact count exact (C-10), which is why they are left open.
- **Archive and protection policies.** Milestone 3 (R15–R17). C-18 requires one canonical policy
  object but this task does not define its fields.
- **Undo/recovery entity identity.** R18's decision gate, not R02's.
- **Storage/quota insight.** R23; C-4 forbids the false claim now but no reporting is specified.

---

## 14. Review outcome — confirmed defects, and findings the review refuted

An adversarial review of this document and of the register in §9 was performed on 17 October 2026.
This section is the disposition record. **No production code was changed by this task**; every
confirmed defect below is owned by a later roadmap task, which must fix it there, not here.

### 14.1 Confirmed by the review — being fixed separately

| # | Confirmed defect | Severity | Why it is that severity | Owning task |
|---|---|---|---|---|
| 1 | **Partial mutation when the "select all matching" banner is absent** (Bug 2). `content.js:333` swallows the 5 s timeout and `content.js:334` clicks only if present, so the page checkbox's ~100 visible rows are trashed and the run still reports success (`content.js:362`, `popup.js:319`). | **Critical** | A *smaller* mutation than promised, presented as the promised one. Silent under-delete of destructive scope is the worst failure mode in the product. | **R07** (fails loudly / partial outcome), with the receipt wording in R09 |
| 2 | **Swallowed search-query wait reads a stale counter** (Bug 5). `content.js:226` discards the `waitForSearchQuery` failure, then `content.js:230-231` reads whatever counter is on screen and `content.js:276` records it as that sender's exact total — which may belong to the previous sender's query. | **High** | A wrong `exact` count is the most damaging failure mode for trust: it is displayed without qualification and it can be *lower* than the true count, understating a destructive total. Violates C-11/C-15. | **R04** |
| 3 | **No busy guard on `DELETE`.** `confirmDelete` (`popup.js:274-286`) revalidates nothing (Bug 14) and nothing rejects a second submission while a run is in flight, so two popups or a double click can issue two Gmail mutations for one user decision. | **High** | Duplicate destructive submission. The review condition "popup close/reopen, Gmail navigation or another run during mutation" is explicitly gated on one operation owner and no duplicate submission. | **R06** |
| 4 | **Per-sender sums mix All Mail exact counts with Inbox-category samples** (Bugs 7 + 10). `content.js:284`, `content.js:358`, `popup.js:110-112`, `popup.js:221-222` and `popup.js:259` all sum per-sender counts where the top-250 senders hold an All Mail `exact` counter (or `unknown`) and every sender past 250 holds an Inbox-category `sampled` count — two different scopes in one unqualified total, with no confidence qualifier at all. | **High** | The number a user is asked to approve is not a count of anything coherent. Violates C-7/C-11/C-12. | **R04** |
| 5 | **Cross-category double counting** (Bug 4). Dedupe is per category (`content.js:215`) and `mergeCategoryResults` (`parsing.js:46-56`) adds rows per category, so one conversation with a Primary *and* a Social message is counted twice, making the `sampled` figure able to *exceed* the true count — unsound as a floor in both directions. | **High** | Breaks the only lower-bound claim the sampled level makes (C-9/C-13), and feeds defect 4's total. | **R04** (global dedup in `parsing.js` per C-5) |
| 6 | **An `of many` counter aborts the whole scan** (Bug 12). `hasMorePages` returns `true` unconditionally for `estimated` (`parsing.js:91`), so `content.js:203` never breaks and the run depends entirely on the Older button; `content.js:206` then throws "Scan incomplete" when it is absent, losing the entire snapshot instead of a partial one. | **Medium** | One large category destroys an otherwise complete scan. Violates C-24, but is non-destructive and loud (it errors rather than lying). | **R07** (partial scan must be distinguishable and preserved) |

Severity here is judged against the roadmap's own safety constraints, not against a general
criticality scale. No other register entry is confirmed by the review; entries not listed in §14.1 or
§14.2 keep their original §9 status.

### 14.2 Findings the review did NOT sustain — do not re-raise

- **Bug 3, positional-id dedup — PARTLY REFUTED.** The review verified the register and found the
  *mechanism was asserted rather than verified*: nothing in the repository or in the code
  establishes that `tr.zA` rows carry repeating positional ids in the first place. `content.js:99`'s
  fallback only fires when `data-legacy-thread-id` is missing, and whether that ever happens is
  **an open question**, now §11.9. Bug 3 is therefore re-labelled in §9 as a defensive requirement
  under C-5 plus an open question, **not a confirmed defect**, and its owning task (R04) is to
  verify §11.9 rather than to chase a bug that may be unreachable. It must not be reported as a
  user-visible count corruption until §11.9 returns evidence.
- **Bug 11, `1.2k` vs `1,247` — REFUTED.** These are the same value. Row-chip `k` abbreviation is
  *explicitly permitted* by the contract's own formatting rule (C-12 rule 3: rounding "is allowed on
  a row chip only"; a confirmation total is never abbreviated). There is no contradiction and no
  violation. Bug 11 is retracted in §9 and test 24 in §12 was reframed to assert the rule that
  actually exists (confirmation unabbreviated, row chip may abbreviate, both round-trip equal). The
  `1.2k` rendering may stay as it is.