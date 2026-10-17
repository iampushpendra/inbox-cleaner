# Inbox Cleaner analytics intelligence

Collected 17 October 2026, Asia/Kolkata. **Recommendation: improve trustworthy cleanup and the existing search-to-install journey before expanding the feature or article backlog.** Search visibility is growing, a few existing guides have identifiable opportunities, and the store-linked GA property records six install events. We cannot yet measure successful Gmail cleanup or reliably join an article visit to an installation.

This report adds authenticated analytics evidence to the existing [product roadmap](../docs/superpowers/plans/2026-10-17-inbox-cleaner-roadmap.md), [competitor teardown](Inbox%20cleaner%20extension%20teardown.md), and [organic-growth audit](Inbox%20Cleaner%20organic%20growth.md). Recommendations below are proposed ordering and acceptance criteria, not implemented features. No mailbox, publishing schedule, store configuration, analytics configuration or production site was changed.

## Coverage and evidence

The [evidence directory](../research_notes/Analytics%20intelligence%202026-10-17/README.md) contains the original Search Console workbooks, every exported sheet as CSV, GA CSV exports, and sanitized UI captures with their source URLs.

| Surface | Reports inspected | Coverage and limitation |
|---|---|---|
| Search Console Performance | Queries, Pages, Countries, Devices, Search appearance, Days | Complete available export: 628 disclosed queries, 29 pages, 122 countries, 3 device categories, 1 appearance category and 110 daily rows. Also preserved the three-month export. |
| Search Console health | Overview, Insights, Page indexing and all 16 discovered exclusions, Sitemaps, Core Web Vitals, HTTPS, Links, Manual actions, Security issues, Removals, Achievements, Settings and crawl statistics | All 11 crawl-404 examples inspected. Temporary-removal and outdated-content reports had no requests. SafeSearch filtering and individual URL Inspection were not completed. No indexing/validation requests were submitted. |
| GA acquisition and behavior | Home, Reports snapshot, realtime overview/pages, user/traffic acquisition, source/medium, landing pages, pages/screens, events and install detail, audiences, cohorts, retention | Primary exported window: July 19–October 16. Snapshot also checked January 1–October 17, including partial current-day data. These are **store-listing analytics**, not website or in-extension activity. |
| GA additional reports | Generate-leads, traffic, engagement, user-attributes and tech overviews; country, browser, device/language cards; lead acquisition/loss; ecommerce, promotions, purchase/checkout journeys, transactions and campaign-import validation | Lead, commerce and campaign reports had no relevant conversion data. No demographic age/gender/interest data was available in inspected cards. No saved exploration or advertising audit was performed. |
| GA administration | Property details, account/property picker, data streams and data filters | Only the Chrome Web Store developer account/property was visible in the inspected account. No website stream was present in this property. Other Google identities and separate hosting analytics were not audited. |
| Chrome Web Store public listing | Version, update date, user badge, ratings, description and public links | Verified separately through the [public listing](https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep). Public counts are not private acquisition analytics. |
| Chrome Web Store private dashboard | Attempted with Kimi, then the ChatGPT Chrome extension at the user's request | Both refused access. Kimi: “The extensions gallery cannot be scripted”; ChatGPT Chrome: “Not allowed.” Impressions, dashboard installs/uninstalls, active users, version adoption and detailed acquisition reports remain uncollected. **This is not a complete three-platform extraction.** |

## Search is small, but improving

The maximum available Performance window actually contains **June 27–October 14, 2026**, despite the UI filter being named “Last 16 months.” Its 110 daily rows total **22 clicks / 3,552 impressions**, a calculated **0.619% CTR**, and approximately **24.16 average position**. The three-month export has 21 clicks / 3,301 impressions.

Use adjacent equal windows to assess the recent trend:

| Metric | August 20–September 16 | September 17–October 14 | Change |
|---|---:|---:|---|
| Search clicks | 4 | 13 | +9; +225% from a very small base |
| Impressions | 1,307 | 1,847 | +540; +41.3% |
| Calculated CTR | 0.306% | 0.704% | +0.398 percentage points |
| Impression-weighted daily position | 33.00 | 14.96 | Better aggregate position; not a fixed keyword rank |

