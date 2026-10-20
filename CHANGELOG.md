# Changelog

All notable changes to this project are documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: see `VERSION` file (semver, no `package.json` — this isn't a Node/build project).

## [Unreleased]

### Changed — consolidated 12 near-duplicate guides

- Retired 12 blog URLs that were near-duplicates of a stronger page. Each was measured before the decision: 574–598 words (the site's thinnest pages are shorter and *are* indexed, so length was never the problem), 0.69–0.80 paragraph overlap with its cluster, and zero impressions in both the 16-month and 3-month Search Console exports. Every URL gets a permanent redirect, so nothing 404s and the change is reversible.
- Merges: facebook/instagram/linkedin/twitter-x notification recipes into `gmail-delete-social-media-notifications`; google-alerts and calendar-invite recipes into `delete-all-emails-from-one-sender-gmail`; `gmail-bulk-delete-by-sender` and `gmail-delete-all-emails-from-multiple-senders` into `how-to-bulk-delete-gmail-emails`; `how-to-delete-thousands-of-emails-gmail` into `how-to-mass-delete-emails-gmail`; `clean-up-gmail-inbox` into `best-way-to-clean-gmail-2026`; `gmail-storage-full-how-to-fix` and `gmail-storage-almost-full-what-to-do` into `how-to-free-up-gmail-storage`.
- Unique material was carried into each owner rather than dropped: the four services' sender guidance, the `.ics` and Google Alerts caveats, the grouped `{}` OR syntax, the scope-first batching advice, the staged-cleanup framing, and the almost-full versus fully-full distinction.
- Four of the sixteen reviewed pages were deliberately kept because they serve a distinct job: the search-operator reference, the Gmail-versus-Outlook comparison, and the incoming-filter guide. A similar length was never treated as evidence for a merge.
- The sitemap regenerated to 44 URLs and the publishing gate reports no broken local links. Decision driven by page-level overlap and impressions; no backlink export was available, which remains a stated limit.

### Fixed

- The site build appended another duplicate `og:title`/`og:description` pair to every article on every rebuild, so live pages were already serving six copies and growing. Generated tags were re-collected as if they were authored. The social region now reads the authored head with its previous region removed, and emits only what pages lack (image and Twitter card), restoring an idempotent build and one tag per page.

### Extension — manifest 3.2.1 → 3.2.2

- Fixed a silent truncation that cut any large mailbox down to its first screenful. The scan loop treated "no Older button" as the end of a category, which is only true of Gmail's paginated list; Gmail's newer view infinite-scrolls with no Older button and no "1-100 of N" counter, so both the pagination branch and its missing-controls guard fell through and the partial result was cached as a complete scan. A reported 237 conversations is 5 categories × ~47 initially-rendered rows, nowhere near the 50,000-conversation page guard. The walk now keeps scrolling until the list genuinely stops growing, counts conversations from the dedupe set rather than recounting accumulated rows, and throws an incomplete-scan error when a stalled list still claims more pages. Covered by three regression tests including an 18,000-conversation infinite scroll walked exactly once.
- Recorded the deletion-verification work that shipped in release 3.3.0 without a manifest bump or changelog entry: an explicit `unverified` deletion state instead of reporting a chunk Gmail left in place as complete, page-qualified thread ids so positional-only rows survive pagination, address normalization so duplicate and mixed-case senders in one DELETE are actioned once, and rejection of a DELETE arriving while one is already running. The manifest description also changed to "Select senders, then confirm to move all their mail to Trash".
- Permissions are unchanged at `storage`, `tabs` and host access to `https://mail.google.com/*`. Package rebuilt and verified file-by-file against source. Verified against a synthetic infinite-scroll harness, not a live mailbox.

### Open item — published listing does not match this package

- The live Chrome Web Store listing shows version 3.2.1 with permissions `identity`, `gmail.readonly` and `gmail.modify`, plus OAuth-era copy ("one click", "nothing is ever sent anywhere except directly to Google's Gmail API"). This package declares only `storage`, `tabs` and the `mail.google.com` host permission. Chrome derives a listing's permission block from the uploaded package, so the published build appears to be the retired OAuth/Gmail-API extension rather than the DOM-automation build. The listing text, permission justifications and privacy disclosures need review before any submission; the linked privacy policy is current. This has not been confirmed against the Developer Dashboard, which was not accessible.

### Added
- Mobile-native Gmail handoff on the mailbox-full, biggest-email, bulk-delete, one-sender and older-than-year guides, which had no mobile path at all despite the extension requiring desktop Chrome. Each section is task-specific and sourced from Google's Android deletion documentation, re-fetched for this change: touch and hold, the box next to "Select all", up to 50 messages selected by default with more added by scrolling to the top, and search operators usable in the app search bar. The 50-message figure is stated as the Android app's select-all default rather than a mailbox or desktop limit, and iPhone/iPad controls are named as unreviewed.
- A reproducible synthetic native-vs-extension cleanup task. It runs the shipped sender-grouping logic from `parsing.js` over a seeded generated mailbox and records what each scope actually removes. Recorded findings from seed 20261018 over 2,000 conversations and 2,675 messages: native selection removes 1,045 conversations of which 323 contain at least one message failing the query; the sender-wide action reaches 396 conversations the modelled query would never return; and all five chosen senders are touched by more conversations than the scan attributed to them, because the scan reads the sender Gmail displays on a row while the `from:` action matches that sender anywhere in a conversation. No mailbox is connected and nothing is deleted. Harness timings are recorded but labelled as in-memory measurements, not a benchmark.

### Changed
- The acquisition scorecard now reports the device and country dimension exports that were already collected but never read, records the preserved export filters with the weekly replace-and-keep procedure, and counts verified editorial coverage by evidence-record state instead of article totals. A published article with no reviewed record, and a reviewed record with no article, are now surfaced as contradictions to fix. Blank or uncollected cells stay Unknown; no window is force-reconciled with the adjacent 28-day rows. Mobile holds a better approximate position and CTR than desktop in the current export, which is recorded as the editorial reason the mobile handoff exists.

### Documentation
- Integrated the organic-growth audit into product tasks R27–R34 and a current SEO roadmap with SEO-01–SEO-09, all 15 page/tool briefs, analytics boundaries, dependencies and acceptance gates. Marked older SEO plans as historical and synchronized the product roadmap reading edition.
- Added 14 open analytics-backed SEO roadmap subtasks with priorities, evidence, dependencies and completion criteria; linked product-safety work to its existing roadmap and added a bounded ChatGPT-source acquisition experiment.
- Added authenticated analytics intelligence and an evidence-backed ordering of the existing product/content roadmaps, including complete available Search Console exports, GA source/install reports and explicit collection limits. Private Web Store dashboard access was blocked in both Kimi and the ChatGPT Chrome extension.
- Added an organic-growth audit covering 50 live sitemap URLs, all 47 articles, product-claim consistency, a transcribed authenticated Search Console baseline, and a prioritized low-budget page/tool roadmap.
- Added a complete URL-level content inventory and reproducible provenance for the installed SEO audit, content strategy and programmatic SEO skills. No application, production or publishing schedule changes.

## [3.3.1] - 2026-10-21

### Fixed — extension Refresh

- Inspected the failing Gmail view directly: its enabled Older button carries `T-I-Js-Gs` with no `aria-disabled`; only Newer is disabled. The scanner incorrectly rejected Older because of that CSS class, then fell into scrolling and failed with “Gmail reports more pages but this view stopped loading rows.” Enabled controls now use semantic disabled attributes.
- Read only visible conversation rows, visible toolbars and visible range counters. Live Gmail retained 100 rows with only 50 visible; old hidden results must not contaminate sender counts or give every sender all five category badges.
- Read stable thread IDs from descendant spans, where this Gmail layout places them, before falling back to page-qualified row IDs.
- Wait for the search input and a changed or replaced visible result list before accepting category or sender-count searches. Trim Gmail's trailing search whitespace. Retained empty-result notices cannot skip the next category; identical conversations rendered for a new query can still produce exact counts. Search failures preserve the previous complete cache.
- Synchronized the extension manifest and project version at 3.3.1. Updating requires reloading the extension **and the Gmail tab** so the old content script is replaced. Packaged permissions remain unchanged.

### Validation

- Confirmed the live Older control advances Gmail from 1–50 to 51–100, then restored page one. Inspected actual hidden rows, nested thread IDs, counter markup and empty-search markup. No messages were selected or deleted.
- Extension/parser regressions cover 10,000-conversation pagination, 18,000-conversation scrolling, full Refresh over five categories, delayed/identical results, empty views, cache preservation and deletion safeguards. A rendered Chrome fixture with the actual content script also completed all 600 synthetic conversations across five categories.
- Full repository checks retain one unrelated failing test: `the publishing command generates discovery links before marking a queued post published` (`test/site.test.js`), whose publisher fixture lacks the two linked tool pages. No full live-mailbox scan or installed-package upgrade has been claimed.

## [3.3.0] - 2026-10-17

### Added
- Two local tools: a Gmail sender/category/age/date/size search builder with editable checking, Copy and explicit Gmail handoff; and a manual storage troubleshooter with unknown/zero/partial/over-quota and service-specific decisions. No mailbox access, deletion, input storage or telemetry.
- Canonical tool discovery from an exact asset manifest, with sitemap/homepage/hub links and deployment rejection of unlisted files.
- Source-reviewed setup/permissions/recovery and native Gmail comparison guides, four labeled synthetic evidence models, unsent distribution drafts and a reproducible acquisition scorecard. Added a16-second silent tool showcase with real local screenshots and explicit synthetic-input disclosures.
- Content evidence records tied to manifest version, substantive source-review notes, actual agent/human reviewer identity and the reviewed HTML fingerprint. New articles remain gated after publication; the original 49-URL inventory is an explicit historical exemption.

### Changed
- Completed the remaining seven priority refreshes and source-reviewed all 49 original guide URLs; corrected 44 existing articles, homepage/privacy/prepared store copy, scope/count/recovery claims and five cleanup journeys. Preserved original URLs/publication dates and left unsupported merges deferred.
- Editorial jobs publish only reviewed ready articles. Otherwise they draft HTML and evidence sidecars outside deployed output, move to the next undrafted topic, and wait quietly when review is needed. The four-run schedule is unchanged; four runs do not imply four publications.
- Static deployment also rejects unreviewed new articles. Generated discovery does not mutate reviewed authored content or invalidate its fingerprint. Exact-slug canonicals are enforced.
- Clarified source/static review versus synthetic models, real installed/Gmail/competitor tests and future analytics outcomes. External gates remain explicitly open; no ranking, citation or reclaimed-storage guarantees. Extension runtime remains 3.2.1.

### Verification
- Independent code and content review; 68 Node tests and 21 Python tests passed. Both tools exercised in the local browser using synthetic inputs; no real-mail action. Rebuild is stable and local links resolve. Live deployment checks are recorded in the delivery ledger.

## [3.2.5] - 2026-10-17

### Changed
- Rewrote the five highest-priority guide refreshes: selecting all mail, deleting by size, mailbox full/cannot receive, finding biggest messages, and deleting mail older than a year. Added direct answers, scoped decision tables, primary-source references, matching HowTo/FAQ schema, contextual links and accurate sender-wide extension limitations.
- Removed unsupported speed/storage promises, universal 50-message desktop limits, guaranteed starred-mail protection and instant quota/upgrade claims. Clarified Google One permanent deletion versus ordinary Gmail Trash, native Android multi-selection and mixed-conversation search behavior.
- Marked five briefs as content-refreshed while retaining live-mailbox/screenshots and post-recrawl performance checks as unperformed. Preserved original publication dates and all article URLs. Added keyboard-accessible horizontal scrolling for article tables. Extension runtime and publishing cadence are unchanged.

## [3.2.4] - 2026-10-17

### Changed
- Refined the blog backlog around the October 17 analytics: added 64 distinct candidate briefs, reordered the next 20 jobs, attached query/page provenance and linking/intent metadata, and deferred 16 overlapping or unsupported topics. Reconciled the already-published GitHub guide; 134 new-post briefs remain pending.
- Strengthened future drafting guidance for ChatGPT discovery with self-contained answers, primary-source checks, a distinct-contribution review, truthful extension scope, transparent comparisons and no fixed word/FAQ quotas. No ranking or citation guarantees.

### Added
- Separate refresh briefs for 12 exposed existing guides and an editorial strategy documenting query clusters, ChatGPT store-attribution limits and the measurement review loop. Existing articles and publishing cadence are unchanged; extension runtime remains 3.2.1.

## [3.2.3] - 2026-10-17

### Added
- Added a competitor-informed product roadmap with 26 proposed tasks, release gates, dependencies, acceptance criteria, model types, exact Codex model/effort assignments and review ownership.
- Added an HTML reading edition and explicit coverage of deferred and feasibility-gated features.

### Documentation
- Linked the roadmap from README. Documentation-only release; extension runtime and manifest remain at 3.2.1.

## [3.2.2] - 2026-10-17

### Added
- Added an extensive competitor research report covering 26 identified inbox-cleaner extension identities, seven detailed teardowns, adjacent services, onboarding, visual and CTA analysis, source evidence and prioritized recommendations.
- Retained official screenshot evidence and research notes, with clear distinctions between public screenshots, documented behavior, local source observations and untested authenticated flows.

### Documentation
- Linked the research report from README. This is a documentation-only release; extension runtime and manifest remain at 3.2.1, with no application code changes.

## [3.2.1] - 2026-10-16

### Fixed
- Extension scanning no longer stops on page one when Gmail's result counter is missing. It follows the enabled Older control and waits for conversation rows to change, allowing a single scan of 10,000+ conversations.
- Hidden or disabled pagination controls are ignored. Missing controls, stalled pages, and the page safety limit now report an incomplete scan rather than silently caching a partial success.
- Added runnable content-script regression checks for 10,000 conversations with and without the counter, plus stalled pagination. No dependencies or new permissions were added.

## [3.2.0] - 2026-10-16

### Added
- Automatic site generation on every Vercel build and blog publish: sitemap, complete blog index, homepage guides, and five related links per article. The article files are the source of truth; deleted URLs disappear and duplicate sitemap entries cannot accumulate.
- Direct Chrome Web Store install buttons on the homepage, blog index, and every existing and future article. The verified listing URL lives in `scripts/site-config.json`.
- Regression coverage for new/deleted posts, preserved article dates, complete internal linking, installation destinations, repeat builds, and scheduled publishing with user edits.

### Fixed
- The blog index exposed only 10 of the 46 articles. All articles now have incoming links from the hub and other posts, plus routes to the homepage and the extension listing.
- Scheduled publishing stops on tracked working-tree edits before generating or staging site updates.
- Homepage installation copy and primary actions now match the Chrome extension funnel; the browser version remains available as a secondary action.

## [3.1.1] - 2026-10-16

### Fixed
- Daily blog publisher now uses repository-local HTTPS authentication through GitHub CLI to avoid repeated SSH disconnects. Git runs without interactive credential prompts and bounds stalled network transfers.
- Publishing success is verified against `origin/main`, rather than relying only on the Claude CLI exit code.

### Changed
- Doubled the local blog schedule from two to four posts per day: 09:00, 13:00, 17:00, and 21:00 IST. Added a versioned copy of the LaunchAgent configuration.
- Documented the schedule, authentication dependencies, finite topic queue, and log location.

## [3.1.0] - 2026-09-13

### Fixed
- **The scan only ever read the first page of each category.** `scrollUntilStable()`
  assumed Gmail's conversation list infinitely scrolls; it paginates. Scrolling hit
  the bottom of page 1, the row count stopped changing, and the scan moved on — so
  every scan returned at most (categories x page size) conversations regardless of
  mailbox size. On a 10k+ mailbox at Gmail's 100-per-page maximum that was a fixed
  500-conversation ceiling, about 5% of the inbox. The scan now clicks through
  Older to the end of each category.
- **Sender counts understated what delete would actually remove.** Counts came from
  that page-1 sample while delete runs `from:` across All Mail, so the popup could
  show a sender at 23 and trash 800. Counts are now read from Gmail's own result
  counter over the same All Mail scope the delete uses.

### Added
- Two-phase scan: phase A paginates each category to discover senders, phase B runs
  one `from:` search per sender and reads the exact total off Gmail's result counter
  (O(senders) rather than O(emails)).
- `parseResultRange` / `hasMorePages` / `buildSenderQuery` / `applyExactCounts` in
  `parsing.js`, with 14 new tests. `parseResultRange` handles en-dash and ASCII
  separators, Western and Indian digit grouping, non-breaking spaces, and Gmail's
  estimated "of many" totals.
- Counts that could not be resolved exactly render with a `~` prefix and an
  explanatory tooltip; the delete confirmation states an exact number when every
  selected sender is exact and keeps saying "at least" otherwise.
- Progress now reports both phases ("Scanning category 2 of 5", "Counting sender
  37 of 250") with the category page or sender in flight.

### Changed
- A full scan is now minutes rather than seconds — it is bounded by the mailbox,
  not by one page. Phase B is capped at the 250 heaviest senders (`MAX_SENDERS_TO_COUNT`);
  the long tail keeps its sampled count and is flagged inexact.
- Pagination reads Gmail's result counter by text match rather than class name, so a
  Gmail CSS reshuffle degrades to "stop early" instead of breaking.
- Removed `scrollUntilStable` / `SCROLL_STABLE_LIMIT`; a single adaptive scroll now
  fires only when a page renders fewer rows than its own counter claims.

## [3.0.0] - 2026-09-06

### Changed
- **Breaking:** replaced the Gmail API + OAuth architecture (`chrome.identity`, `gmail.readonly`/`gmail.modify` scopes, `background.js` service worker) with a content script (`content.js`/`parsing.js`) that automates the live Gmail web UI directly on `mail.google.com`. This eliminates Google's restricted-scope OAuth "unverified app" verification wall, which was blocking every real user except the developer/test accounts from signing in. Scanning is slower (renders and scrolls each category instead of batched API calls) and depends on Gmail's DOM staying stable, but requires no OAuth consent screen at all.
- Extension now requires a `mail.google.com` tab to already be open — it does not auto-open one.

### Fixed
- `manifest.json` `version` was stuck at `1.0.0` while the app/README/CHANGELOG had moved to `2.1.0` — fixed to keep the extension zip in sync with the rest of the project before Chrome Web Store submission.
- `scripts/daily_publish.sh` used `set -e` with no failure signal — a failed run (expired `claude` CLI auth on 2026-09-01, dropped SSH connection on 2026-09-02) just stopped silently with nothing but a log line nobody was watching. Now each step is checked explicitly and a macOS notification fires on failure, with a hint to re-run `claude` interactively if the auth session expired.

### Added
- `internal/CHROME_WEB_STORE.md` — draft Web Store listing copy, permission-justification answers, and pre-submission checklist.

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
