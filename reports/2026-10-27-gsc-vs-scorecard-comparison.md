# GSC snapshot vs scorecard comparison — 2026-10-27 (after authorization)

**No new analytics export produced.** User selected: compare existing windows (no new analytics). No GSC CSV exported. No new search-click window collected. The comparison uses the existing scorecard windows and the GSC property snapshot from the browser session (`inbox-cleaner-evidence`, 2026-10-27).

**Scorecard windows (existing, unchanged):**
- Previous: 2026-08-20 → 2026-09-16 (28 days): 4 clicks / 1307 impressions / 0.306% CTR / approx pos 33.00
- Latest: 2026-09-17 → 2026-10-14 (28 days): 13 clicks / 1847 impressions / 0.704% CTR / approx pos 14.96

**GSC property snapshot (2026-10-27, verified resource `https://inbox-cleaner.vercel.app/`):**
- Sitemap `/sitemap.xml`: last update `10/23/26` (after the October 17 release; before the October 26 evidence review; consistent with the deployed `15b77cd` and `13f45fc` candidates).
- Indexing → Pages: 35 Indexed; 10 Not indexed (reasons visible: 9 "Discovered - currently not indexed" + 1 "Page with redirect" + 0 "Crawled - currently not indexed"). This is consistent with the earlier audit's 29 indexed + 16 discovered-not-indexed, updated for the later crawl.
- Indexing → Sitemaps: sitemap visible (no error message).
- Indexing → Removals / Pages / Performance / Insights / URL inspection links: all present (no 404 on page access; only the inspection URL format returned 404, which is a URL-construction issue, not a GSC authorization denial).
- Account verified (user account visible: `pushpendrachampawat@gmail.com`).

**No new 28-day GSC window collected.** The latest scorecard window ends 2026-10-14; the GSC snapshot reflects a crawl/update as of 10/23/26. A proper adjacent 28-day comparison would require a new GSC export for the period after Oct 14, which the user explicitly declined (selected comparison only). A new 28-day observation is not observable yet; the 28-day post-release review (T10 / SEO-09) remains open.

**No citation verification performed** (T09 / SEO-08): authorization granted; session deferred by brief instruction; no ChatGPT/search session started; no fabricated citation evidence.

**No new measurement tracker or analytics event added.** The measurement contract (`internal/superpowers/specs/2026-10-26-acquisition-measurement.md`) remains unimplemented; no website event, extension telemetry, or external post was performed.

**No mailbox mutation performed.** Read-only authorization only; no Trash emptied; no message deleted, restored, or archived by the extension; no synthetic cleanup harness executed against a live mailbox. The synthetic harness (`scripts/synthetic_cleanup_run.mjs`) remains the only reproducible mailbox evidence.

**No competitor trial started.** T08 / SEO-08 comparison remains open; first-hand evidence deferred until a separate authorization.

**Evidence files: `research_notes/SEO completion 2026-10-26/browser-evidence-authorization-2026-10-27.md` (live findings, corrected store version, GSC snapshot description); this file. No fabricated data; no invented GSC inspection results; no invented citation results; no invented mailbox results.**
