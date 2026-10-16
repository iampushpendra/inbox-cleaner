# Blog discovery and extension conversion implementation plan

**Goal:** Automatically expose every article to crawlers and readers, and route installation actions to the verified Chrome Web Store listing.

**Architecture:** A dependency-free Node build scans article HTML and generates the sitemap, complete blog index, homepage guide section, related-article sections, and consistent extension CTAs. Run it both from the publishing script and at every Vercel build. Keep crawlable links in HTML, preserve article text and dates, and retain the browser tool as a secondary option.

**Destination:** https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep

**Constraints:** Preserve current visual style and working browser tool. Do not promise indexing. Do not publish secrets or overwrite unrelated work. Maintain semver and commit completed changes.

- [x] Test new/deleted article discovery, accurate dates, sitemap uniqueness, related links without self-links, full index coverage, direct install destinations, and idempotent rebuilds using temporary fixtures.
- [x] Implement `scripts/build_site.mjs` and shared site configuration. Generate marked HTML regions and normalize installation CTAs.
- [x] Integrate with Vercel and the daily publisher; guard against tracked user edits before scheduled publishing and stage generated article links explicitly.
- [x] Backfill all articles, add homepage guide links, update content instructions, README, CHANGELOG, and version.
- [x] Run tests, check the full internal-link graph, inspect desktop/mobile, commit and push, then verify deployed sitemap/index/CTAs. Deployment verification follows the commit.

**Review focus:** Never invent URLs or refresh article dates merely on rebuild. Removed posts must leave the sitemap and generated links. Every post needs incoming links, a route home, a route to the blog hub, and an extension CTA. Future posts must work without hand-editing link lists.
