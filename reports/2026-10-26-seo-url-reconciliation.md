# SEO URL reconciliation — 26 October 2026

Execution of plan task T03. Checked at **2026-10-26T16:21Z** against the production alias `https://inbox-cleaner.vercel.app`. Raw evidence: `research_notes/SEO completion 2026-10-26/url-checks.json` (73 URLs, 0 problems).

## Candidate versus deployment

| Item | Value |
|---|---|
| Local HEAD during the live check | `6ab560d` (plus uncommitted T01–T03 work) |
| `origin/main` during the live check | `020bb2a` |
| Production deployment | `https://inbox-cleaner-k8861yk2b-2ndincome.vercel.app`, created 2026-10-19 01:13 IST, status Ready |
| Deployed revision | Consistent with `020bb2a` (same minute; Vercel CLI exposes no git SHA metadata) |

The check therefore verified the **currently deployed** candidate, not the local uncommitted fixes. A post-push recheck is required and is recorded in the completion status ledger.

## Local inventory

- 39 article files under `docs/blog/` (plus the hub).
- 2 tool routes with 4 assets, listed in `scripts/tool-pages.json`.
- 44 sitemap URLs: homepage, hub, privacy, 2 tools, 39 articles.
- 12 blog consolidation redirects plus 3 alias redirects in `vercel.json`.
- Queue: 39 published, 12 merged, 130 pending, 18 deferred.

## Consolidation contract

All 12 mappings return a **single 308** to the expected destination, the destination returns **200**, and the owner is **self-canonical** and present in the sitemap. Retired URLs are absent from the sitemap. No mapping chains into another redirect.

| Retired URL | Owner | First | Final |
|---|---|---:|---:|
| `/blog/delete-facebook-notification-emails-gmail.html` | `/blog/gmail-delete-social-media-notifications.html` | 308 | 200 |
| `/blog/delete-instagram-emails-gmail.html` | `/blog/gmail-delete-social-media-notifications.html` | 308 | 200 |
| `/blog/delete-linkedin-notification-emails-gmail.html` | `/blog/gmail-delete-social-media-notifications.html` | 308 | 200 |
| `/blog/delete-twitter-x-notification-emails-gmail.html` | `/blog/gmail-delete-social-media-notifications.html` | 308 | 200 |
| `/blog/delete-google-alerts-emails-gmail.html` | `/blog/delete-all-emails-from-one-sender-gmail.html` | 308 | 200 |
| `/blog/delete-calendar-invite-emails-gmail.html` | `/blog/delete-all-emails-from-one-sender-gmail.html` | 308 | 200 |
| `/blog/gmail-bulk-delete-by-sender.html` | `/blog/how-to-bulk-delete-gmail-emails.html` | 308 | 200 |
| `/blog/gmail-delete-all-emails-from-multiple-senders.html` | `/blog/how-to-bulk-delete-gmail-emails.html` | 308 | 200 |
| `/blog/how-to-delete-thousands-of-emails-gmail.html` | `/blog/how-to-mass-delete-emails-gmail.html` | 308 | 200 |
| `/blog/clean-up-gmail-inbox.html` | `/blog/best-way-to-clean-gmail-2026.html` | 308 | 200 |
| `/blog/gmail-storage-full-how-to-fix.html` | `/blog/how-to-free-up-gmail-storage.html` | 308 | 200 |
| `/blog/gmail-storage-almost-full-what-to-do.html` | `/blog/how-to-free-up-gmail-storage.html` | 308 | 200 |

Unique material from the retired pages is retained in the owners; see `CHANGELOG.md` for the carried-over sections.

## Canonical resources and assets

| Resource | Result |
|---|---|
| All 44 sitemap URLs | 200 |
| Article canonicals | Exact self-canonical, no conflicting `noindex` |
| `/index.html`, `/blog/index.html`, `/privacy` | 308 single hop to `/`, `/blog/`, `/privacy.html`; final 200 |
| `/favicon.ico`, `/og-image.png`, `/robots.txt`, `/llms.txt`, `/style.css` | 200, expected content type |
| `/tools/query-builder.js`, `/tools/query-builder.css` | 200, JavaScript / CSS |
| `/tools/storage-troubleshooter.js`, `/tools/storage-troubleshooter.css` | 200, JavaScript / CSS |
| Both tool pages | 200 and in the sitemap |

## Leakage checks

These private paths all returned **404** on the production host: plan file under `/superpowers/`, this evidence JSON under `/research_notes/`, `/internal/CHROME_WEB_STORE.md`, `/scripts/content-records.json` and the October 18 audit report. The deploy allowlist in `build_site.mjs` is what keeps them out; robots alone would not unpublish a served path.

## Repository checks added

`test/site.test.js` now asserts the real `vercel.json` contract: 12 permanent merges, single hop, no chains, destination exists and is self-canonical, retired URL absent from the sitemap, alias redirects single-hop, plus every internal `href` in every published article resolving. The test fails if a mapping is relaxed, chained, or loses its owner.

## Remaining blockers and limits

- **Search Console URL Inspection** (last crawl, Google vs user canonical) needs authenticated owner access; not available here. No indexing outcome is asserted.
- **Backlink evidence** was not available at merge decision time and is still not collected; mappings are validated for live behavior, not retroactively proven lossless in link equity.
- The deployment revision is inferred from remote HEAD plus deployment timing; Vercel CLI gave no git SHA.
- A post-push live recheck is still required because the verified deployment predates the T01–T03 changes.
