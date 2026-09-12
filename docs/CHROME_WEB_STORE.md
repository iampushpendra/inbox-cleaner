# Chrome Web Store submission package

**Status: published.** The Developer Dashboard shows Inbox Cleaner v2.1.0 as
"Published - public" (submitted 2026-09-04, last updated 2026-09-06). The
listing copy and checklist below are kept as the source-of-truth draft for
future updates (version bumps, description edits) — paste changes into
https://chrome.google.com/webstore/devconsole rather than editing the live
listing directly by hand, so this file stays in sync.

## Listing copy

**Name** (max 45 chars)
```
Inbox Cleaner — Bulk Gmail Delete
```

**Summary** (max 132 chars, shown in search results)
```
See who's filling your Gmail. Scan all 5 categories, pick senders, move everything from them to Trash in one click.
```

**Description** (max 16,000 chars, first ~3 lines matter most before "read more")
```
Most Gmail cleaners only look at your Primary inbox. Inbox Cleaner scans all
5 categories — Primary, Social, Promotions, Updates, Forums — and shows a
ranked list of exactly who's filling up your inbox.

WHAT IT DOES
• Scans every category, not just Primary
• Ranks senders by email count (color-coded: red 100+, orange 50+)
• Shows category badges and last-received date per sender
• Select one sender or dozens at once
• One click moves everything from selected senders to Trash

PRIVACY FIRST
• Runs entirely in your browser — no server, no backend
• Only reads the From and Date headers — never subject, body, or attachments
• Nothing is ever sent anywhere — no API calls, no network requests at all
• Scan results are cached locally in your browser
• Moves mail to Trash (recoverable for 30 days), never permanently deletes

PERMISSIONS
• storage — cache your scan results locally
• host access to mail.google.com — read your Gmail page and drive its own
  bulk "move to Trash" action; no API calls, no sign-in step

Full privacy policy: https://iampushpendra.github.io/inbox-cleaner/privacy.html
Try it with no install first: https://iampushpendra.github.io/inbox-cleaner/
```

**Category**: Productivity

**Language**: English

## Privacy practices tab (Developer Dashboard → Privacy)

This is the part that most commonly blocks approval — be exact.

- **Single purpose**: "Scans a user's Gmail inbox across all categories and
  lets them bulk-move messages from selected senders to Trash."
- **Permission justifications**:
  - `host_permissions` (`mail.google.com`) — "Used to run a content script inside
    the user's own already-authenticated Gmail tab, reading the rendered sender
    name and date off each conversation row and driving Gmail's own bulk
    'move to Trash' action. No network requests are made by the extension and
    no other host is contacted."
  - `storage` — "Caches the scan results (sender name, email, count, category,
    last-received date) in chrome.storage.local so the user doesn't have to
    rescan on every popup open."
  - `tabs` — "The popup needs the tab ID of the user's already-open Gmail tab
    so it can send scan and move-to-Trash commands to its content script via
    chrome.tabs.sendMessage. The only query the extension makes is
    chrome.tabs.query({ url: 'https://mail.google.com/*' }) — restricted to the
    single host already declared in host_permissions. No other tab is queried;
    no tab URL, title, or content from any other site is read; and no tab is
    created, modified, or closed. Without this the popup cannot reach its
    content script and the extension cannot function."
- **Data usage disclosure** — check these boxes honestly:
  - Does NOT collect personally identifiable info, health info, financial
    info, authentication info, personal communications content, location,
    web history, or user activity — because subject/body/recipients are
    never read. (3.0.0 note: there is no OAuth token and no sign-in of any
    kind; the extension never authenticates.)
  - Email addresses of senders ARE read (that's the product), but this is
    the user's own inbox metadata processed locally, not transmitted to the
    developer or any third party. Declare "Personal communications" as
    accessed-but-not-collected/transmitted: as of 3.0.0 the extension makes
    no network requests at all, so nothing leaves the browser.
  - Certify: data is not sold to third parties; data is not used for
    purposes unrelated to the extension's single purpose; data is not used
    to determine creditworthiness or for lending.
- **Privacy policy URL**: https://iampushpendra.github.io/inbox-cleaner/privacy.html

## Assets checklist (you'll need to produce these — screenshots of the real
UI convert better than any stock mockup, so this needs your Chrome, not me)

| Asset | Size | Status |
|---|---|---|
| Store icon | 128×128 | ✅ already have `icons/icon128.png` |
| Screenshots (1–5) | 1280×800 or 640×400 | ❌ needed — capture: (1) sender list ranked view, (2) category filter tabs, (3) selection + action bar, (4) delete confirmation modal |
| Small promo tile | 440×280 | optional but improves search placement — ❌ needed |
| Marquee promo tile | 1400×560 | optional, only used if Google features the extension — skip for now |

## Pre-submission technical checklist (completed for the 2.1.0 submission)

- [x] `manifest.json` version bumped to match README/CHANGELOG (`2.1.0`)
- [x] `manifest_version: 3` (required — already correct)
- [x] No remote code execution, no `eval`, no CDN-loaded scripts in the
      extension bundle (popup.js/content.js/parsing.js are self-contained —
      verify before zip if this changes)
- [x] Zip the repo root for upload — **exclude** `docs/`, `.git/`, `.vercel/`,
      `.superpowers/`, `.impeccable/`, `scripts/`, `*.py`, `.DS_Store` (the
      Web Store only needs manifest.json, content.js, parsing.js, popup.*,
      icons/)
- [x] $5 one-time developer registration fee (per Google account, not per
      extension)
- [x] Review completed — listing is live ("Published - public" as of
      2026-09-06)

## Checklist for the *next* version bump

- [ ] Bump `manifest.json` `version` + README/CHANGELOG together (see the
      `[Unreleased]` fix in CHANGELOG.md for why this drifted once already)
- [ ] Re-zip per the command below and upload as a new package version in the
      Developer Dashboard (Package → Upload new package)
- [ ] Update listing copy here first, then paste into the dashboard, so this
      file never falls out of sync with the live listing
- [ ] Expect 1–3 business days review time for the update

## Suggested zip command (once screenshots/promo tile are ready)

```bash
cd /Users/pushpendrasingh/projects/inbox-cleaner
zip -r inbox-cleaner-extension.zip manifest.json content.js parsing.js popup.html popup.js popup.css icons/
```
