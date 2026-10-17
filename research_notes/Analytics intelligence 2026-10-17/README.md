# Analytics evidence — 17 October 2026

Collected through authenticated Kimi browser UI. The ChatGPT Chrome extension was also tried for the protected Web Store developer dashboard and refused both known dashboard addresses. Public listing metadata was independently checked through the official listing. No dashboard/API settings, mailbox state or production files were changed during collection.

## Authoritative downloads

- `gsc-full-history.xlsx`: Search Console's maximum available window, filter “Last 16 months”; actual chart data June 27–October 14, 2026. All seven workbook sheets retained. `gsc-full-history/` contains faithful CSV extractions of each sheet: chart, queries, pages, countries, devices, search appearance and filters.
- `gsc-last-3-months.xlsx`: July 15–October 14, 2026, with the same sheets and CSV directory structure.
- `gsc-summary.json`: computed counts, totals, comparison windows and selected records. CTR is clicks divided by impressions; aggregate position is an approximation from rounded exported daily averages weighted by impressions.
- `ga-90d-*.csv`: GA's original CSVs, including their account/property labels and date headers. July 19–October 16, 2026; reporting time zone Los Angeles. Source/medium, first-user acquisition, events, pages, countries and browsers.
- `ga-90d-install-events-by-source.csv` is a separate export with the Event count column filtered to `install`; the ordinary source/medium export includes all events. The UI capture records the filter explicitly. Its rows attribute four install events to ChatGPT and one each to direct/shared-item traffic.
- `ga-year-to-date-snapshot.csv`: January 1–October 17, 2026, including partial current-day data. Multiple sections; not a single rectangular table. Do not add this to the overlapping 90-day window.

Search Console totals from Chart, Countries and Devices reconcile to 22 clicks and 3,552 impressions for full history. Query export contains 628 disclosed rows, 1 click and 1,529 impressions; omitted/anonymized queries mean it is not a complete list of user searches. Page export has 29 rows, 22 clicks and 3,567 impressions; page and property impression aggregation can differ. Do not force it to equal the chart by deleting records.

## UI evidence

`ui-index.json` maps readable labels to source URLs and sanitized capture files in `ui-evidence/`. Captures preserve the accessibility tree and reported text. Account email text and transient element references are removed; no cookies, auth tokens, request headers or mailbox content are retained. A capture is evidence of the report state at collection, not an atomic database snapshot. Empty cards and restricted reports do not establish absent activity.

The complete GSC performance exports supersede any partial accessibility-table capture. Indexing/sitemap/Crawl Stats update dates differ and must remain attached to their respective observations. Earlier GA UI captures show 25 views / 21 sessions / 67 events; final 90-day downloads show 27 / 22 / 70. Preserve that processing/snapshot drift rather than treating the captures as independent cohorts.

Public listing checked 17 October: version 3.2.1, updated October 16, 5 users, no ratings; description still mentions API/OAuth and the old website. Source: https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep . The user badge is not an install/uninstall or active-user report.

## Gaps

Private Web Store impressions, installations/uninstallations, active users, detailed acquisition and version adoption were not accessible. The visible GA property is specifically the Chrome Web Store property; no website stream was found there. Other Google identities, hosting analytics, GSC SafeSearch filtering, per-URL inspections, GA saved explorations and advertising settings were not audited. The report does not claim every analytics tab or every possible filter combination was collected.

These files contain private business analytics. They are research artifacts outside `docs/`, not public-site content; do not deploy or publish them as website assets without a deliberate sharing decision.
