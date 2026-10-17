# Inbox Cleaner SEO and organic growth roadmap

> **For agentic workers:** Use superpowers:executing-plans for implementation, or superpowers:subagent-driven-development only when the user chooses delegation. Checkboxes track proposed work, not completed changes.
>
> **Delivery update, 17 October 2026 — release 3.3.0:** source-reviewed content now covers all 49 original guides, all 12 priority refresh briefs, homepage/privacy/store-copy alignment, two new setup/workflow guides, two working local tools, executable publishing evidence records and a reproducible scorecard. Implementation and independent-review evidence are in the [delivery ledger](2026-10-17-seo-delivery-progress.md). A check means the stated repository work was verified; it does not imply live Gmail/installed-package certification, indexing, competitor performance or later analytics results. Those external gates remain open below.


**Goal:** Grow qualified organic discovery and useful installs by correcting product claims, improving existing search opportunities and publishing distinct, tested pages and browser-only tools.

**Architecture:** Keep the static site and existing sitemap/link generator. Use one preferred Vercel host, a verified product-fact source, evidence-gated content records and local tool inputs. Keep the extension, legacy OAuth browser app and website analytics as explicitly separate surfaces.

**Tech stack:** Vanilla HTML/CSS/JavaScript, Node built-in tests, Python publisher and current static hosting. No paid SEO platform, paid acquisition, hired content team, runtime AI API or new backend is required by this roadmap.

**Spec and evidence:** [Organic growth audit](../../../reports/Inbox%20Cleaner%20organic%20growth.md), [47-URL inventory](../../../research_notes/Inbox%20Cleaner%20organic%20growth/content-inventory.csv), [authenticated analytics intelligence](../../../reports/2026-10-17-analytics-intelligence.md), and [product roadmap](2026-10-17-inbox-cleaner-roadmap.md). Prepared 17 October 2026 IST.

**Status:** Implemented repository slices with explicit external/ongoing evidence gates. Store submission, analytics settings and real Gmail mutation are outside this content release. The four-run editorial schedule remains, but only reviewed ready articles can publish; other runs draft privately for separate review. It supersedes the June and September SEO plans where those plans conflict with the current product, generator, evidence or scope; historical unchecked items are not proof of unfinished work.

## Global constraints

- Keep https://inbox-cleaner.vercel.app as the preferred host and the verified listing URL in scripts/site-config.json. A custom domain is optional, not a prerequisite.
- Verify the installed package before publishing capability claims. Separate extension DOM automation from the OAuth browser app; no blanket claim that the entire website makes no network requests.
- Do not delete the browser app by assumption. Decide its supported route using product and usage evidence.
- No guaranteed rankings, traffic, indexing, featured snippets, storage savings, protected-mail behavior or scan times.
- Preserve useful URLs until full page/query evidence supports consolidation. A similar title does not prove cannibalization.
- No indexed tool-parameter permutations, brand-name substitution pages or generated age × size × category matrices.
- No mail content, addresses, sender domains, message IDs or personal query strings in analytics. Tool inputs remain local; no silent extension telemetry.
- Keep current static generation. The previous zero-JavaScript landing constraint is not a global ban on useful tool JavaScript; analytics remains a separate privacy design decision.
- Use truthful author/verification dates, original screenshots or fixtures and primary sources. FAQ/HowTo rich-result markup is not a growth objective.
- Make each meaningful implementation slice independently reviewable and commit it. Update release metadata at actual release boundaries; pushes and publication need their own authorization.

## Baseline and evidence boundaries

Use the exported analytics report as the detailed source of truth and the audit's transcribed 28-day view for its fixed refresh cohort.

