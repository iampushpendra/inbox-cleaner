# 📥 Inbox Cleaner

**See which senders fill your Gmail. Select senders, review the sender-wide scope, then confirm a move to Trash.**

[![Live App](https://img.shields.io/badge/Live%20App-open-blue?style=flat-square)](https://inbox-cleaner.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Current version: 3.3.2** — complete SEO execution plan and status reconciliation; extension runtime remains 3.3.1. See [CHANGELOG.md](CHANGELOG.md) for what's new.

---

## What it does

Inbox Cleaner discovers senders by paginating **five Gmail categories** — Primary, Social, Promotions, Updates and Forums — and ranks discovered senders by conversation/result counts. Those counts do not measure storage:

- **Conversation/result count** per sender (color-coded: red ≥100, orange ≥50)
- **Category badges** showing which Gmail tab their mail lands in
- **Last received** — relative timestamp of most recent email
- **Checkbox selection** — pick one sender or dozens at once
- **Confirmed sender-wide Trash** — select senders, review the scope, then confirm. The extension navigates Gmail once per batch of up to 20 senders. Separate search exclusions are not inherited.

The extension has no independent network client or backend; Gmail itself remains an online service. Scan results are cached locally. Website hosting, optional browser-app authentication and any waitlist submission are separate surfaces.

---

## Try it

**[→ Visit Inbox Cleaner](https://inbox-cleaner.vercel.app/)** — extension setup, guides and local tools. The legacy OAuth browser flow is an optional separate route, with its own access limitations.

Install the [Chrome extension](https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep), or see [Extension setup](#chrome-extension-setup) for local development.

---

## How it works

**Chrome extension** (this repo's `manifest.json`/`content.js`/`popup.js`) — no OAuth, no API, no backend:

```
Open Gmail in a tab
       │
       ▼
Content script navigates category:primary / social / promotions / updates / forums
  Paginates category results with page guards, reading sender + date off each row
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

[Complete SEO completion plan](internal/superpowers/plans/2026-10-26-seo-completion-plan.md) — current blockers, ten executable work packages, ownership, dependencies, access gates and 28/56/84-day review criteria.

[Historical SEO roadmap and delivery backlog](internal/superpowers/plans/2026-10-17-seo-roadmap.md) — SEO-01–SEO-09 tasks, all 15 audit briefs, product R27–R34 ownership and 30/60/90-day review gates.

[Organic growth audit and roadmap](reports/Inbox%20Cleaner%20organic%20growth.md) — technical and content findings, authenticated Search Console baseline, 15 page/tool briefs, and a low-budget 30/60/90-day plan, researched 17 October 2026. The [47-page content inventory](research_notes/Inbox%20Cleaner%20organic%20growth/content-inventory.csv) is the URL-level backlog. The audit is the historical baseline; use the delivery status and current roadmap for implemented work and remaining evidence dependencies.

## Analytics intelligence

[Analytics findings and roadmap priorities](reports/2026-10-17-analytics-intelligence.md) — complete available Search Console performance exports, store-linked Google Analytics reports, source-attributed install events, coverage gaps and proposed sequencing, collected 17 October 2026. [Evidence and original exports](research_notes/Analytics%20intelligence%202026-10-17/README.md) remain outside the public site output. The private Chrome Web Store dashboard was blocked in both browser extensions; website conversion and successful Gmail cleanup remain unmeasured.

## Blog publishing

The local LaunchAgent runs editorial jobs at **9 AM, 1 PM, 5 PM, and 9 PM IST**. A run publishes a reviewed ready topic, or prepares an unreviewed draft outside the deployed site; four runs do not guarantee four publications. It runs on this Mac while the user is logged in; sleeping or offline time can delay runs. Vercel deploys pushes to `main`.

- Queue: `scripts/blog-topics.json`; selection prefers the next pending topic with valid reviewed readiness. Otherwise it drafts an unprepared topic; existing drafts wait for a separate substantive readiness review.
- Discovery: `node scripts/build_site.mjs` regenerates the sitemap from actual article files, the complete blog index, homepage guide links, and five related links per article. Vercel runs it on every deployment; `publish_blog.py` runs it on every publish. No hand-maintained article list and no runtime server are needed.
- Conversion: install CTAs point directly to the verified Chrome Web Store listing in `scripts/site-config.json`; the browser app remains a secondary option.
- The publisher requires a clean tracked working tree so it cannot stage unrelated user edits while updating generated links.
- Sitemap dates come from article metadata; repeated builds do not pretend content was updated. A sitemap aids discovery but cannot guarantee Google crawling or indexing.
- Logs: `scripts/daily_publish.log`; failures trigger a macOS notification.
- Git uses HTTPS with the signed-in GitHub CLI credential helper. Claude CLI must also remain signed in.
- Network stalls are bounded, and success requires the selected post to exist on `origin/main`.
- The analytics-led backlog includes 64 new briefs. Deferred overlaps are skipped; queue counts change as articles publish. `scripts/content-records.json` stores evidence, reviewer identity, scope, limitations and the exact reviewed authored-post fingerprint.
- [Editorial strategy and ChatGPT discovery plan](internal/superpowers/plans/2026-10-17-blog-editorial-strategy.md) explains evidence, ordering, intent owners and the review loop. `scripts/blog-refreshes.json` separately tracks 12 existing-guide refreshes; the new-post job does not execute them.
- Every future draft must read its complete topic brief and verify current sources and a distinct contribution. Readiness is a separate review; drafting cannot grant itself publication approval. The deployment build also rejects unreviewed new articles.
- [Growth scorecard](reports/organic-growth-scorecard.md) is reproducible with `python3 scripts/growth_scorecard.py`. Website clicks, store installs and activation remain separate; missing inputs remain unknown.
- [Delivery ledger](internal/superpowers/plans/2026-10-17-seo-delivery-progress.md) records implementation, checks and unresolved external evidence.

The installed schedule lives at `~/Library/LaunchAgents/com.inboxcleaner.dailyblog.plist`; a copy is versioned at `scripts/com.inboxcleaner.dailyblog.plist`. After editing the copy, install and reload it:

```bash
cp scripts/com.inboxcleaner.dailyblog.plist ~/Library/LaunchAgents/
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.inboxcleaner.dailyblog.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.inboxcleaner.dailyblog.plist
```

## Local cleanup tools

- [Gmail search builder and checker](https://inbox-cleaner.vercel.app/tools/gmail-cleanup-search-builder/) — manual sender/category/date/size criteria, editable query, static checks and an explicit Gmail search handoff. It never selects or deletes mail.
- [Storage troubleshooter](https://inbox-cleaner.vercel.app/tools/gmail-storage-troubleshooter/) — enter optional quota figures and a symptom for scoped next steps. No account scan or reclaimed-space estimate.

Inputs stay in page memory and are not saved to the tool URL, local storage or analytics. Opening a chosen query in Gmail sends it to Google; Copy puts it on the clipboard.

## Privacy

**Chrome extension:**
- **No extension API or OAuth client** — the content script reads rendered sender/date information and operates Gmail’s interface; it makes no independent network requests
- **Local cache** — scan results live in `chrome.storage.local` on your device
- **Trash recovery** — ordinary mail can normally be restored for up to 30 days unless permanently removed sooner. The extension has no separate one-click Undo.

**Web app:** all API calls go directly from your browser to `gmail.googleapis.com`; only `From`/`Date` headers are read.

[Full privacy policy →](https://inbox-cleaner.vercel.app/privacy.html)

---

## Chrome Extension setup

1. Clone or download this repo
2. Open `chrome://extensions` → enable **Developer mode** (top right)
3. **Load unpacked** → select the repo root folder (not `docs/`)
4. Click the 📥 icon in your Chrome toolbar

**Updating an existing unpacked installation:** replace its files with the new package (or keep using this repo folder), click **Reload** on Inbox Cleaner at `chrome://extensions`, then **reload the Gmail tab** before clicking the extension's Refresh button. Chrome does not replace content scripts already running in an open Gmail tab when the extension is updated. The new package is `inbox-cleaner-extension-3.3.1.zip`.

No sign-in step — the extension reads whichever Gmail tab you already have open.

---

## Tech stack

| Layer | Detail |
|-------|--------|
| Auth (web app) | Google Identity Services `initTokenClient` — token flow, no backend |
| Auth (extension) | None — content script reads the page you're already signed into |
| Scan (extension) | Content-script DOM automation — category searches and Gmail pagination |
| Trash (extension) | Gmail's native "select all conversations that match this search" bulk action |
| Storage | `localStorage` (web) · `chrome.storage.local` (extension) |
| Framework | None — vanilla JS; static discovery build with Node, Python publishing gate |

---

## Folder structure

```
inbox-cleaner/
├── docs/               ← Static website (Vercel), guides and local tools
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
- **Result counts are bounded and may overlap.** Up to the top 250 discovered senders are counted from Gmail search results when resolvable. Other or unresolved counts are estimates. Conversations can contain several senders, so summing sender counts is not a unique-message, deletion-outcome or storage guarantee.
- **One scan supports 10,000+ conversations** — the extension follows Gmail's Older control until the final page, even when the result counter is unavailable. An unresponsive page produces an incomplete-scan error rather than silently reporting success. The safety guard is 500 pages per category (up to 50,000 conversations per category at Gmail's 100-per-page setting).
- **Scan duration varies** — it paginates category views and then runs searches per counted sender. Fixture tests do not establish live performance or installed-package reliability.
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
