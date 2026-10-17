# DOM Automation Architecture — Design Spec

**Date:** 2026-09-06
**Goal:** Replace the Gmail API + OAuth architecture with content-script DOM automation on `mail.google.com`, eliminating Google's "unverified app" / restricted-scope verification wall that currently blocks real users from completing sign-in, while preserving the existing feature set.

---

## Context

Inbox Cleaner v2.1.0 uses `chrome.identity` + Gmail REST API (`gmail.readonly`, `gmail.modify` scopes) to scan and bulk-trash email. `gmail.readonly`/`gmail.modify` are Google **restricted scopes**, so every real user who isn't the developer or an added test user hits "Google hasn't verified this app" and is blocked (or has to click through an "unsafe" warning). Clearing that wall requires OAuth consent screen verification plus an annual third-party CASA security assessment — real cost and lead time.

Many free/indie "bulk inbox cleaner" extensions avoid this entirely by never calling the Gmail API: they request a plain (non-restricted) `host_permissions` grant for `mail.google.com` and drive the actual Gmail web UI via a content script — the same clicks a human would make. No OAuth, no restricted scopes, no verification wall.

This spec re-architects Inbox Cleaner onto that model.

**Preserved feature set:** scan all 5 categories (Primary/Social/Promotions/Updates/Forums), rank senders by email count with color-coded thresholds, show category badges + last-received date per sender, multi-select senders, bulk-move to Trash.

**Decisions locked in during brainstorming:**
- Extension **requires** a `mail.google.com` tab already open (does not auto-open one)
- Scan is a **full scan** — auto-scrolls each category to completion for accurate counts, not a capped sample
- Delete uses Gmail's **native "select all conversations that match this search"** bulk action, not manual per-page row selection
- UI **stays the toolbar popup** — no injected in-page overlay

---

## Architecture

Two components instead of three — the service worker (`background.js`) is removed entirely. It existed only to hold the OAuth token and make authenticated `fetch` calls; a content script automating the live Gmail tab needs neither, and can hold scan/delete state itself for as long as that tab stays open.

```
manifest.json     ← drop identity/oauth2/googleapis host_permissions;
                    add host_permissions + content_scripts for mail.google.com
content.js        ← NEW: runs in the Gmail tab, does all scanning/deleting
popup.js/.html/.css ← same UI, now messages content.js instead of background.js
```

`popup.js` locates the Gmail tab via `chrome.tabs.query({url: "https://mail.google.com/*"})` and talks to it with `chrome.tabs.sendMessage`. If no matching tab exists, the popup shows "Open Gmail in a tab first, then try again." If **multiple** matching tabs exist (multiple accounts or windows), prefer the currently active tab if it matches; otherwise use the first result — no UI for picking among several, since this is an edge case, not the primary flow.

---

## Scan flow (`content.js`)

For each of the 5 categories, navigate via Gmail's documented `category:` search operator rather than clicking tab UI (stable across Gmail redesigns; tab markup is not):

```
location.hash = 'search/category:primary'
location.hash = 'search/category:social'
location.hash = 'search/category:promotions'
location.hash = 'search/category:updates'
location.hash = 'search/category:forums'
```

Per category:
1. Wait for the results list container to render, via a `MutationObserver` on the results pane (not a fixed sleep), with a 15s timeout that surfaces a clear error if the container never appears (covers the "Gmail layout changed" case at the entry point of every category).
2. Auto-scroll the list to trigger Gmail's lazy-loading: set the results container's `scrollTop` to its `scrollHeight` and dispatch a `scroll` event (a plain `scrollTop` write alone may not trigger Gmail's virtualized-list loader), reading each newly-rendered row's sender name/email and date as it mounts.
3. Track each row's thread-id DOM attribute in a `Set` to avoid double-counting rows Gmail keeps mounted during virtualized scrolling.
4. Stop once **3 consecutive** scroll steps produce no new thread ids (end of category reached).
5. Category is known by construction (whichever `category:` search is active) — no per-row category detection needed.

Sender/date extraction and thread-id dedup are implemented as **pure functions** taking a row element (or a plain object shape extracted from one) as input, so they're unit-testable against saved fixture HTML without a live Gmail session.

Progress (`category X of 5, N conversations found so far`) is broadcast to the popup via `chrome.runtime.sendMessage`, same pattern as today. The final aggregated sender list is written to `chrome.storage.local` under the existing `inboxCleanerData` shape, so `popup.js`'s rendering code needs minimal changes.

**Tradeoff:** meaningfully slower than the old API-based scan — rendering and scrolling five live result sets instead of a couple of batched API calls. Expect low minutes rather than seconds on a large inbox. The Gmail tab must stay open and not navigate away mid-scan.

---

## Delete flow (`content.js`)

1. Popup sends `DELETE` with the array of selected sender emails.
2. Content script builds a Gmail search query: `from:(a@x.com OR b@y.com OR ...)`. Sender lists are chunked (e.g. 20 per query) to keep the search string within a safe length.
3. Navigate: `location.hash = 'search/' + encodeURIComponent(query)`.
4. Wait for results to render, then:
   a. Click the toolbar's "select all conversations on this page" checkbox.
   b. Wait for Gmail's "Select all X conversations that match this search" banner link to appear, and click it.
   c. Click the Trash button in the toolbar.
5. Broadcast progress per chunk; on completion, optimistically remove the deleted senders from the cached `inboxCleanerData` in `chrome.storage.local` (exact post-delete counts aren't re-verified — matches today's "trust the batch call succeeded" behavior).

DOM selectors for the checkbox/banner-link/trash-button use `aria-label`/`role`/`data-tooltip` attributes rather than Gmail's obfuscated CSS class names, since those are far more stable across Gmail UI revisions.

---

## Error handling

- **No Gmail tab found:** popup shows "Open Gmail in a tab first, then try again" (per the locked-in decision — extension never auto-opens a tab).
- **Gmail tab closed/navigated away mid-operation:** `chrome.tabs.sendMessage` fails with `chrome.runtime.lastError`; popup surfaces a clear error rather than hanging silently.
- **Selector not found (Gmail layout changed):** each DOM-dependent step checks for element existence before acting and throws a specific, user-facing error ("Gmail's layout may have changed — please report this") instead of silently under-counting or mis-clicking. This is the main ongoing maintenance cost of the DOM-automation approach and should be called out in the README/CHANGELOG as a known tradeoff.

---

## Testing

- **Unit-testable:** row-parsing (sender/date extraction), thread-id dedup, category aggregation, search-query chunking/building — all pure functions over plain inputs, testable with saved Gmail DOM fixtures.
- **Not automatable:** the actual scan/delete flow against live Gmail rendering. No framework can safely fake Gmail's real SPA behavior. This needs a manual test pass against a real Gmail account before each release: full scan across all 5 categories on an inbox with a non-trivial email count, single-sender delete, multi-sender (chunked) delete, and the "no Gmail tab open" error path.

---

## Rollout

- Version bump to **3.0.0** (permission model and core mechanism both change — this is a breaking architectural change per semver, not a patch/minor).
- CHANGELOG entry describing the OAuth → DOM-automation migration and why (verification wall).
- Update `docs/CHROME_WEB_STORE.md`: permission justification section changes from `identity`/Gmail API host permissions to a single `mail.google.com` host permission describing on-page automation; privacy practices tab answers need re-review since the data-handling story changes (data is now read from the rendered page rather than an API response, though it's the same data and still never leaves the browser).
- Chrome Web Store requires a standard re-review after uploading the new package (permission set changed), but **not** Google's OAuth verification process — this is the whole point of the migration.
