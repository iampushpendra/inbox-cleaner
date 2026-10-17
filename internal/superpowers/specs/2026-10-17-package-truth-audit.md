# Package truth audit — R01

**Date:** 17 October 2026
**Scope:** the packaged extension (repo working tree + `inbox-cleaner-extension-3.2.1.zip`) and every public claim about it.
**Method:** read the source and copy in this repo, ran `node --test`, compared the upload zip to the working tree. No Chrome Web Store console access, no live Gmail run.
**Verdicts:** `SUPPORTED` (code shows it), `UNSUPPORTED` (code contradicts it), `OVERSTATED` (true in part, stronger than the evidence), `NEEDS-HUMAN-VERIFICATION` (cannot be closed without store console or a live mailbox).

---

## (a) Local package facts

| Fact | Value | Source |
|---|---|---|
| Manifest version | `3.2.1` | `manifest.json:4` |
| `VERSION` file | `3.2.3` | `VERSION:1` |
| Version mismatch | **Yes — 3.2.1 vs 3.2.3, deliberate and documented** as docs-only releases; runtime stays 3.2.1 | `README.md:8`, `CHANGELOG.md:21`, `CHANGELOG.md:30` |
| Name | `Inbox Cleaner` | `manifest.json:3` |
| Description | 90 chars, within the 132-char store limit (edited twice in this task: see claims #10 and #14) | `manifest.json:5` |
| `manifest_version` | `3` | `manifest.json:2` |
| Permissions | `["storage", "tabs"]` | `manifest.json:6` |
| Host permissions | `["https://mail.google.com/*"]` | `manifest.json:7-9` |
| Content script | `parsing.js`, `content.js`; `document_idle`; same match | `manifest.json:10-16` |
| Action | default popup `popup.html`, icons 16/48/128 | `manifest.json:17-24` |
| Background service worker | **none declared** — no background code exists | `manifest.json` (no `background` key) |
| Network code in shipped extension JS | **none.** No `fetch`, `XMLHttpRequest`, `sendBeacon` or `WebSocket` in `content.js`, `popup.js`, `parsing.js` | repo-wide grep; only hits are in `docs/app.js:143,157,214,231,535` (web app) |
| Upload zip contents | `inbox-cleaner-extension-3.2.1.zip` = manifest.json, content.js, parsing.js, popup.html/js/css, 3 icons. **Identical as of audit time** (`diff -q` on each of the 6 text files, run 2026-10-17), **but no longer byte-identical**: `manifest.json` was edited in this audit (claim #10) *after* the zip was built, so `manifest.json` inside the zip now matches the previous commit, not the working tree. The other 5 text files still match. **Rebuild the zip before any upload or submission** — see §(c) item 9. | `unzip -l` + per-file `diff` |
| Test suite | `node --test` → **35 pass, 0 fail** | run 2026-10-17 |
| Scan phases | Phase A paginates 5 categories (max 500 pages each); Phase B runs one `from:` search per sender for the top 250 senders | `content.js:19-38`, `content.js:250-292` |
| Delete batching | senders chunked 20 per query, sequential Gmail navigation per chunk | `parsing.js:35-43`, `content.js:324-352` |
| Trash mechanism | clicks Gmail's own toolbar control (`div[aria-label="Delete"]`) after Gmail's "select all matching" link — i.e. Gmail's Trash, not permanent delete | `content.js:51-62`, `content.js:324-339` |
| Requires an open Gmail tab | **Yes** — no tab ⇒ `{ok:false, reason:'no-tab'}` and a dedicated screen | `popup.js:44-49`, `popup.js:77`, `popup.js:92-93`, `content.js:19-25` |
| Local storage | `chrome.storage.local` key `inboxCleanerData` (senders, scannedAt, total, exactCount) | `content.js:287-289`, `popup.js:66-69` |
| AI / model / API key | none in the extension | repo grep; roadmap `plans/…roadmap.md:32` |

## (b) Claims audit

| # | Public claim | Where | Verdict | Evidence |
|---|---|---|---|---|
| 1 | "Works entirely in your browser. No server. No data ever leaves your device." | `README.md:22` | SUPPORTED | No network primitive in any shipped extension file; only `chrome.storage.local` + DOM |
| 2 | "No API, no OAuth — nothing is sent anywhere" | `README.md:36,97` | SUPPORTED | `manifest.json:6-9`; no background worker; no fetch in extension JS |
| 3 | "No network requests at all" (listing privacy block) | `docs/CHROME_WEB_STORE.md:39,66-67,89` | SUPPORTED | same as #1/#2 |
| 4 | Scans "all 5 categories — Primary, Social, Promotions, Updates, Forums" | `README.md:14`, `docs/CHROME_WEB_STORE.md:25-30`, `docs/index.html:137` | SUPPORTED | `content.js:19-25`, `content.js:257-264` |
| 5 | Requires an already-open Gmail tab | `README.md:39,114`, `CHANGELOG.md:103`, `docs/index.html:213` | SUPPORTED, **but under-emphasised** in listing/site copy (no store or hero text states it) | `popup.js:44-49,77,92` |
| 6 | "A full scan takes minutes, not seconds" | `README.md:157`, `docs/index.html:55,229`, `CHANGELOG.md:91` | SUPPORTED | Phase A pages to the end of 5 categories + Phase B ≤250 searches (`content.js:182-213,268-281`) |
| 7 | "Scan takes ~30 seconds for 5,000 emails" | `docs/index.html:273` | NEEDS-HUMAN-VERIFICATION | The card is the **web app** tool (OAuth/API), not the extension. `docs/app.js:415-428` shows the web app also runs one `from:` search per sender, so the number is not obviously safe. Only a human with a live Google account can time it. **Not edited** |
| 8 | "Move everything from selected senders to Trash in one click" | `README.md:3`, `docs/CHROME_WEB_STORE.md:20,34`, `docs/index.html:23,121` | SUPPORTED | one click starts the batch; `popup.js:400-403`, `content.js:343-352` |
| 9 | "**One-click Trash** — moves everything from selected senders to Trash **in seconds**" | `README.md:20` | OVERSTATED — **edited** | Senders are chunked 20/query and each chunk is a sequential Gmail navigation with ≥1 s settle (`parsing.js:35-43`, `content.js:324-338,348-352`); the popup shows a "Deleting batch X of Y" progress bar (`popup.js:322-324`), so time scales with selection size |
| 10 | manifest description "Select and **delete** in one click." | `manifest.json:5` | OVERSTATED — **edited** | The action is Gmail's Trash control (`content.js:62,324-339`); the roadmap forbids conflating delete with Trash (`plans/…roadmap.md:49`) and every other surface already says "Trash" |
| 11 | "Moves mail to Trash (recoverable for 30 days), never permanently deletes" | `docs/CHROME_WEB_STORE.md:41`, `README.md:99`, `docs/index.html:50,225,368`, `popup.js:268` | SUPPORTED (30 days is Gmail's own behaviour, not extension code) | `content.js:324-339` |
| 12 | Privacy policy describes OAuth, `messages.trash` API, `localStorage`, "revoke access" | `docs/privacy.html:24-47` (as the extension's published policy, linked at `docs/CHROME_WEB_STORE.md:93`) | UNSUPPORTED **for the extension** — **edited** | `manifest.json` declares no `identity` permission and no background worker; storage is `chrome.storage.local` (`content.js:287`); trash is DOM automation (`content.js:324-339`). Policy now scopes the two products separately |
| 13 | "Nothing is sent to any external server" (site-wide trust bar) | `docs/index.html:127,139,221`, `docs/privacy.html:35` | OVERSTATED — **partly edited** | Gmail data never leaves the browser (true), but the waitlist form POSTs an email address to a Google Apps Script endpoint (`docs/app.js:13,522-535`). Now disclosed in `docs/privacy.html`; the hero trust bar was left for the publisher |
| 14 | "Email count per sender", "ranks every sender by email count" | `README.md:14`, `docs/index.html:22,121`, `docs/CHROME_WEB_STORE.md:31` | OVERSTATED — **not edited (R02)** | Phase A counts deduplicated **conversations** (`parsing.js:24-33,45-58`); Phase B replaces that with Gmail's result counter, which is a conversation counter, and only for the top 250 senders (`content.js:38,269`); the rest render `~` (`popup.js:189`). The conversation-vs-message unit is R02's open decision, so no copy was changed here |
| 15 | "Only 250 heaviest senders get an exact count … long tail keeps its sampled count and can still under-report what delete removes" | `README.md:155`, `CHANGELOG.md:84-86,92-93` | SUPPORTED and accurate | `content.js:38,269`, `parsing.js:103-116`, `popup.js:189`, `popup.js:266-270` |
| 16 | "Deletion confirmation says 'at least' when any count is inexact" | `CHANGELOG.md:85-86` | SUPPORTED | `popup.js:266-270` |
| 17 | "Never permanently deletes / no permanent-delete feature" | `docs/CHROME_WEB_STORE.md:41` | SUPPORTED | no permanently-delete call path anywhere |
| 18 | "Only From and Date headers read; never subject, body or attachments" | `docs/CHROME_WEB_STORE.md:38`, `docs/index.html:45,221`, `docs/privacy.html:30` | SUPPORTED (extension reads rendered sender name/address + date title) | `content.js:91-101`, `SELECTORS` `content.js:45-63` |
| 19 | Permissions listed as `storage` + `mail.google.com` host access | `docs/CHROME_WEB_STORE.md:43-46` | **INCOMPLETE** — `tabs` is declared in `manifest.json:6` and justified in the privacy tab at `docs/CHROME_WEB_STORE.md:71-78`, but the listing description omits it. **Not edited** — Web Store permission disclosure is a publisher console decision |
| 20 | "Scan results cached locally" | `README.md:98`, `docs/CHROME_WEB_STORE.md:40`, `docs/privacy.html` | SUPPORTED | `content.js:287-289` |
| 21 | Any "storage freed / space reclaimed" claim | — | **none found** in product surfaces | repo grep; `docs/index.html:70,241` correctly states Trash still uses storage until emptied |
| 22 | "Trash ≠ Delete (30 days to restore)" | `docs/index.html:145,368` | SUPPORTED | as #11 |
| 23 | "No preselected senders" | implied by `popup.js:220` (action bar hidden until selection) | SUPPORTED | `popup.js:219-224`, `popup.js:7` (empty `Set`) |
| 24 | "Public listing was verified as version 3.0.0 on 2026-10-16" | `docs/CHROME_WEB_STORE.md:3` | NEEDS-HUMAN-VERIFICATION | asserted, not verifiable from this repo |
| 25 | "Unsubscribing stops future emails" is not a product feature | `docs/index.html:80,249` | SUPPORTED (correctly framed as separate from Trash) | no unsubscribe code path; `docs/index.html:80` tells users to unsubscribe separately |
| 26 | README "Current version: 3.2.3 — documentation release; extension runtime remains 3.2.1" | `README.md:8` | SUPPORTED | `VERSION:1` vs `manifest.json:4` |
| 27 | manifest description "Select senders and move all their mail to Trash **in one click**." | `manifest.json:5` | OVERSTATED — **edited** | Not one click. It is **two deliberate user actions**: selecting senders, then clicking "Move to Trash" in the confirmation dialog (`popup.html:111`, `popup.js:403`), each chunk additionally paying a ≥1 s Gmail settle (`content.js:338`). A destructive action gated on an explicit second step cannot honestly be advertised as one click. |
| 28 | "**0** — **Servers. Zero.**" (social-proof stat) | `docs/index.html:139` | **UNSUPPORTED** — **not edited (publisher)** | The **extension** has no server and no network primitive (claims #1–#3), but this is the marketing *site*'s claim, and the same page's waitlist form POSTs the visitor's email address to a Google Apps Script endpoint (`docs/app.js:13`, `docs/app.js:522-535`, `docs/app.js:535`). A stat block asserting a hard `0` next to a live POST is a factual contradiction on the page that also carries `docs/index.html:127` "No data leaves your browser". Both instances are the same defect as claim #13; #13 was partly disclosed and #28 was missed. **Not edited** — this is hero-level positioning copy, and §(c) items 8 and 10 defer it to the publisher. |

### Install / download CTAs (URLs unchanged)

| Location | URL |
|---|---|
| `docs/index.html:107,123,363` (nav, hero, guides) | `https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep` |
| Every `docs/blog/*.html` nav + `blog-cta-btn` (verified by repo-wide grep: one single store URL, no variant) | same as above |
| `docs/CHROME_WEB_STORE.md:5`, `scripts/site-config.json:3` (canonical value) | same as above |
| `README.md:30` extension install link | same as above |
| `README.md:5,28,103` "Live App" / "Open the web app" / privacy link | `https://iampushpendra.github.io/inbox-cleaner/` — secondary surface, distinct from the store |

All install CTAs resolve to one store listing ID. **Whether that listing is live, and at which version, is a store-console fact** — see §c. README points the web app at `iampushpendra.github.io` while `docs/index.html` canonicalises `inbox-cleaner.vercel.app`; both were reachable as deployment targets per `CHANGELOG.md:127` and `scripts/site-config.json:2`, but liveness was not checked.

## (c) Requires publisher / store verification

Only a human with Chrome Web Store Developer Dashboard access can close these. None were guessed at.

1. **Installed store version.** `docs/CHROME_WEB_STORE.md:3` claims the live listing is 3.0.0; the repo has 3.2.1 packaged and unpublished. Verify the listing's current version and whether 3.2.1 was ever submitted (`inbox-cleaner-extension-3.2.1.zip`).
2. **Installed store permissions.** Confirm the listing's Privacy tab matches `manifest.json:6-9` (`storage`, `tabs`, `mail.google.com` host) — the local listing copy omits `tabs` from the description (claim #19).
3. **Listing copy vs packaged code.** The description, summary and name in `docs/CHROME_WEB_STORE.md:13-50` are a *draft*; nothing proves the live listing matches it, and nothing proves the live listing reflects post-3.0.0 behaviour ("no OAuth", "no network requests").
4. **Store screenshots / promo tiles** are still marked ❌ at `docs/CHROME_WEB_STORE.md:101-103`; capture must show real UI states, including the `~` count qualifier.
5. **Live Gmail behaviour.** Selector validity (`SELECTORS`, `content.js:45-63`), the 250-sender count cap's real effect, and the multi-batch delete timing were not exercised. Code reading cannot certify these.
6. **Privacy policy URL reachability** — `docs/CHROME_WEB_STORE.md:48,93` point at `iampushpendra.github.io/inbox-cleaner/privacy.html` while the site's canonical host is `inbox-cleaner.vercel.app`. Confirm which host serves it.
7. **`docs/index.html:273` "Scan takes ~30 seconds for 5,000 emails"** — web-app speed claim; needs a timed run.
8. **Hero trust bar** `docs/index.html:127` "No data leaves your browser" now sits above a waitlist form that POSTs to Google Apps Script. Publisher decides whether to soften the copy or keep it (an evidence note is now in `docs/privacy.html`).
9. **Rebuild the upload zip.** `inbox-cleaner-extension-3.2.1.zip` predates the `manifest.json` description edits made in this audit, so the packaged description is the *old* ("delete in one click") wording. Re-run the packaging step and re-verify per-file `diff` against the working tree before any submission; the checklist row "Upload zip contents match working tree" is currently **failing**.
10. **Social-proof stat "Servers. Zero."** `docs/index.html:139` is a second instance of the §(c) item 8 defect, caught here as claim #28: the same page's waitlist POSTs to Google Apps Script (`docs/app.js:13,522-535`), so the hard `0` is false for the site as a whole (true only for the extension). Decide together with item 8 — either scope the claim to the extension ("No servers. In the extension.") or drop the `0`. Until then `docs/index.html:139` is an unedited public inaccuracy.

## (d) Before/after release checklist template

Fill one copy per release. "Before" = state recorded; "After" = state re-verified before submit.

| Check | Before | After |
|---|---|---|
| `manifest.json` version vs `VERSION` vs CHANGELOG entry | | |
| Permissions + host permissions unchanged from last published package | | |
| Upload zip contents match working tree (`diff` each file) — **currently failing for `manifest.json`**, see §(a) and §(c) item 9 | | |
| Manifest description length ≤132 chars, wording matches shipped behaviour | | |
| Every behavioural claim traced to a `file:line` in this repo | | |
| No claim of exact counts beyond `MAX_SENDERS_TO_COUNT` | | |
| No "delete" used where the code moves to Trash | | |
| No "storage freed" / quota-reclaimed language | | |
| Open-Gmail-tab requirement stated in listing + site copy | | |
| Scan duration stated as minutes, never seconds | | |
| Install CTAs all point at the one store URL in `scripts/site-config.json` | | |
| Privacy policy distinguishes extension (no OAuth, `chrome.storage.local`) from web app (OAuth, `localStorage`) | | |
| `node --test` green | | |
| Live Gmail smoke run recorded (scan, count, batched Trash, recovery from Trash) | | |
| Developer Dashboard confirms submission + published version | | |

---

## Change log from this audit (copy only — no code, no permissions, no version numbers)

- `manifest.json:5` — "Select and delete in one click" → "Select senders and move all their mail to Trash in one click" (claims #10), then → "Select senders, then confirm to move all their mail to Trash" (claim #27): the first fix kept "one click", which is still false because selecting and confirming are two user actions.
- `README.md:20` — dropped "in seconds"; states the 20-sender batching that the code actually performs (claim #9).
- `docs/privacy.html` — added a "Which product this covers" section separating the extension (no OAuth, no network, `chrome.storage.local`, Gmail Trash, `storage` + `mail.google.com`) from the web app that the rest of the policy describes, and added the waitlist endpoint disclosure (claims #12, #13).
- `docs/index.html:139` "Servers. Zero." — **recorded, not edited** (claim #28, §(c) item 10); it is the same Apps Script contradiction as claim #13 and is deferred to the publisher alongside the hero trust bar.
- `CHANGELOG.md` **not** edited: a `[Unreleased]` entry for this documentation change is left for the publisher so version metadata stays under their control.
- Upload zip **not** rebuilt: the packaging step belongs to the release checklist, not this copy task (§(c) item 9).