| Source and window | Observed result | Planning implication |
|---|---|---|
| GSC, September 17–October 14 | 13 clicks / 1,847 impressions; 0.704% calculated CTR; approximate weighted position 14.96 | Small real baseline, not a forecast |
| GSC, August 20–September 16 | 4 clicks / 1,307 impressions | Equal-window comparison; no causal release claim |
| GSC, available June 27–October 14 | 22 clicks / 3,552 impressions | Do not mix full-history and 28-day page figures |
| Indexing, updated October 12 | 29 indexed; 16 discovered, currently not indexed; zero crawled, currently not indexed | Inspect important owners; not a penalty diagnosis or current 29/50 indexing rate |
| Current live audit | All 50 sitemap URLs returned 200; 47 articles; 41 API mentions and 33 Connect Gmail journeys | Repair factual drift before expanding the 86 pending topics |
| Store-linked GA, July 19–October 16 | 27 views, 22 sessions, six install events; four attributed to ChatGPT | Listing data, possible owner/test activity; no article-to-install or activation attribution |
| Crawl/experience | 11 recorded 404 examples were favicon.ico; no host problems; field CWV has insufficient data | Fix finite assets; no invented speed pass or crawl crisis |

Private Chrome Developer Dashboard metrics remain uncollected. Store GA installs are available but are not a substitute for dashboard installs/uninstalls/active users. GA reports in Los Angeles time; preserve report dates/time zones before joins. October 16 linking changes postdate the latest GSC performance and indexing snapshots, so their effect is unmeasured.

First refresh cohort, all **September 17–October 14**: select-all 3 clicks / 534 impressions / position 11.0; size deletion 0 / 112 / 7.6; mailbox-full 0 / 97 / 7.5; biggest-mail 1 / 116 / 11.7; older-than-year 0 / 148 / 13.8. Homepage: 7 / 55 / 16.9. Maintain these URLs while investigating intent overlap.

## Review focus

| Failure condition | Required check | Owner |
|---|---|---|
| Legacy API instructions survive in body, metadata, FAQ or CTA | Classify every match by actual surface; review claims against installed behavior | SEO-01 |
| Generated pages or tool states leak into public/indexable output | Output allowlist, HTTP checks, canonical checks and sitemap membership | SEO-02, SEO-06 |
| Manual query protections are confused with sender-wide extension action | Explain scope and mixed-thread limits; seeded fixtures before protection promises | SEO-01, SEO-06 |
| A validator sees a citation but the procedure is false | Evidence review of actual source/test; automation does not certify truth | SEO-04 |
| Store visits, installs and activation are combined into one conversion claim | Separate denominators/windows/surfaces; missing metric stays unknown | SEO-03 |

## Sequence and product ownership

| Priority | SEO task | Product owner | Exit gate |
|---|---|---|---|
| P0 | SEO-01 Product truth and high-risk corrections | R01–R02, R27 | Current package facts and corrected procedures |
| P1 | SEO-02 Host, assets and deployment hygiene | R28 | Canonical URLs/assets work; private plans excluded |
| P1 | SEO-03 Measurement and collection gaps | R29 | Reproducible baseline; surfaces remain separate |
| P1 | SEO-04 Publishing evidence gates | R30 | Scheduler cannot bypass verified readiness |
| P1 | SEO-05 Existing-page refresh and navigation | R31 | Fixed cohort refreshed with tested evidence |
| P2 | SEO-06 Local query builder/checker | R32 | Supported syntax and boundaries tested; no deletion |
| P2 | SEO-07 Storage diagnostic | R23, R33 | Useful local decision tree without fake account scan |
| Conditional | SEO-08 Comparisons, research and distribution | R34 | Firsthand evidence; no invented results/outreach |
| Ongoing | SEO-09 Review and expand winners | R26, R29–R34 | Equal-window review justifies each next asset |

R01/R02 supply truthful claims and action semantics. SEO repairs and native Gmail guides need not wait for every future extension feature. New protection/Undo/automation claims wait for the corresponding runtime gates in R15–R22. Tools may explain native behavior but must not imply the current extension implements their filters.

## SEO-01 — Verify product truth and repair all 47 guides