These comparisons are reconstructed from exported daily rows; position is approximate because source daily averages are rounded. They do not establish which release caused the change. The October 16 discovery/link changes postdate the last Performance day and the October 12 indexing snapshot: **the current data cannot evaluate that release's effect**.

### Work on existing pages with exposure

Full-history page metrics, rounded for display:

| Page/job | Clicks | Impressions | CTR | Position | Proposed action |
|---|---:|---:|---:|---:|---|
| Homepage | 15 | 172 | 8.72% | 27.03 | Make its product story and install journey consistent; it supplies 68% of recorded search clicks. |
| Select all emails | 3 | 1,082 | 0.28% | 12.65 | First guide refresh: current desktop screenshots, beyond-page selection and missing-link troubleshooting. |
| Delete by size | 0 | 112 | 0% | 7.59 | Clarify native size queries and safe review; do not imply sender counts measure bytes. |
| Mailbox full / cannot receive | 0 | 97 | 0% | 7.49 | Give an urgent diagnostic path and explain Trash versus recovered quota. |
| Find biggest emails | 1 | 116 | 0.86% | 11.66 | Improve the existing guide and its connection to manual Gmail search. |
| Older than a year | 0 | 148 | 0% | 13.78 | Test age-query examples; link to safe sender cleanup only when the scopes agree. |
| Delete from one sender | 0 | 344 | 0% | 38.22 | Strong product fit, but lower ranking; fix product truth and distinguish it from overlapping sender guides. |
| Archive versus delete | 0 | 372 | 0% | 41.24 | Useful explanatory intent; improve depth before treating it as a title-only CTR problem. |

Low CTR is an investigation signal, not proof a headline caused it. Small denominators, device mix, result layout and query intent all matter. Retain useful URLs while reviewing overlap; there is no evidence here that similar titles alone prove cannibalization.

The disclosed queries reinforce a specific usability problem: “select all conversations that match this search” has 110 impressions at position 10.95; the “not showing” variant has 39 at 9.38; the Gmail-prefixed variant has 15 at 12.07. Only one click is disclosed across all 628 query rows, versus 22 aggregate clicks. Their 1,529 impressions also do not equal the property total. **Do not invent the hidden queries, infer the acquisition share of branded queries, or assign the remaining clicks to a specific intent.**

Full-history desktop accounts for 14 clicks / 2,953 impressions; mobile 8 / 583; tablet 0 / 16. Mobile therefore contributes 36% of search clicks, while this is a desktop Chrome extension. Provide useful native Gmail instructions and a clear desktop handoff; that is not evidence to build a mobile app now. The US leads with 12 clicks / 1,755 impressions; India has 2 / 148. Tiny country samples do not justify localization investment yet.

### Discovery needs diagnosis, not another sitemap system

Page indexing, updated October 12, shows **29 indexed and 16 “Discovered - currently not indexed”**, all 16 with last crawl N/A. Validation already started October 6. The sitemap report read `/sitemap.xml` successfully on October 16 and recorded 47 discovered pages. The separate live-site audit found 50 current sitemap URLs. These are different report snapshots/scopes; the gap is not proof three URLs are broken.

Among the 16 are the sender, multi-sender, storage, search-operator and thousands-of-emails guides. Review the valuable intent owners individually, their canonical and incoming links, and their actual product instructions. Recheck after the existing discovery changes have been crawled. Do not automatically resubmit every URL, restart validation or delete all exclusions.

Crawl statistics, updated October 15, show **158 requests, 187 ms average response time, and no host problems in the last 90 days**. Eleven requests were 404s; every example is `/favicon.ico`. Fix that small asset issue, but it does not establish an article availability crisis. Core Web Vitals has insufficient usage data on both devices; HTTPS reports no critical issues. Manual actions/security show no issues. The Links report shows zero external/internal links in that report, which does not establish that the site literally has no links or backlinks.

