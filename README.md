# 📥 Inbox Cleaner

**See who's filling your Gmail. Select senders and move all their emails to Trash in one click.**

[![Live App](https://img.shields.io/badge/Live%20App-open-blue?style=flat-square)](https://inbox-cleaner.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Current version: 3.2.5** — refreshed five analytics-priority guides; extension runtime remains 3.2.1. See [CHANGELOG.md](CHANGELOG.md) for what's new.

---

## What it does

Most Gmail cleaners only show your Primary inbox. Inbox Cleaner scans **all 5 categories** — Primary, Social, Promotions, Updates, Forums — and shows a ranked list of who's occupying the most space:

- **Email count** per sender (color-coded: red ≥100, orange ≥50)
- **Category badges** showing which Gmail tab their mail lands in
- **Last received** — relative timestamp of most recent email
- **Checkbox selection** — pick one sender or dozens at once
- **One-click Trash** — one click starts a batched pass through Gmail that moves everything from the selected senders to Trash (it navigates Gmail once per batch of up to 20 senders, so larger selections take proportionally longer)

Works entirely in your browser. No server. No data ever leaves your device.

---

## Try it

**[→ Open the web app](https://inbox-cleaner.vercel.app/)** — nothing to install, works on any browser

Install the [Chrome extension](https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep), or see [Extension setup](#chrome-extension-setup) for local development.

---

## How it works

**Chrome extension** (this repo's `manifest.json`/`content.js`/`popup.js`) — no OAuth, no API, no backend:

```
Open Gmail in a tab
       │
       ▼
Content script navigates category:primary / social / promotions / updates / forums
  Scrolls each category's results to completion, reads sender + date off each row
       │
       ▼
Group by sender → ranked list (chrome.storage.local)
       │
  [You select senders + click "Move to Trash"]
       │
       ▼
  from:(a OR b OR ...) search → Gmail's own "select all matching search" + Trash
```

**Web app** (`docs/index.html` at [inbox-cleaner.vercel.app](https://inbox-cleaner.vercel.app/)) is a separate surface that still uses Google Identity Services + the Gmail API directly — see `docs/app.js`.

---

## Competitive research

[Product roadmap and model assignments](internal/superpowers/plans/2026-10-17-inbox-cleaner-roadmap.md) — phased tasks, dependencies, acceptance criteria and recommended build/review models. [Read the HTML edition](reports/inbox-cleaner-roadmap.html).

[Inbox cleaner extension teardown](reports/Inbox%20cleaner%20extension%20teardown.md) · [HTML reading edition](reports/inbox-cleaner-extension-teardown.html) — an in-depth comparison of Chrome inbox cleaners, onboarding, interaction design, safety language and recommendations for this product, researched 17 October 2026.

## Organic growth audit

[SEO roadmap and delivery backlog](internal/superpowers/plans/2026-10-17-seo-roadmap.md) — SEO-01–SEO-09 tasks, all 15 audit briefs, product R27–R34 ownership and 30/60/90-day review gates.

[Organic growth audit and roadmap](reports/Inbox%20Cleaner%20organic%20growth.md) — technical and content findings, authenticated Search Console baseline, 15 page/tool briefs, and a low-budget 30/60/90-day plan, researched 17 October 2026. The [47-page content inventory](research_notes/Inbox%20Cleaner%20organic%20growth/content-inventory.csv) is the URL-level backlog. These are recommendations; the live site and publishing schedule are unchanged.

## Analytics intelligence

[Analytics findings and roadmap priorities](reports/2026-10-17-analytics-intelligence.md) — complete available Search Console performance exports, store-linked Google Analytics reports, source-attributed install events, coverage gaps and proposed sequencing, collected 17 October 2026. [Evidence and original exports](research_notes/Analytics%20intelligence%202026-10-17/README.md) remain outside the public site output. The private Chrome Web Store dashboard was blocked in both browser extensions; website conversion and successful Gmail cleanup remain unmeasured.

## Blog publishing

The local LaunchAgent publishes one queued article at **9 AM, 1 PM, 5 PM, and 9 PM IST** (four posts per day). It runs on this Mac while the user is logged in; sleeping or offline time can delay runs. Vercel deploys pushes to `main`.

- Queue: `scripts/blog-topics.json`; each run takes the next pending topic.
- Discovery: `node scripts/build_site.mjs` regenerates the sitemap from actual article files, the complete blog index, homepage guide links, and five related links per article. Vercel runs it on every deployment; `publish_blog.py` runs it on every publish. No hand-maintained article list and no runtime server are needed.
- Conversion: install CTAs point directly to the verified Chrome Web Store listing in `scripts/site-config.json`; the browser app remains a secondary option.
- The publisher requires a clean tracked working tree so it cannot stage unrelated user edits while updating generated links.
- Sitemap dates come from article metadata; repeated builds do not pretend content was updated. A sitemap aids discovery but cannot guarantee Google crawling or indexing.
- Logs: `scripts/daily_publish.log`; failures trigger a macOS notification.
- Git uses HTTPS with the signed-in GitHub CLI credential helper. Claude CLI must also remain signed in.
- Network stalls are bounded, and success requires the selected post to exist on `origin/main`.
- Analytics-led backlog: 197 topics at this release (47 published, 134 pending, 16 deferred), including 64 new briefs. The first pending entry is the next scheduled article; deferred entries are skipped. Counts change as articles publish.
- [Editorial strategy and ChatGPT discovery plan](internal/superpowers/plans/2026-10-17-blog-editorial-strategy.md) explains evidence, ordering, intent owners and the review loop. `scripts/blog-refreshes.json` separately tracks 12 existing-guide refreshes; the new-post job does not execute them.
- Every future draft must read its complete topic brief and verify current sources and a distinct contribution before publication. The queue is finite: review analytics and replenish selectively.

The installed schedule lives at `~/Library/LaunchAgents/com.inboxcleaner.dailyblog.plist`; a copy is versioned at `scripts/com.inboxcleaner.dailyblog.plist`. After editing the copy, install and reload it:

```bash
cp scripts/com.inboxcleaner.dailyblog.plist ~/Library/LaunchAgents/
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.inboxcleaner.dailyblog.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.inboxcleaner.dailyblog.plist
```

## Privacy

**Chrome extension:**
- **No API, no OAuth** — the content script reads sender/date directly off Gmail's own rendered page inside your browser; nothing is sent anywhere
- **Local cache** — scan results live in `chrome.storage.local` on your device
- **Trash, not delete** — emails go to Gmail Trash and stay there 30 days before auto-purge; you can restore them any time

**Web app:** all API calls go directly from your browser to `gmail.googleapis.com`; only `From`/`Date` headers are read.

[Full privacy policy →](https://inbox-cleaner.vercel.app/privacy.html)

---

## Chrome Extension setup

1. Clone or download this repo
2. Open `chrome://extensions` → enable **Developer mode** (top right)
3. **Load unpacked** → select the repo root folder (not `docs/`)
4. Click the 📥 icon in your Chrome toolbar

No sign-in step — the extension reads whichever Gmail tab you already have open.

---

## Tech stack

| Layer | Detail |
|-------|--------|
| Auth (web app) | Google Identity Services `initTokenClient` — token flow, no backend |
| Auth (extension) | None — content script reads the page you're already signed into |
| Scan (extension) | Content-script DOM automation — Gmail's `category:` search operator + auto-scroll |
| Trash (extension) | Gmail's native "select all conversations that match this search" bulk action |
| Storage | `localStorage` (web) · `chrome.storage.local` (extension) |
| Framework | None — vanilla JS, zero dependencies, zero build step |

---

## Folder structure

```
inbox-cleaner/
├── docs/               ← Web app (GitHub Pages)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── privacy.html
├── content.js          ← Extension content script (Gmail DOM automation)
├── parsing.js          ← Pure parsing/aggregation logic (shared with test/)
├── popup.html          ← Extension popup
├── popup.css
├── popup.js
├── manifest.json       ← Manifest V3
├── test/               ← Node built-in test runner (`node --test`)
└── icons/
```

---

## Known limitations

- **Sender discovery reflects Gmail's category tabs** — the scan walks Primary/Social/Promotions/Updates/Forums, paginating each to the end. A sender who appears in none of those tabs will not be discovered.
- **Only the 250 heaviest senders get an exact count** (`MAX_SENDERS_TO_COUNT` in `content.js`). Those show the true All Mail total — the same scope delete uses, so the number shown is the number trashed. The remaining long tail keeps its sampled count, renders with a `~`, and can still under-report what delete removes.
- **One scan supports 10,000+ conversations** — the extension follows Gmail's Older control until the final page, even when the result counter is unavailable. An unresponsive page produces an incomplete-scan error rather than silently reporting success. The safety guard is 500 pages per category (up to 50,000 conversations per category at Gmail's 100-per-page setting).
- **A full scan takes minutes, not seconds** — it paginates the whole mailbox and then runs one search per counted sender. This is the cost of the DOM-automation architecture; the old Gmail API path did it in ~20 batched calls but required OAuth verification.
- **The scan/delete flow depends on Gmail's DOM structure** and may need selector updates if Gmail changes its markup — see the `SELECTORS` object in `content.js`.
- **English Gmail UI only** — selectors may not match other locales.

---

## Contributing

PRs welcome. Useful areas:

- **Virtual scrolling** for large sender lists (10k+ unique senders)
- **Undo snackbar** — surface a Restore button after trashing, valid for the session

---

## License

MIT
