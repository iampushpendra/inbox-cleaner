# Organic growth scorecard

Evidence directory: `research_notes/Analytics intelligence 2026-10-17`.
Generated from exports, not a new authenticated analytics collection. Re-run `python3 scripts/growth_scorecard.py` after replacing the evidence input with a new dated snapshot.

## Search: adjacent 28-day windows

| Window | Observed days | Clicks | Impressions | CTR | Approx. weighted position |
|---|---:|---:|---:|---:|---:|
| 2026-08-20–2026-09-16 | 28 | 4 | 1307 | 0.306% | 33.00 |
| 2026-09-17–2026-10-14 | 28 | 13 | 1847 | 0.704% | 14.96 |

Position is an impression-weighted approximation from rounded daily values; this is not a fixed keyword rank. Query exports omit undisclosed searches. No causal release effect is inferred.

## Search by device and country

| Device | Clicks | Impressions | CTR | Approx. position |
|---|---:|---:|---:|---:|
| Desktop | 14 | 2953 | 0.474% | 26.59 |
| Mobile | 8 | 583 | 1.372% | 12.28 |
| Tablet | 0 | 16 | 0.000% | 7.50 |

Ten highest-impression countries. A long tail follows in the raw export; it is not a demand ranking.

| Country | Clicks | Impressions | Approx. position |
|---|---:|---:|---:|
| United States | 12 | 1755 | 29.83 |
| United Kingdom | 0 | 258 | 19.73 |
| Australia | 1 | 158 | 31.32 |
| Canada | 0 | 157 | 19.89 |
| India | 2 | 148 | 15.26 |
| Netherlands | 0 | 61 | 9.69 |
| Philippines | 2 | 60 | 23.38 |
| Brazil | 0 | 51 | 17.29 |
| Spain | 0 | 50 | 12.78 |
| Indonesia | 0 | 45 | 26.89 |

These two dimensions are whole-export aggregates over the full selected date range, not the adjacent 28-day windows above, and they must not be force-reconciled with them.

Mobile currently holds a better approximate position and CTR than desktop. That matters editorially: the extension requires desktop Chrome, so a mobile reader needs working native Gmail steps and an honest handoff rather than an install button that cannot help them. It is not a claim about future mobile traffic.

## Export provenance

| Export filter | Value |
|---|---|
| Search type | Web (text-based) |
| Date | Last 16 months |

Weekly procedure: replace this dated directory with a new one, re-run the script, and keep the old directory. Store exports keep their own window and reporting timezone and are never merged into search rows. Record the deployed revision alongside any release annotation.

## Store attribution: a different surface

Source files retain their own July 19–October 16 window and Los Angeles reporting timezone. Install counts below use the separately install-filtered export, not the ordinary all-events export.

| Session source / medium | Listing sessions | Engaged sessions | Attributed install events |
|---|---:|---:|---:|
| item-share-cb / (not set) | 2 | 1 | 1 |
| ext_sidebar /  | 1 | 1 | 0 |
| chatgpt.com / ai-assistant | 6 | 4 | 4 |
| (direct) / (none) | 13 | 3 | 1 |

ChatGPT attribution is a small-sample observation. Owner/test traffic and originating shared links remain unresolved. No article-to-install conversion rate is calculated.

## Release annotations and fixed cohort

- 16 October: complete guide discovery/link generation and install routes changed; the latest performance export ends 14 October and cannot measure that effect.
- 17 October, `1479fe7`: 64 new editorial briefs and prioritized backlog.
- 17 October, `2263d24`: five priority guide refreshes; verified live after publication.
- Current delivery: seven further refreshes, privacy/homepage alignment, local tools and evidence gates. Record the deployed revision and actual publication date in the delivery ledger.

Fixed cohort: select-all, size deletion, mailbox-full, biggest-mail, older-than-year plus the homepage. Preserve these URLs and compare the same page/query rows after recrawl. Other page improvements are reported separately.

## Verified coverage, not article count

