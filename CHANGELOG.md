# Changelog

All notable changes to this project are documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: see `VERSION` file (semver, no `package.json` — this isn't a Node/build project).

## [3.0.0] - 2026-09-06

### Changed
- **Breaking:** replaced the Gmail API + OAuth architecture (`chrome.identity`, `gmail.readonly`/`gmail.modify` scopes, `background.js` service worker) with a content script (`content.js`/`parsing.js`) that automates the live Gmail web UI directly on `mail.google.com`. This eliminates Google's restricted-scope OAuth "unverified app" verification wall, which was blocking every real user except the developer/test accounts from signing in. Scanning is slower (renders and scrolls each category instead of batched API calls) and depends on Gmail's DOM staying stable, but requires no OAuth consent screen at all.
- Extension now requires a `mail.google.com` tab to already be open — it does not auto-open one.

### Fixed
- `manifest.json` `version` was stuck at `1.0.0` while the app/README/CHANGELOG had moved to `2.1.0` — fixed to keep the extension zip in sync with the rest of the project before Chrome Web Store submission.
- `scripts/daily_publish.sh` used `set -e` with no failure signal — a failed run (expired `claude` CLI auth on 2026-09-01, dropped SSH connection on 2026-09-02) just stopped silently with nothing but a log line nobody was watching. Now each step is checked explicitly and a macOS notification fires on failure, with a hint to re-run `claude` interactively if the auth session expired.

### Added
- `docs/CHROME_WEB_STORE.md` — draft Web Store listing copy, permission-justification answers, and pre-submission checklist.

## [2.1.0] - 2026-08-09

### Added
- SEO overhaul on the web app: FAQ section expanded to 12 questions with JSON-LD, Gmail comparison table, featured-snippet hero paragraph, sitemap.xml, og:image meta tag, Google Search Console ownership verification.
- Waitlist form on the landing page.
- Blog content pipeline: `scripts/publish_blog.py`, `scripts/blog-topics.json`, `scripts/blog_prompt.md`, and a 30-day blog series (`docs/blog/`) — first posts published (Reddit-thread-finder script, bulk-delete/inbox-zero/storage guides).
- `find-reddit-threads.py` — Reddit thread discovery script for content/promo research.

### Changed
- Privacy policy corrected to describe `messages.trash`, not `batchDelete` (matches the scope actually used by the web app).

## [2.0.0] - 2026-06-25

### Added
- Full neo-brutalist redesign of the web app: `docs/index.html` (sticky nav, hero, social proof bar, tool section, footer), `docs/style.css` design system with CSS variables, `docs/app.js` section toggling / category filter tabs / sticky action bar.
- Deployed to GitHub Pages from `docs/` — live at https://iampushpendra.github.io/inbox-cleaner/.

### Changed
- Web app now uses `messages.trash` (Trash, reversible) instead of delete; scopes narrowed to `gmail.readonly` + `gmail.modify` (no more full-access `https://mail.google.com/` scope on the web app path).
- Removed dead code: `avatarColor`, `AVATAR_COLORS`, `sortBy`.

### Removed
- Dropped the `inbox-cleaner.is-a.dev` CNAME/subdomain attempt (PR rejected as "not software dev related"; a follow-up PR was submitted but paused).

## [1.0.0] - 2026-06-17

### Added
- Chrome extension (Manifest V3): background service worker (scan + delete), 5-screen popup UI, icons. Initial repo commit.
- Companion web app for GitHub Pages — no install, no Chrome Web Store $5 fee required to try it.

### Fixed
- `messages.batchDelete` requires the `https://mail.google.com/` scope, not just `gmail.modify` — fixed in the extension manifest.
- 403 (permission) errors were being silently retried as rate limits; error reason is now parsed before deciding retry vs. surface-as-auth-error.

[2.1.0]: https://github.com/iampushpendra/inbox-cleaner
[2.0.0]: https://github.com/iampushpendra/inbox-cleaner
[1.0.0]: https://github.com/iampushpendra/inbox-cleaner
