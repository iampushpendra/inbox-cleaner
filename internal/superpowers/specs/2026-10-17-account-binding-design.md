# Account binding design — R03

> **Status:** design only. No runtime file was modified. `manifest.json`, `popup.js`, `content.js`
> and `parsing.js` are unchanged; no tests are written; nothing is committed or pushed.
>
> **Depends on:** [2026-10-17-cleanup-contract.md](./2026-10-17-cleanup-contract.md) (R02). This
> document implements C-20, C-21, C-22, C-23 and C-30, and closes the contract's `Bug 14` with a
> concrete mechanism. Where R02 leaves the account key abstract ("`accountKey` … not `/u/0` —
> R03"), §3–§4 of this document decides it.
>
> **Evidence status:** every DOM fact about Gmail is `UNVERIFIED-NEEDS-LIVE-GMAIL`. See §13. Nothing
> in this document was checked against a live mailbox; no model can certify it.

---

## 1. What R03 must make true

1. Every number the popup shows names the Gmail account it came from.
2. A destructive action can only be issued against a mailbox whose address has been read from that
   mailbox's own live DOM **in the tab that will perform the action**, moments before the action.
3. If the address cannot be read, or read differently than the reviewed scan, the product is
   **view-only** and there is no code path — not a flag, not a query parameter, not an error path
   that still clicks — that mutates mail.
4. Every blocked state offers one specific, obvious route back to an actionable scan.

Current code violates (2) and (3) in four places: the global cache key (`content.js:288`,
`popup.js:67`), `findGmailTabId()` picking "active or first" (`popup.js:44-49`), the module-global
`scanState` in whichever tab answers first (`content.js:237-248`), and `confirmDelete()`
revalidating nothing (`popup.js:274-286`).

---

## 2. Vocabulary and binding shapes

These are **shapes, not signatures** (roadmap: do not lock premature method signatures). Field
names follow R02 where it already fixed one (`accountKey`, `tabId`, `scannedAt`, `pageInstanceId`
is new here).

```
Identity            { accountKey, uIndex, source, observedAt, documentId }
                     accountKey  — normalized (trimmed, lowercased) address of the Gmail
                                   account the page is currently showing
                     uIndex      — the /u/N segment, carried for change detection ONLY (§3)
                     source      — which probe produced it, for display and debugging
                     documentId  — per-document-instance id minted by the content script at load

ScanBinding         { accountKey, documentId, tabId, scannedAt, discoveryScope, unit,
                     perCountScope, snapshot: 'complete'|'partial', viewOnly: boolean,
                     reason?: string }
```

`documentId` is generated once per content-script load (crypto-random hex). It exists because
`/u/N` and the DOM can both be re-rendered in place, and because a content script's in-memory
`scanState`/`deleteState` globals outlive any single page (`Bug 14`) — a mutation run started in
document 1 must be known to be dead once the document is replaced.

Storage layout: **one** key holds all accounts, so a scan write is a single atomic
`chrome.storage.local.set` and there is no cross-key partial-write window.

```
inboxCleanerData = {
  version: 2,
  accounts: { [accountKey]: ScanBinding, ... },
  legacyUnbound: ScanBinding | null      // §9
}
```

Keeping one container rather than `inboxCleanerData:<accountKey>` is deliberate: the mailbox list
is small, one write is atomic, and "which accounts have I ever scanned?" needs a single read.

---

## 3. Candidate identity sources

| Candidate | How it is obtained | Stability | Cost | How it fails |
|---|---|---|---|---|
| **`/u/N` path segment** | `location.pathname` regex, e.g. `/mail/u/1/` | **Not stable.** N is a position in the profile's account list. It is stable *only* for the lifetime of one browser profile's account list. Adding a second account, removing one, reordering, or adding an alias renumbers it. Across sessions/profiles the same person gets different N. | Zero (already in the URL) | Silently binds the cache of account A to what is now account B. This is exactly the failure R02 forbids. **Also unreadable in the default single-account case if the user is on the bare `/mail/u/0/` — actually present, but it carries no information.** |
| **Account email in rendered DOM (avatar / account button)** | Read `aria-label`, `title` and `alt` of the top-right account control and extract an address with an email regex — *not* by matching the words around it | Best available. Gmail renders the signed-in address on essentially every authenticated view, and an email is language-independent, so a localized UI still matches. Cost is one `querySelector` + regex. | One fragile selector set; zero new permissions | Fails closed if the control's markup or attribute set changes (then: unknown → view-only, §10). Attribute-name change is a shipping blocker until updated — see §12 false negatives. |
| **Account email in the account switcher menu** | Open the account menu, read each row's label | Same data, worse attribution | Requires *clicking* to open a menu during an identity read — an interaction in a read path, and the menu lists **all** accounts, so the "which one is active" question returns | Cannot distinguish active from inactive rows without a state attribute that must itself be verified. Demoted to last-resort probe; if used, its result counts as *unverified* until §13 item 2 is answered. |
| **Sign-out URL (`accounts.google.com/Logout?...u/N`)** | Read the anchor `href` | Contains only the index | Zero | Contains no address. Useless for identity; only a `/u/N` echo. Rejected. |
| **`chrome.identity.getProfileUserInfo()`** | Requires the `identity` permission; returns the *Chrome profile's* Google account (`email`, `gaiaId`) | Stable and non-DOM — but it answers the **wrong question**: the Chrome profile's Google login is independent of which Gmail account the page is showing. Users routinely browse a work Gmail while signed into a personal Google Chrome profile, and vice versa. | New install-time permission warning, a store-listing/privacy update, R01 touchpoint | Answers a different question than "which mailbox will Delete click on". If it disagrees with the DOM, we must block anyway; if it agrees, it added nothing. **Rejected as a primary source.** See §6. |
| **`chrome.cookies`** | Read `mail.google.com` cookies | `OSID`/`SSID` identify the *browser profile's Gmail session*, not which account a tab is displaying; multi-account tabs share them | `cookies` permission plus host access — a large, disproportionate privacy expansion for zero identity information | Cannot distinguish two accounts open in two tabs in one profile. **Rejected as overreach** (roadmap: preserve existing permissions by default). |
| **Human-asserted account** ("this is my work address") | User types it once | As stable as the user's memory | A prompt, and it is unverified input | If it were the identity source, a typo or a stale value is *worse* than unknown: the product would "verify" the user's guess against itself and then delete in the wrong mailbox. Rejected as a source. Retained only as an optional **expected-account tripwire**: if the user set one and the DOM disagrees, treat that as `identity-mismatch`, never as "which one is right?". |

### Decision

**Primary: the account address read from the rendered DOM of the tab that will act, extracted by
email regex rather than by label text.** One-line reason: it is the only candidate that names the
mailbox actually on screen, needs no new permission, and is locale-independent; everything else is
either unstable (`/u/N`), answers a different question (`identity`, `cookies`), or unverifiable
(a user's guess).

`/u/N` is retained **only** as a change detector, never as a key: if N changes while the address
does not, Gmail re-rendered; if the address changes, identity changed and the run aborts (§8).
A `/u/N` change with a stable address is logged, not blocked.

### Identity acquisition ladder (steps run in order; stop at first success)

1. **Avatar probe (primary).** From the account control, collect address-shaped substrings out of
   `aria-label`, `title` and `alt`. Accept only if exactly **one distinct** address is found —
   zero means "no evidence", two or more means "cannot attribute", and both are unknown (§10).
2. **Single-account corroboration.** If the avatar yields exactly one address, and the page's
   sign-out link's `u/N` matches `location.pathname`'s `u/N`, the two independent surfaces agree.
   Logged as `source: 'avatar'`. This is a sanity check, not a second opinion.
3. **Switcher probe (last resort).** If step 1 finds nothing, open the account menu and read the
   rows; accept only a row that is marked active by a verified state attribute, and mark the result
   `source: 'switcher', corroborated: false`. **Rule:** a `corroborated: false` identity may render
   a scan and may be re-checked, but the first implementation must still treat it as view-only
   until §13 items 1–3 are answered. Simplest correct reading: *do not ship step 3 in 3.3.0; ship
   steps 1–2 and fail closed otherwise.*

---

## 4. Where identity is read, and by whom

The **content script is the enforcement point**; the popup is UX only. The popup can be closed
mid-run, and only the content script owns the DOM that Delete clicks.

| Moment | Reader | Rule |
|---|---|---|
| Popup boot | Popup, by asking **every** Gmail tab (`GET_IDENTITY`) | Collect one identity per open Gmail tab. If any two disagree → `identity-multi`. |
| Scan start | Content script | Resolve identity; record it in the run. |
| Scan end | Content script | Re-resolve. If it differs from scan start → **discard the scan results, write nothing** (C-24: never attribute another account's data). |
| Every mutation boundary (§8) | Content script | Re-resolve; abort on any difference. |
| Confirmation | Popup, from the tab's own reported identity | Shows the verified address (C-31). Disables confirm when the identity is unknown or mismatched. |

Reading identity from *all* Gmail tabs is read-only, costs one message per tab, and is what makes
"Account A's results are on screen while account B is the active tab" a first-class state rather
than a silent mismatch.

---

## 5. Failure modes enumerated, and what each requires

| # | Failure mode | Mechanism that catches it |
|---|---|---|
| 1 | Two Gmail accounts in two tabs | Popup reads identity from every Gmail tab; disagreement → `identity-multi`, no action. The scan shown belongs to the tab's own account key, not to "the last scan". |
| 2 | `/u/N` changes because accounts were added/removed/reordered, or across sessions | N is not a key. Cache is keyed by address. N change with same address → logged; N change with different address → abort. |
| 3 | Account switched **in the acting tab** while a run executes | Gmail's account switch navigates the document, so `documentId` changes → run is dead and is reported interrupted, never resumed. If the switch does *not* reload (unverified, §13 item 3), the boundary re-resolve in §8 catches it. |
| 4 | Stale content script in a background tab / popup talks to a tab injected before the switch | Each `GET_IDENTITY` is answered by *that document's* current DOM and carries that document's `documentId`. The popup binds one tab per session and never re-resolves it for an action; the content script refuses any `DELETE` whose `documentId` does not match the one that reported identity. |
| 5 | Multiple tabs on the *same* account | Benign. Popup picks deterministically (active tab in the current window, else lowest tab id) and **displays the bound tab**. Only one tab may own a run (R06). |
| 6 | Legacy unbound cache (`inboxCleanerData` from 3.2.1) | §9. Rendered read-only, mutation disabled, never guessed into an actionable state (C-21). |
| 7 | Two distinct addresses appear in account-related attributes (multi-account profile, switcher) | Probe accepts only a unique address; ambiguity → unknown → view-only. |

---

## 6. Permission decision

**Recommendation: NO. R03 ships with zero new permissions.** `permissions` stays
`["storage", "tabs"]`; no background service worker, no `scripting`, no `identity`, no `cookies`.

`chrome.identity.getProfileUserInfo` is priced honestly and still rejected: it needs a new
install-time warning plus an R01 privacy/listing update, it returns the *Chrome profile's* Google
account rather than the Gmail account on screen, and when it disagrees with the DOM the product
must block anyway — so it cannot be a fallback identity source. It could be a corroborating signal
that only ever *agrees*, which buys nothing for a permission the whole product pitch ("local,
minimal permissions") is built on. The roadmap constraint ("any new permission … needs an
explicit design decision") is satisfied by this document recording a negative decision. If a future
task wants `identity`, it is a separate roadmap item with a listing change, not an R03 detail.

No permission is needed for the design above: the content script is already declared for
`https://mail.google.com/*`, and identity is read on demand from a tab the popup already talks to.

---

## 7. Binding rules — what a scan binds to

Per C-20, and add:

- **B-1** A scan is bound to `accountKey` + `documentId` + `tabId` + `scannedAt` + discovery scope +
  unit + per-count scope. Missing any of these ⇒ the record is **unbound** ⇒ view-only.
- **B-2** The bound `accountKey` is the address observed at scan **start**, and the scan is only
  written if the same address is observed at scan **end**.
- **B-3** The address is stored normalized (trim, lowercase) — `parsing.js:13` already normalizes
  senders this way. It is stored **only** as a cache key and a display string.
- **B-4** A cache entry is looked up by the **acting tab's** current `accountKey`. Switching Gmail
  accounts in the same browser therefore shows that account's own scan (or the empty state) —
  never the previous account's list. This is the direct answer to the roadmap's review condition.
- **B-5** The bound `tabId` is advisory, not authoritative. Scope is defined by
  (accountKey + canonical query), so closing the reviewing tab does not invalidate the snapshot;
  it invalidates the *review*, and the user re-confirms against a freshly resolved identity (§10
  `tab-disconnected`).
- **B-6** Selecting a different Gmail tab in a multi-account browser re-binds the popup to that
  tab's identity and reloads the matching snapshot. Selection is cleared (C-34: no preselected
  senders, and a selection reviewed on A must never be confirmed on B).

---

## 8. Revalidation rules at mutation boundaries

**Boundary definition (conservative).** Any point after which the extension has issued an
interaction Gmail could act on. For the current delete chunk that is, per chunk:

- **B-a** before navigating to the chunk's search (`location.hash` write),
- **B-b** after `waitForSearchQuery` resolves, before clicking select-all,
- **B-c** immediately before clicking the Trash control,
- **B-d** before the next chunk's B-a.

**Checks, all of which must pass (AND), evaluated in the content script:**

- **R-1 `documentId`** equals the one bound to this run. Failure ⇒ `interrupted-document`.
- **R-2 `accountKey`** re-resolved from the DOM equals the run's bound `accountKey`. Failure ⇒
  `identity-changed`.
- **R-3 `accountKey`** re-resolved equals the `expectedAccount` the popup confirmed with.
  Failure ⇒ `identity-mismatch`. (R-2 and R-3 differ only in which side moved; both block.)
- **R-4** the bound snapshot still exists in storage, is bound, and is not view-only. Failure ⇒
  `snapshot-unbound`.
- **R-5** no run is already in progress in this document (R06 ownership). Failure ⇒ `run-busy`.

**On any failure:** stop at the boundary, click nothing further, mark the run failed with that
reason, leave the in-flight chunk's outcome `unknown` (C-25/C-28 — never assume it failed), and
**do not auto-retry**. The user gets a reconciliation route, not a retry button.

**Explicitly not an identity check:** comparing Gmail's result counter to the cached count at the
boundary. A counter difference is a count-confidence question owned by R02/R04 (C-11, C-17); it
must not be used as an account signal, and must not silently block a legitimate run.

---

## 9. Legacy unbound cache migration

Current writer: `content.js:287-289` (`{ senders, scannedAt, total, exactCount }` under
`inboxCleanerData`).

- **M-1** On first read after upgrade, if `inboxCleanerData` has no `version: 2`, treat the whole
  value as one legacy snapshot and move it to `legacyUnbound` inside the v2 container with
  `accountKey: null`, `viewOnly: true`, `reason: 'legacy-unbound'`.
- **M-2** It renders read-only, labelled as from an earlier version with the account unverified,
  with mutation disabled (C-21).
- **M-3** It is **never** upgraded into an actionable record by inference. There is no "assume the
  account is the one open now" path.
- **M-4** The single primary action is **Rescan** (which creates a properly bound record). A
  secondary "delete this old data" is offered (C-21 says deletion is offered, not assumed); no
  remote/cloud copy, no telemetry.
- **M-5** The migration is a single atomic `set`; if it fails, the legacy value is left exactly as
  it was and the popup shows the unbound state. Nothing is deleted before the v2 write succeeds.
- **M-6** Post-action cache edits (`content.js:354-360`) write only into the acting account's
  entry, never the legacy entry, and are subject to C-24/R09 (this recompute is `Bug 13` and is
  R04/R09's to fix; R03's obligation is only that it cannot write across accounts).

---

## 10. Blocked states and copy requirements

Semantics only; final strings belong to R10/R11 (and `popup.html`/`popup.css` are untouched here).
Every blocked state must answer, in its own words: **what was verified · what is blocked · what is
not happening (no mail is being moved) · the one primary action · whether cached data is still
being shown read-only**. No blocked state may use an ambiguous verb, may imply progress, or may
offer a destructive action. A blocked state must never render an address as *confirmed* when the
probe did not confirm it; "verified" and "unreadable" are different words.

| State id | Trigger | Primary action | Secondary | Explicitly forbidden here |
|---|---|---|---|---|
| `identity-unknown` | No unique address readable | **Re-check account** (re-runs the §3 ladder; cheap, no rescan) | Rescan; help text naming why (loading / signed out / Gmail layout changed) | Confirm, Move to Trash, any "proceed anyway". Cached list may render, marked unverified and read-only. |
| `identity-multi` | Two Gmail tabs report different accounts, or more than one address on the page | **Choose which Gmail tab to use** (lists each tab with its address) | Open a new Gmail tab for one account | Acting on whichever tab happened to answer first (today's `popup.js:44-49`). |
| `identity-mismatch` | Bound snapshot account ≠ acting tab account | **Scan this account** (or switch Gmail back to the snapshot's address) | Nothing else | A mismatch override of any kind. No "the numbers look the same" escape hatch. |
| `snapshot-unbound` | Legacy or otherwise incomplete binding (C-21) | **Rescan to enable cleanup** | Delete old data (M-4) | Showing the old totals in a confirmation, or an enabled action bar. |
| `no-tab` | No `mail.google.com` tab | **Open Gmail** | Retry | Retrying into the same dead end (R10). |
| `content-missing` | Tab exists but has no content script (loaded before install/reload, or extension reloaded) | **Reload this Gmail tab** — distinct from "Open Gmail" | Open Gmail in a new tab | Treating this as "no tab", and silently retrying forever. |
| `tab-disconnected` | Bound tab closed or navigated away | **Reconnect to a Gmail tab** (re-resolves identity; snapshot survives per B-5) | Rescan | Re-running the action against whatever tab appears next without re-review. |
| `interrupted-document` | `documentId` changed mid-run (R-1) | **Review what happened** (reconciliation; in-flight chunk is `unknown`) | — | Any retry affordance that implies the previous attempt did nothing (C-28). |
| `identity-changed` | Address changed mid-run (R-2/R-3) | **Review what happened** | Scan the account now open | "Continue anyway", and any claim that earlier chunks were all fine — chunks before the change are reported per chunk (C-27). |

Note on `identity-unknown` vs `no-tab`: the two look similar today (`popup.js:76-77` collapses
them). They have different recovery actions, so they must be distinct states (R10 asks for exactly
this split).

---

## 11. Where a scan is written and when it is not

- Only a run whose start and end identities agree writes a snapshot, and it writes into its own
  `accountKey` entry only.
- A failed or interrupted run writes nothing (C-24). A partial run writes a `partial` snapshot to
  its own account entry and leaves that account's previous complete snapshot untouched and
  readable.
- `GET_SCAN_STATE` and every broadcast (`SCAN_STATE`, `DELETE_STATE`, `DELETE_ERROR`) carry
  `accountKey`, `documentId` and, from R06, the run id. The popup **ignores** any broadcast whose
  `accountKey` does not match the bound one (this is "stale progress from an old run", Bug 14's
  runtime half).

---

## 12. Risk of this choice

**False negatives — legitimate flows this design wrongly blocks.** All are "blocked until someone
fixes a selector", never "wrong mailbox":

1. A Gmail UI or markup change that removes or renames the account control's `aria-label`/`title`/
   `alt` ⇒ every user is view-only after a Gmail deploy, with no in-product fix until the selector
   is updated. This is the single largest product risk in R03 and the reason §13 items 1–3 are
   blocking prerequisites for release, not nice-to-haves.
2. A non-English Gmail UI or a Workspace/HTML variant whose account control differs from the
   verified markup ⇒ blocked. (Email-regex extraction limits the damage — the surrounding words are
   never matched — but a different attribute set still fails closed.)
3. Reading identity while Gmail is mid-navigation (search, account switch, sign-in) ⇒ a transient
   read of the outgoing account, or of nothing ⇒ `identity-unknown`. If verification shows the
   control lags navigation, identity reads must be gated on a settled document, which costs a small
   latency on every read.
4. A legitimate alias entry: the same mailbox added to the profile under a second address. The
   user sees two cache entries for one mailbox. Failure direction is safe (duplicate data, no
   cross-mailbox action) but it is a confusing state that must not be presented as two accounts.
5. Reconnecting to a different tab after closing the reviewing one forces a re-confirmation. Mild
   friction by design.

**False positives — flows this design wrongly allows.** Being honest about the residual:

1. **TOCTOU.** Identity is re-read at B-c immediately before the Trash click, but nothing
   eliminates the millisecond window in which Gmail starts navigating to another account after
   that read. No DOM-only design can close it. Mitigation is minimal-window re-read + abort on any
   later change; it is not eliminated and must not be described as eliminated.
2. **Ambiguous attribution within one document.** If the page exposes two distinct addresses in
   account-related attributes and *does* mark which is active with an attribute we have not
   verified, the unique-address rule refuses rather than guessing — safe. But if a future Gmail
   build marks the active account in a way our probe reads as "two addresses" while one is stale,
   we would block, not mis-select. The only way to get a wrong *selection* is if the probe returns
   exactly one address and that address belongs to the inactive account — e.g. a stale DOM in a
   background tab that has not re-rendered after a switch. This is why `documentId` + boundary
   re-resolve exist, and why it is item 3 on the human list.
3. **Same-mailbox alias** (§above) can make the popup attribute an action to a label the user
   doesn't recognise. Cosmetic, not a cross-mailbox risk.

---

## 13. HUMAN-MUST-VERIFY (blocking, needs a real Gmail session)

Disposable accounts **A** and **B**, two Chrome profiles if possible. Each item records the actual
DOM/markup, not a memory of it. Items 1–4 block the R03 release.

1. **V-1 — the account control's real markup (blocking).** In DevTools on the Inbox, paste the
   trimmed outerHTML of the top-right account control for: (a) single-account profile, (b) profile
   with both A and B, (c) a non-English Gmail UI, (d) Gmail's newer/new-tab UI if it differs.
   Record exactly which attribute carries the address (`aria-label`? `title`? `alt`? `data-*`?) and
   its exact format, including the text around the address. This is the single selector R03
   depends on.
2. **V-2 — ambiguity and active marking (blocking).** With A and B in one profile, list every
   distinct address found anywhere in account-related attributes on the page. If more than one
   appears, record which one is the *active* account and which attribute says so
   (`aria-expanded`, `aria-checked`, `aria-current`, container class). Decides whether the
   unique-address rule is usable in a multi-account profile or must always block there.
3. **V-3 — what account switching does to the document (blocking).** In one tab, switch from A to
   B via Gmail's own switcher. Record: does it perform a full document navigation (new content
   script instance → new `documentId`)? Does `location.pathname` change from `/u/0/` to `/u/1/`? Is
   the account control re-rendered with B before the new view settles? Repeat the switch in a
   **background** tab and record whether the DOM updates at all before the tab is focused — this
   is the stale-background-tab evidence that decides whether boundary re-resolution is sufficient.
4. **V-4 — `/u/N` renumbering (blocking).** In a profile that starts with A only: record N. Add B;
   record N for both A and B and for each open tab. Remove B; record again. Add a second address
   for the same mailbox as A and record N. Confirm/refute that N is a position and therefore
   unusable as a cache key, and confirm whether an already-open tab's URL changes.
5. **V-5 — identity readable during navigation.** While a `category:promotions` search is loading
   and immediately after it settles, read the account control. Does it ever show a stale or absent
   address? Decides whether reads need a "document settled" gate.
6. **V-6 — any machine-readable, non-localized account identifier.** Look for `data-*` attributes,
   `img` `alt` on the avatar, and whether Gmail's own `window._OC_*` init payload contains the
   address. A stable, locale-independent identifier would de-risk V-1 substantially and should
   replace the `aria-label` probe if one exists. Record the evidence; do not adopt it on a hunch.
7. **V-7 — content-script lifecycle.** (a) Open Gmail, then reload the extension: does
   `sendMessage` fail until the tab is reloaded? Confirms the `content-missing` → "Reload this tab"
   copy. (b) Does the content script survive `location.hash` changes (`#search/...`) without
   re-injection? The scan depends on this (`content.js:172`).
8. **V-8 — the alias case.** Add a second address for mailbox A as a separate profile account and
   open each. Record what identity each entry reports and whether `/u/0` and `/u/1` resolve to the
   same mailbox — this decides the §12.4 copy.
9. **V-9 — two accounts, two tabs, end to end.** Scan A in tab 1. Open tab 2 on B. Open the popup.
   Record what the popup shows (which `state id`), that the action is disabled, and that "Choose
   which Gmail tab to use" lists both addresses. This is the roadmap's named review condition
   ("Account A results while account B is active") and it must be observed, not inferred.

---

## 14. Minimal test plan

Node's built-in runner; no browser, no mailbox. Extend the existing `vm` harness in
`test/content.test.js`; create `test/popup.test.js`. R02's numbered plan (§12 of the contract)
already owns items 10–16 and 17+; the numbers below continue that series and add the identity
layer R03 owns.

### Harness additions (both files)

A fake identity DOM: a configurable account control whose `aria-label` may hold one address, two
addresses, a non-English string with an address, or nothing; a mutable `/u/N`; a mutable `documentId`;
and a **click spy** that records every element clicked so "no mutation happened" is assertable.
A fake `chrome.storage.local` that records every `set` and can be pre-seeded with (a) a v2
container, (b) a legacy `inboxCleanerData` payload, (c) a snapshot bound to a different account.
A fake `chrome.tabs` returning 0, 1, or 2 Gmail tabs with independent identities.

### `test/content.test.js` — extend

- **13.** A snapshot is written with `accountKey`, `documentId`, `tabId`, `scannedAt`, unit and
  per-count scope (R02's item 13, restated with `documentId`).
- **17.** `resolveIdentity()` returns the address from the avatar `aria-label` with
  `source:'avatar'`; from `title`/`alt` when `aria-label` is absent; and with `corroborated:false`
  when only the sign-out-link index agrees.
- **18.** A non-English control label containing the address still resolves — the probe matches the
  address, not the words around it.
- **19.** Two distinct addresses on one page ⇒ identity `unknown`; the `DELETE` handler responds
  `{ok:false, reason:'identity-unknown'}` and the click spy recorded **zero** clicks.
- **20.** No address readable (loading / signed out / markup changed) ⇒ `identity-unknown`, zero
  clicks, and the popup-visible reason distinguishes it from `no-content-script`.
- **21.** A `DELETE` whose `expectedAccount` names A while the DOM says B ⇒ refused, zero clicks,
  cache untouched.
- **22.** Identity flips A→B **between chunks**: chunk 1 acts, chunk 2 is refused with
  `identity-changed`, `deleteState` ends failed-not-done, the in-flight outcome is `unknown` (not
  `failed`), and no automatic retry is issued. [C-25, C-28]
- **23.** `documentId` changes mid-run ⇒ `interrupted-document`, zero further clicks, run reported
  interrupted rather than resumed.
- **24.** Scan whose identity changes between start and end writes **nothing** to storage; the
  previous complete snapshot for its account is still readable. [C-24]
- **25.** Legacy `{senders, scannedAt, total, exactCount}` payload migrates to `legacyUnbound` with
  `viewOnly:true`; the action path rejects it with `snapshot-unbound`; the read still renders the
  list. [C-21, M-1…M-3]
- **26.** A post-action cache edit writes only the acting account's entry (a different account's
  entry is byte-identical afterwards).
- **27.** A `DELETE` with no snapshot in storage ⇒ `snapshot-unbound`, zero clicks. (R-2's R-4.)
- **28.** A second `START_SCAN`/`DELETE` while one is running is rejected (R06's ownership, R05).
- **29.** `GET_IDENTITY` on a tab reports that document's *current* address and `documentId`, and
  two fake tabs with different addresses each report their own — the basis of `identity-multi`.

### `test/popup.test.js` — new

Note: `popup.js` is top-level DOM code with no exports. First choice is to load it in a `vm`
context with a fake `document`/`chrome`, exactly like `content.test.js` does — no production seam
required. Fall back to extracting pure helpers only if the harness proves unworkable; that is a
test-shaped change, not a contract change.

- **30.** Two Gmail tabs with different identities ⇒ the popup shows `identity-multi`, not the
  sender list, and no action control is enabled. Assert the click spy on the fake DOM records no
  message of type `DELETE`.
- **31.** Cache bound to A, acting tab B ⇒ sender list renders read-only with the mismatch reason
  surfaced; `btn-delete` is disabled; no `DELETE` message can be produced from any click path.
- **32.** Legacy unbound cache ⇒ list renders, cleanup is blocked with reason `snapshot-unbound`,
  and the primary affordance is Rescan. [C-21]
- **33.** The `DELETE` message the popup sends carries `expectedAccount` and `expectedDocumentId`
  equal to the identity it displayed. [C-23]
- **34.** Tab selection prefers the active tab in the current window and, among several Gmail
  tabs, the one whose identity matches the displayed snapshot's account; the bound tab is
  displayed. [B-4, B-6]
- **35.** Re-binding to another tab clears the selection and reloads the other account's snapshot.
  [B-6, C-34]
- **36.** A broadcast whose `accountKey`/`documentId` does not match the bound run is ignored —
  a late `DELETE_STATE` from account B must not repaint account A's popup or raise a completion
  toast. [§11, Bug 14]
- **37.** The confirmation surface contains the verified address (assert the address string is
  present; do not assert the whole sentence). [C-31]
- **38.** Every `state id` in §10 renders a primary action and never an enabled destructive
   action — a table-driven test over the blocked-state list, asserting semantics via the DOM
   presence of the primary control and absence of an enabled action bar.

---

## 15. What would change this decision

- **V-6 finds a stable non-localized identifier** (V-1's control attribute is replaced).
- **V-2 shows multi-account profiles routinely expose two addresses** ⇒ the primary probe cannot
  rely on uniqueness and must use V-2's active-marking attribute, or multi-account profiles ship
  view-only.
- **V-3/V-5 show a background tab can keep a stale account control indefinitely** ⇒ boundary
  re-resolution is insufficient and the design needs an additional guard (e.g. requiring the tab to
  be the active tab in the focused window before any mutation, at the cost of blocking background
  execution). This is the one open question that could force a structural change, and it is
  question V-3.