## GA describes store visits, not product success

Verified scope: account **406773911**, property **552886014**, named **pnlnpdidhjimchppdmojledmfakpepep**; stream **15727450937**, “Chrome Web Store developer property web stream,” URL `https://chrome.google.com/webstore`. Property reporting time zone is **Los Angeles**, while this report's collection date is IST. Do not join daily GA/GSC figures without checking their time-zone boundaries.

The final July 19–October 16 CSV exports record:

- **27 page views, 22 sessions and 70 total events**.
- **6 `install` events associated with 6 reported users**.
- `page_view`: 27; `session_start`: 22; `first_visit`: 15. The Events report gives 13 total users. Preserve these source definitions; new-visit events are not necessarily distinct new people.
- Source/medium: direct 13 sessions; `chatgpt.com / ai-assistant` 6; `item-share-cb / (not set)` 2; `ext_sidebar / ` 1. ChatGPT sessions have 4 engaged sessions versus 3 of 13 direct sessions. This is a small hypothesis-generating sample, not channel superiority or proof of third-party recommendations.
- With the Event count column explicitly filtered to `install`, GA attributes **4 install events to ChatGPT, 1 to direct, 1 to `item-share-cb`, and 0 to `ext_sidebar`**. The separately preserved filtered export and UI capture distinguish this from the all-events table. Check owner/test activity and source-link provenance before treating it as an independently acquired audience; this is not article-level attribution or a proven conversion-rate comparison.
- Country active users: US 5, India 3, and Australia/Finland/France/Singapore/UK 1 each. Install-detail UI shows India 3, Australia 1, France 1, US 1 in its inspected 90-day capture.
- Browser active users: Chrome 10, Safari 2, Opera 1. The tech overview shows approximately 85% desktop and 15% mobile. These describe listing visitors; they do not prove extension compatibility with each browser.
- Zero recorded key events/revenue in the inspected reports. The `install` event exists even though key-event columns are zero; **zero key events is not zero installations**.

Early UI captures showed 25 views / 21 sessions / 67 events. Later CSV exports for the same displayed dates showed 27 / 22 / 70, including an `ext_sidebar` session. The collection was not an atomic snapshot; processing and potential owner/test activity can affect these tiny totals. Use the exported files as this report's final baseline and preserve the earlier captures as provenance rather than silently reconciling them into invented users. The January–October snapshot includes a partial current day and should not be treated as an additional cohort.

The property warns that report filtering is enabled. Its Internal Traffic data filter is in **Testing**, not Active; this does not demonstrate exclusion of owner/test traffic. No website stream was found in the visible property picker, and source inspection found no GA tag in the website. That leaves website visits, article-to-store clicks and activation unmeasured by these exports. It does not rule out separate hosting analytics or another Google identity.

Do not divide six install events by GSC clicks to claim a website conversion rate, subtract the public user badge to infer uninstalls, or interpret listing-return cohorts as in-extension retention. There is no joined cohort or successful-cleanup event here.

## Reconcile the public story

The public [Chrome listing](https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep), checked October 17, shows **3.2.1**, updated October 16, **5 users**, and no ratings. This supersedes the older submission note saying the public package was still 3.0.0. It does not prove that the distributed runtime exactly matches the local source.

The listing description still names `identity`, Gmail API scopes and sign-in, and links to the old GitHub Pages website. Local extension source uses Gmail DOM automation. The existing organic audit also found legacy API/Connect Gmail copy in many guides. Resolve the installed-package behavior and then align listing, website, articles and privacy text. Do not describe “new release submission” as the first task when a current release is already publicly listed.

## Proposed roadmap ordering

The analytics **support** the existing trust-first roadmap; they do not justify all 26 tasks equally. The following ordering combines search evidence with source-observed and competitor-research risks. Source observations about account binding/counts are not reproduced wrong-account incidents.