**Dependencies:** R01/R02 evidence. **Files:** docs/index.html, docs/privacy.html, docs/blog/*.html, docs/CHROME_WEB_STORE.md, README.md, manifest.json description, scripts/site-config.json; proposed scripts/product-facts.json. **Build/review:** S/S; A reviews query/scope claims, using the product roadmap legend.

- [x] Record package/version, permissions, supported locale/device, category discovery, top-250 exact-count limit, approximations, archived-mail action scope, scan timing and recovery evidence. Keep unverifiable claims qualified.
- [x] Source-review every original inventory URL, titles/descriptions/schema/CTAs and remaining API/Connect Gmail copy. All 49 original URLs have retained dispositions in `seo-content-review-report.md`; the optional legacy browser flow is described separately. The original 41/33 match counts are historical audit observations, not a fresh unresolved count.
- [x] Correct the false Gmail 50-email ceiling, claims of bypassing native selection/timeouts, scheduled age-based filter claims and blanket bank-record deletion assurances. Explain native all-matching selection and Gmail incoming-filter behavior.
- [x] Align homepage, privacy, setup/recovery and prepared store copy at source level; explain waitlist/network flows separately. Store-console submission and installed-package verification remain external gates.

**Done when:** Every public capability is traceable to evidence; known risky instructions are removed or corrected; Gmail native alternatives are accurately explained; manual query exclusions are never silently inherited by extension sender-wide deletion. Financial retention advice is removed or explicitly scoped/sourced. Source matches alone do not certify a completed editorial review.

## SEO-02 — Finish finite technical hygiene

**Dependencies:** preferred-host decision retained; coordinate output changes with SEO-04. **Files:** vercel.json, scripts/build_site.mjs, scripts/site-config.json, docs/robots.txt, docs/sitemap.xml, docs/index.html, docs/privacy.html, docs/blog/index.html, docs/favicon.ico, docs/og-image.png; deployment output directory chosen in the implementation slice. **Tests:** test/site.test.js.

- [x] Preserve canonical destinations, configure permanent index/privacy aliases, supply privacy canonical and migrate owned links to the preferred host. External old-host redirect configuration is not changed; canonical/usable-link fallback is the documented limit. Recheck real HTTP behavior at deployment.
- [x] Supply valid favicon and social image, verify HTTP status/content type, and check referenced dimensions.
- [x] Exclude internal plans/specs/store-submission notes and research from deployment with an allowlisted output. Preserve them in the repository. Do not rely on robots disallow to remove already-indexed URLs.
- [ ] The sitemap/internal-link generator is retained and tested, now including two manifest-controlled tool URLs. Individual authenticated GSC exclusion inspection after recrawl remains pending; preserve the validation already started October 6.

**Done when:** Canonical sitemap targets return 200, aliases redirect as designed, assets return correct types, internal documents are no longer publicly served, repeated builds are stable and no new orphan/broken links appear. No promised indexed-page count or CWV pass without data.

## SEO-03 — Measure the acquisition journey honestly

**Dependencies:** none for baseline; R01 and privacy decision before adding events. **Files:** versioned research exports, proposed reports/organic-growth-scorecard.md; site code/privacy only if a separately specified event design is implemented. **Product:** R29.

- [ ] Record weekly GSC page/query/device/country exports, report dates, filters, time zones, release annotations and the fixed refresh cohort. Use adjacent equal 28-day windows.
- [x] Keep store GA sessions/install events separate from website/activation metrics in the reproducible scorecard. Document owner/test limits and a fixed ChatGPT citation/source-link review protocol. Actual source-link provenance and owner filtering remain unresolved, not presumed independent acquisition.
- [ ] Obtain owner-accessible Developer Dashboard exports when possible; retain blocked reports as unknown, not zero. Do not bypass browser access refusals.
- [x] Document a minimal privacy-consistent future measurement contract in the scorecard: sanitized article/acquisition/store-click data only, with separate denominators. No tracking or extension telemetry was added; voluntary task feedback remains the initial product-usefulness route.

**Done when:** Each metric has a source, denominator/window and known gaps. Six store install events divided by search clicks is never reported as website conversion. No new paid analytics service or mail-content collection.

## SEO-04 — Gate the publishing pipeline on evidence

**Dependencies:** SEO-01 product facts; preserve current scheduler until the implementation changes it explicitly. **Files:** scripts/blog-topics.json, scripts/daily_publish_prompt.md, scripts/blog_prompt.md, scripts/publish_blog.py, scripts/build_site.mjs; proposed scripts/content-records.json; test/test_daily_publish.py and test/site.test.js.

- [x] Define draft → evidence-checked → publish-ready records with intent owner, product version, sources, original asset/fixture, actual verification date, limitations, related links and reviewer state. Specify the record interface before coding.
- [x] Remove compulsory word/FAQ quotas and extraction promises. Require a concrete distinct contribution and substantive source-review notes before publication.
- [x] Fail publishing on missing readiness, impossible/future dates, broken links/assets, known contradictory facts or indexable near-duplicate tool states. Require substantive review for intent collision and source accuracy.
- [x] Prove scheduled and manual publication both enforce the same gate, including no-ready-topic behavior and clean-worktree protection. A citation URL is not factual verification.

**Done when:** Invalid fixtures fail with actionable errors, ready fixtures publish with stable dates/discovery links, and no path publishes an unreviewed record. Cadence follows verified supply; propose two or three complete assets weekly initially, not an SEO quota.

## SEO-05 — Refresh observed winners and build five journeys

**Dependencies:** SEO-01 wording/evidence and SEO-03 baseline; SEO-04 gates for new publication. **Files:** docs/blog/*.html, docs/index.html, scripts/build_site.mjs, scripts/content-records.json; existing inventory remains the starting backlog.

- [x] Refresh the five exposed guides, the remaining seven priority guides and the homepage conversion path. All are source-reviewed; original URLs/publication dates are preserved.
- [ ] Add original dated screenshots or synthetic fixtures, tested native steps, recovery/scope limits, clear desktop-extension fit and mobile-native guidance/handoff.
- [x] Add five concrete homepage journeys, complete hub discovery, contextual links, source/review dates and setup/workflow evidence pages. Two tools have canonical sitemap URLs and incoming homepage/hub links.
- [ ] Review the nine provisional merge candidates with full query/page and backlink evidence. Preserve distinct jobs and stronger owners; redirects require a URL-level decision, retained unique material, updated links and sitemap removal.

**Done when:** All 47 URLs have a reviewed disposition, the fixed cohort has evidence-backed improvements, every retained page is reachable, and no URL is removed solely because its title overlaps. Locale expansion waits for product support and demand.

## SEO-06 — Build a differentiated local search helper

**Dependencies:** R02 semantics, SEO-01 facts, SEO-04 records; independent of runtime mutation features. **Files proposed:** docs/tools/gmail-cleanup-search-builder/index.html, docs/tools/query-builder.js, docs/tools/query-builder.css, scripts/build_site.mjs, test/query-builder.test.js. Add a checker route only after a distinct-task decision.

- [x] Build sender/category/relative-age/fixed-date/size criteria, editable output, copy and explicit Gmail search handoff with account/review consent; include declared synthetic examples.
- [x] Add conservative empty/broad/contradictory/date/size/syntax checks and explicit unchecked-syntax and mixed-conversation warnings. No mailbox-match or protected-mail guarantee.
- [x] Keep tool inputs in page memory, no OAuth, deletion, storage or analytics. Public tool URLs carry no inputs; only an explicit Gmail action sends the selected search to Google.
- [x] Verify supported syntax, date/numeric boundaries, hostile input and destination encoding with 11 unit tests; browser-check synthetic query generation, consent, copy and invalid-input blocking in a narrow pane. Labels/focus/keyboard controls and limitations are present. This is not physical-mobile or live-Gmail validation.

**Done when:** A working tool contributes more than generic prose or an existing bare builder. Checker is an integrated feature unless its distinct job warrants its own maintained page. It never advertises extension protection features before R15 gates pass.

## SEO-07 — Build a local storage diagnostic

**Dependencies:** SEO-01 facts, SEO-04 publishing gate; R23 only if actual extension storage insight is claimed. **Files proposed:** docs/tools/gmail-storage-troubleshooter/index.html, docs/tools/storage-troubleshooter.js, docs/tools/storage-troubleshooter.css, test/storage-troubleshooter.test.js, scripts/build_site.mjs.

- [x] Build optional manual Gmail/Drive/Photos/actual-quota inputs and symptom-driven decisions, treating blanks as unknown rather than zero.
- [x] Provide official storage/receiving next steps, shared-storage diagnosis, quota-delay cautions and service-specific permanent-removal distinctions.
- [x] Link existing storage/cleanup guides and disclose the sender-wide extension fit without fake scans, byte estimates or reclaimed-GB promises.
- [x] Verify invalid/unknown/zero/overflow/partial/over-quota/dominance/Trash/delay cases with eight unit tests and browser-check a Photos-heavy example plus Reset. Inputs are unnamed and local; narrow-pane layout and focus behavior checked. No live quota/access claim.

**Done when:** Users receive useful scoped steps without authorizing a scan or sending personal inputs. The tool can ship without adding extension permissions or a backend.

## SEO-08 — Produce evidence assets and low-cost distribution

**Dependencies:** truthful current product, useful owner pages/tools; R14 task observations for usability claims. **Files:** how-it-works/help pages, comparison/research pages selected from the portfolio below, synthetic fixtures and dated methods.

- [ ] Publish setup/data-flow/recovery evidence, a native Gmail comparison and one firsthand competitor comparison with current source dates and where alternatives win.
- [ ] Run synthetic native-vs-extension cleanup tasks, documenting account/thread setup, counts, browser/device, timings, failures and limitations. Never invent benchmark results or use synthetic screenshots as proof of live performance.
- [x] Create a reusable 16-second local-tool demo, GitHub/README tool links, synthetic fixture library and source/provenance reports. Prepare community/tutorial responses without sending them. The clip demonstrates synthetic local tool inputs, not live Gmail or competitor performance.
- [x] No paid backlinks, paid writer dependency or unsolicited distribution added; prepared community/tutorial copy remains unsent.

**Done when:** Every comparison/result has reproducible provenance, meaningful scope and disclosed authorship. Evidence assets can be updated economically; unsupported comparison/research stays deferred.

## Portfolio: all 15 audit briefs

These are bounded asset briefs, not a commitment to 15 new URLs. Existing owners are refreshed first; useful sections become standalone pages only when a distinct task warrants them.

| Brief | Asset / route | Owner and distinct-value gate |
|---|---|---|
| B01 | Homepage / | SEO-01; real current-release workflow, honest Gmail comparison and clear install path |
| B02 | /blog/how-to-select-all-emails-gmail.html | SEO-05; current all-results vs page-only screenshots, missing-link troubleshooting |
| B03 | /blog/delete-all-emails-from-one-sender-gmail.html | SEO-05; exact sender/display-name, archive and mixed-thread examples |
| B04 | /tools/gmail-cleanup-search-builder/ | SEO-06; tested syntax, editable query, boundary/scope explanation |
| B05 | /tools/gmail-query-checker/ only if distinct | SEO-06; supported grammar/fixtures, static warnings, no mailbox guarantee |
| B06 | /tools/gmail-storage-troubleshooter/ | SEO-07; manual-input shared-storage decision tree |
| B07 | Storage-after-deletion section; new URL only if justified | SEO-05/07; Trash, shared quota, delayed meter diagnosis |
| B08 | /blog/how-to-bulk-delete-gmail-emails.html | SEO-05; tested native selection and recovery; review mass/thousands overlap |
| B09 | /blog/gmail-delete-emails-keep-starred-conversations.html if tested | SEO-06/08; seeded mixed threads and negative-query limitations |
| B10 | Existing old-mail and older-than-year guides | SEO-05; exact/relative boundary examples; preserve both pending query analysis |
| B11 | Existing size, biggest-mail and mailbox-full cohort | SEO-05/07; three distinct jobs, observed demand and native diagnosis |
| B12 | /blog/how-to-unsubscribe-from-emails-gmail.html | SEO-05; current native Manage subscriptions, future delivery vs existing backlog |
| B13 | /compare/inbox-cleaner-vs-clean-email/ if evidenced | SEO-08; dated firsthand/source matrix, authorship and competitor advantages |
| B14 | /how-it-works/ with setup/recovery sections | SEO-01/08; current data flow, permissions, cache, scan/review/Trash/restore |
| B15 | /research/gmail-cleanup-methods/ only after tests | SEO-08; reproducible synthetic comparison with actual timings/failures |

Brand-specific recipes require tested sender identity, transactional/promotional distinctions and current settings evidence. Keep interchangeable recipes in a maintained library. Do not scale locations, personas, locales or brand names simply because a template can generate them.

## 30/60/90-day review plan

| Window | Deliverables | Review gate |
|---|---|---|
| Days 1–30 | Truth/safety corrections, finite host/assets/output repairs, baseline, publishing gates, observed-page refreshes, setup/recovery; begin first query tool | Known contradictions resolved; useful pages retain URLs; same-cohort baseline recorded; no unverified record publishes |
| Days 31–60 | Complete builder, optional checker decision, storage diagnostic, thread/select-all fixtures, remaining high-fit rewrites, topical navigation, native comparison and benchmark collection | Compare equal windows after recrawl; demand and distinct usefulness justify each new URL; do not claim causality from timing alone |
| Days 61–90 | Expand actual query gaps, publish tested research and one or two comparisons, maintain demos/fixtures and prepared distribution | Qualified discovery, observed task usefulness and support burden guide expansion; no growth or indexation promise |

## SEO-09 — Ongoing scorecard and completion rules

- [ ] Review the fixed refreshed-page cohort every 28 days using comparable windows, crawl dates and annotated changes. Track impressions/clicks/CTR/position together; small samples stay qualified.
- [ ] Track editorial contradictions, verified coverage, index exclusions and useful actions separately from raw article count.
- [ ] Keep website CTA clicks, store installs/uninstalls and activation distinct; collect missing data only through approved owner access and privacy-consistent designs.
- [x] The two tools and two evidence pages have defined distinct jobs, reviewed scope and original synthetic examples. Two redundant pending briefs now point to the maintained evidence owners. No published URLs were retired.
- [ ] At each actual implementation release, run relevant Node site/tool tests and Python publisher tests, inspect mobile/keyboard behavior and real HTTP/canonical/output checks, and commit verified changes. This planning edit itself requires document/link/coverage verification, not runtime changes.

This delivery records verified implementation, not completion of the external or ongoing gates. Product R01–R26 remain authoritative for extension safety and feature behavior; R27–R34 below integrate growth delivery, and this roadmap owns the detailed SEO backlog.

## External and ongoing gates — still open

1. Verify the installed Chrome Web Store package and current Gmail selectors with an authorized disposable mailbox; capture actual native/extension walkthroughs and recovery observations. The local fixture library and tool screenshots are labeled synthetic and do not close this gate.
2. Obtain owner-accessible Developer Dashboard exports and individual authenticated GSC URL inspections. Previously refused surfaces stay unknown; no access controls are bypassed.
3. Collect complete page-by-query and backlink evidence before any merge/redirect decision. All original URLs remain.
4. Run a firsthand third-party competitor trial before publishing a competitor ranking or measured comparison. Current native-Gmail comparison is source-based and explicitly says so.
5. Produce comparable post-recrawl 28-day outcomes, weekly source exports and source-link/owner-test provenance. Future observations cannot be completed on release day. No separate website analytics or extension telemetry has been silently installed.

Prepared distribution snippets and test protocols live in `reports/seo-evidence-and-distribution.md`; the scorecard is `reports/organic-growth-scorecard.md`. The release ledger records actual test counts, review findings/fixes and deployment checks. The roadmap is not labeled fully complete while these gates remain.
