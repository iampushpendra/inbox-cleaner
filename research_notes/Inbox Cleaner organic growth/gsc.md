# Search Console baseline

Observed via authenticated Chrome UI on 17 October 2026 IST. Property: https://inbox-cleaner.vercel.app/. Read-only; no indexing requests, validation restart, or site settings changes. Values below are transcribed from the UI, not downloaded exports.

## Performance

Web search, selected 28 days: **17 September–14 October 2026**. Report said last update 4 hours ago. **13 clicks, 1.85K impressions, 0.7% average CTR, average position 15**. Impressions are rounded in the UI.

Three-month context, **15 July–14 October 2026**: 21 clicks, 3.3K impressions, 0.6% CTR, average position 23. These overlapping, differently sized windows are not a valid before/after comparison.

| Page path | Clicks | Impressions | Average position |
|---|---:|---:|---:|
| / | 7 | 55 | 16.9 |
| /blog/how-to-select-all-emails-gmail.html | 3 | 534 | 11.0 |
| /blog/how-to-delete-old-emails-gmail.html | 1 | 120 | 31.6 |
| /blog/how-to-find-biggest-emails-gmail.html | 1 | 116 | 11.7 |
| /blog/how-to-permanently-delete-gmail-emails.html | 1 | 64 | 16.5 |
| /blog/gmail-archive-vs-delete.html | 0 | 173 | 28.6 |
| /blog/how-to-delete-emails-older-than-a-year-gmail.html | 0 | 148 | 13.8 |
| /blog/gmail-delete-emails-by-size.html | 0 | 112 | 7.6 |
| /blog/gmail-mailbox-full-cant-receive-emails.html | 0 | 97 | 7.5 |
| /blog/gmail-delete-all-unread-emails.html | 0 | 86 | 19.8 |

These are the first 10 visible rows of 27 page rows, sorted by clicks. Not a complete query/page export.

| Visible query | Clicks | Impressions | Average position |
|---|---:|---:|---:|
| older_than 2y gmail | 1 | 2 | 9.0 |
| select all conversations that match this search not showing | 0 | 23 | 8.4 |
| select all conversations that match this search | 0 | 19 | 10.1 |
| older_than:1y | 0 | 13 | 6.5 |
| larger:20m | 0 | 10 | 7.1 |
| bulk email cleaner | 0 | 10 | 50.8 |
| older_than 1y | 0 | 9 | 7.8 |
| gmail select all conversations that match this search | 0 | 9 | 9.9 |
| older-than 1y | 0 | 8 | 10.1 |
| larger:5m | 0 | 7 | 8.3 |

First 10 visible query rows of 313. Query rows may omit anonymized queries and should not be expected to sum to totals. Small samples cannot support reliable conversion or CTR forecasts.

## Indexing and experience

All-known-pages indexing report, last update **12 October 2026**: **29 indexed, 16 not indexed**. The 16 are **Discovered - currently not indexed**; Crawled - currently not indexed shows 0. Validation already started **6 October 2026**. This is not evidence of a penalty or a technical crawl block. It is also not a synchronous census of the 50 current sitemap URLs.

First 10 visible exclusion examples, all with last crawl N/A:
- /blog/clean-up-gmail-inbox.html
- /blog/delete-calendar-invite-emails-gmail.html
- /blog/delete-facebook-notification-emails-gmail.html
- /blog/delete-google-alerts-emails-gmail.html
- /blog/delete-instagram-emails-gmail.html
- /blog/delete-linkedin-notification-emails-gmail.html
- /blog/delete-twitter-x-notification-emails-gmail.html
- /blog/gmail-bulk-delete-by-sender.html
- /blog/gmail-delete-all-emails-from-multiple-senders.html
- /blog/gmail-filters-delete-emails-automatically.html

Overview Core Web Vitals: **No data** for mobile and desktop. No performance pass/fail conclusion.

## Implications

Refresh the existing select-all guide first, including the missing-link troubleshooting query, followed by size-based deletion, mailbox-full, and biggest-email guides. Improve clarity, current screenshots, title/description intent match and useful internal links; evaluate like-for-like 28-day windows after recrawl. Preserve promising URL equity while reviewing overlapping pages. Low CTR at positions 7–11 is an investigation opportunity, not proof that title changes alone will help.

## Sources and access limits

- [Performance report](https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Finbox-cleaner.vercel.app%2F&num_of_days=28&metrics=CLICKS%2CIMPRESSIONS%2CPOSITION&breakdown=page)
- [Page indexing](https://search.google.com/search-console/index?resource_id=https%3A%2F%2Finbox-cleaner.vercel.app%2F)
- [Discovered exclusions](https://search.google.com/search-console/index/drilldown?resource_id=https%3A%2F%2Finbox-cleaner.vercel.app%2F&item_key=CAMYFiAC)

Links require the property owner's access. A browser attempt to open Chrome Web Store Developer analytics returned **Not allowed**; no private install counts were retrieved and no alternate access route was attempted. Public listing user count must not be treated as install analytics.