| Order | Work item | Evidence and acceptance gate | Existing roadmap alignment |
|---|---|---|---|
| **Now / P0** | Verify distributed behavior; align listing/site/privacy/article claims | Live 3.2.1 with stale OAuth/API description. Claims map to tested installed behavior, supported device/locale, scope and recovery. Prepare reviewable store copy; publishing remains a separate action. | R01; growth audit GROW-01–03 |
| **Now / P0** | Bind account, tab, scan cache and action; preserve count/scope confidence | Source chooses active/first Gmail tab and stores a globally named cache; selection bar omits approximate qualifier. Define entity/overlap contract, show account, block mismatch/unknown identity, and use the same account/query for preview and action. No Gmail mutation against real mail is authorized by this research. | R02–R05 |
| **Next / P1** | Make first cleanup predictable and recoverable | Six store install events give no activation evidence. Preflight explains scan time/scope, progress can reconnect safely, failures preserve last complete data, receipts distinguish verified/unknown outcomes and provide Open Trash/restoration guidance. No fake one-click Undo. | R06–R12, R14 |
| **Next / P1** | Refresh the five exposed guides above and the sender conversion journey | Begin with select-all, size, mailbox-full, biggest-mail and older-than-year. Include tested native steps/screenshots, precise extension fit and a clear install route. Compare the same page/query cohorts after recrawl; no fixed CTR promise. | Growth audit GROW-02, GROW-07 |
| **Next / P1** | Recheck discovery and finish finite hygiene | Keep the current generator; inspect important exclusions and canonical/link evidence. Restore favicon; review old-host/OG/privacy/deployment issues from the existing audit. Gates use real HTTP/canonical checks and later GSC snapshots, not guaranteed index counts. | Growth audit GROW-04, GROW-07 |
| **Next / P1** | Establish a privacy-consistent measurement baseline | Start with the existing exports, release annotations and voluntary feedback. Separately design any website events, excluding mailbox identities/content and personal query strings; do not silently add extension telemetry. Mark store gaps and owner/test traffic; distinguish click/install/activation. | Growth audit GROW-05 |
| **Then / P2** | Add a useful local Gmail query builder and safe filters | Age/size/missing-selection query evidence suggests a practical helper. Begin as a read-only local query preview, not an automatic delete action. In-extension protected-mail/age/archive choices require shared preview/action rules and fixtures. | Growth audit GROW-08; R15–R17 |
| **Conditional** | Unsubscribe, future-mail rules, unattended cleanup, storage insights, larger workspace/locales | Current analytics do not establish demand, safety or retention lift. Require user research plus the roadmap's feasibility gates; no cloud/AI backend, mobile app or monetization expansion based on this sample. | R18–R26 |

A practical first implementation slice is **R01/R02 → R03/R04/R05**, with the first content refresh prepared against the verified product truth. Finish R06–R09 before presenting a reliable cleanup release. The query builder and publishing expansion follow the core contract and content corrections. The existing roadmap owns detailed engineering criteria; this report supplies the analytics-based prioritization.

Keep one small acquisition experiment alongside that work: identify the existing ChatGPT-attributed entry links, separate known owner/test use, and annotate future voluntarily shared links consistently. Improve the factual guide/demo that those links reach before trying to scale distribution. Four attributed install events justify checking the source; they do not justify a new AI product feature or an aggressive promotion campaign.

Review progress using equal 28-day search windows, the fixed refreshed-page cohort, separately reported store totals and observed disposable-mailbox task success. Annotate releases. A blank metric remains unknown; neither rankings nor installs are promised.

## Remaining collection work

To finish the originally requested three-platform intelligence, the owner-accessible Chrome Developer Dashboard still needs report exports for impressions, installations/uninstallations, active users, acquisition sources/countries and any version/cohort dimensions actually offered. Capture each report's dates, filters and definitions. A manually downloaded export can be analyzed locally without scripting the protected store domain. Individual GSC URL inspections and any separate website/hosting analytics can then close the canonical and conversion gaps. These are explicit outstanding inputs, not zero-valued metrics.