- Published articles: 39
- Evidence records: 187 (148 draft, 37 evidence_checked, 2 publish_ready)
- Reviewed records: 39 — historical state labels, not current verification
- Current verified coverage: 7 — record version and authored fingerprint match today's source
- Stale reviewed records: 32 — best-way-to-clean-gmail-2026, delete-all-emails-from-one-sender-gmail, delete-amazon-order-emails-gmail, delete-bank-statement-emails-safely-gmail, delete-job-alert-emails-gmail, delete-linkedin-connection-request-emails, delete-paypal-emails-gmail, delete-shipping-confirmation-emails-gmail, delete-uber-eats-doordash-receipts-gmail, delete-zoom-meeting-emails-gmail, gmail-archive-vs-delete, gmail-bulk-delete-not-working, gmail-delete-all-promotional-emails, gmail-delete-all-unread-emails, gmail-delete-social-media-notifications, gmail-empty-trash-automatically, gmail-filters-delete-emails-automatically, gmail-inbox-zero, gmail-search-operators-to-find-old-emails, gmail-select-all-conversations-not-showing, gmail-storage-upgrade-vs-cleanup, gmail-vs-outlook-bulk-delete, how-to-bulk-delete-gmail-emails, how-to-clean-gmail-inbox-in-5-minutes, how-to-delete-newsletter-emails-gmail, how-to-delete-old-emails-gmail, how-to-delete-spam-emails-gmail, how-to-free-up-gmail-storage, how-to-mass-delete-emails-gmail, how-to-organize-cluttered-gmail-inbox, how-to-permanently-delete-gmail-emails, how-to-unsubscribe-from-emails-gmail
- Retired records with no live page: none
- Topics by status: 18 deferred, 12 merged, 130 pending, 39 published

Articles with no reviewed record: none.
Reviewed records with no published article: none.

Stale records name a manifest version or authored fingerprint that no longer matches the running source. The article must be re-reviewed; refreshing the hash or version alone would defeat the gate. A stale label is not verified coverage.

Reviewed coverage is tracked here instead of an article total because a longer backlog is not progress. A `draft` record is unverified no matter how plausible the article reads, and index exclusions stay an external gate until an owner inspection exists.

## Unknowns and collection procedure

| Metric / check | State | Next collection |
|---|---|---|
| Website landings and store CTA clicks | Unknown; no website stream in collected property | Review a separately specified privacy-consistent event design before adding code |
| Activation / successful cleanup | Unknown; no extension telemetry | Use voluntary task feedback; no mailbox content or identity collection |
| Dashboard installs/uninstalls/active users | Unknown; browser access blocked | Owner-export existing reports; preserve dates/filters/definitions |
| Per-URL indexing after release | Pending recrawl/owner inspection | Inspect valuable excluded URLs without restarting existing validation |
| New 28-day outcome | Not yet observable | Collect the next complete post-release window; note crawl date and sample size |

For each weekly export preserve original GSC chart/pages/queries/devices/countries CSVs, date filter, property and reporting timezone. Preserve store session-source and install-filtered exports separately. Do not add overlapping snapshots together. Re-run this script with `--evidence <dated-directory> --output <report-path>`. GSC aggregate versus page/query totals can differ and must not be force-reconciled.

## Minimal future measurement contract

No tracking is installed by this release. If approved and required later, website events are limited to article path and an outbound-store action, with a documented attribution window and sanitized acquisition source. Never transmit sender addresses/domains, message IDs, mailbox contents, tool inputs or complete personal search URLs. Do not label internal/store links as ChatGPT to manufacture attribution. Keep website clicks, store install events and observed product usefulness as separate denominators.

## Manual ChatGPT citation check

Use a fixed set of question families: select-all missing link; bulk delete; sender cleanup; age search; size search; storage full; storage after deletion; archive versus delete; unsubscribe versus deletion; cleaner permissions. Record exact prompt, date, search setting, cited URLs and answer correctness. These owner-run checks are variable observations, not organic customer acquisition or a guaranteed rank. Do not send personal mailbox examples.
