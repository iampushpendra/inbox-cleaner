# Inbox Cleaner SEO Completion Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` for implementation, as already requested by the user. Execute the dependency order below, use disjoint file ownership for parallel work, and obtain independent review before each release. Checkboxes are execution work still to do; this document does not complete them.

**Goal:** Finish and verify the remaining SEO/ChatGPT discovery work, reconcile the shipped implementation, and establish an evidence-based recurring growth cycle without presenting unknown outcomes as completed work.

**Architecture:** Retain the static Vercel site, current generator, local tools, private draft/evidence workflow and existing analytics exports. Repair release blockers before adding content. Keep website acquisition, Web Store acquisition and real extension usefulness as separate measured surfaces. Use the existing legacy exemption only for its fixed historical inventory.

**Tech stack:** Vanilla HTML/CSS/JavaScript, Node built-in tests, Python standard library, Git/Vercel, owner-accessible Google Search Console and Chrome Web Store reports. No new paid platform, AI backend or extension telemetry is required.

**Spec and history:** This plan implements the remaining requirements of [SEO-01–SEO-09](2026-10-17-seo-roadmap.md), constrained by [product facts](../../../scripts/product-facts.json), [analytics intelligence](../../../reports/2026-10-17-analytics-intelligence.md), [source review inventory](seo-content-review-report.md) and the [distribution/evidence protocol](../../../reports/seo-evidence-and-distribution.md). Where historical status text conflicts with verified current files, this dated reconciliation controls remaining-work ordering. It does not override verified product behavior.

**Prepared:** 26 October 2026, Asia/Kolkata. **Execution method:** subagents, preserved from the user's earlier instruction. **Planning-only change:** no publishing, store submission, analytics setting changes, account enrollment or mailbox mutation is performed by making this plan.

## 1. Verified starting point

| Area | Current observation | Consequence |
|---|---|---|
| Working tree | One existing local commit ahead of cached `origin/main`: `c0b95f1`, dated 21 October. Private drafts and an October 18 audit are untracked. | Preserve these. Do not reset, sweep-stage drafts, or silently publish another task's extension work. Identify the intended release revision explicitly. |
| Source versions | `VERSION` and manifest were 3.3.1 at inspection. This plan is documentation release 3.3.2; runtime remains 3.3.1. | Content verification must use the actual runtime manifest, not the documentation release number. |
| Site inventory | 39 article files, two tools, 44 sitemap entries. | Replace old 49/51-article and 50/56-URL completion assumptions with current inventory. Counts are reconciliation data, not growth KPIs. |
| Queue | 39 published, 12 merged, 130 pending, 18 deferred; 199 entries total. | Preserve merge owners and historical provenance; a large queue is not publication readiness. |
| Consolidation | `020bb2a` implemented 12 permanent-redirect mappings and carried material into owners. | Do not redo consolidation. Validate the mappings, owner content and evidence limits. Backlinks were unavailable at decision time. |
| Existing features | Both local tools, 12 priority refreshes, setup/native-Gmail evidence pages, a synthetic fixture library/demo, evidence gates, scorecard and social-tag/idempotence fixes exist. | Reuse and verify them; no rebuild of these features from scratch. |
| Node tests, run October 26 | 88 tests: 87 pass, one fails in `test/site.test.js` publisher-success fixture because its temporary site lacks the two linked tool pages. | Repair fixture completeness; do not weaken broken-link checks to obtain green tests. |
| Python tests, run October 26 | 26 pass. | Preserve meaningful existing coverage. |
| Evidence/readiness | Both new setup/comparison guides fail `content_gate.py --ready`: stale fingerprint and recorded manifest 3.2.1 versus runtime 3.3.1. `product-facts.json` also records 3.2.1. | Substantive re-review is required. Never refresh hashes/version fields mechanically to bypass the gate. A state label alone is insufficient verified coverage. |
| Live checks, attempted October 26 | HTTPS handshake timeouts for sitemap, both tools and two merge examples. | Current deployment/redirect behavior is unverified. These timeouts do not prove an outage, 404 or failed deployment. |
| Analytics | Preserved October 17 collection: 22 GSC clicks/3,552 impressions; store GA attributed four of six install events to ChatGPT. | Historical, different surfaces/windows; not today's totals or proof most website clicks came from ChatGPT. Obtain a new snapshot. |
| Store identity | Earlier notes report local/store package and permission inconsistencies; current installed package/dashboard identity is not verified here. | Resolve before publishing unqualified product comparisons or a new store submission. |

Reproduce the inspection with `git status -sb`, `git log -5 --oneline`, the manifest, sitemap, queue and records. The two readiness commands are `python3 scripts/content_gate.py --ready inbox-cleaner-setup-permissions-recovery` and the same command for `inbox-cleaner-vs-native-gmail`.

## 2. Global constraints

- Keep `https://inbox-cleaner.vercel.app` and the configured Chrome Web Store listing as the owned destinations. No custom-domain migration is needed to finish this plan.
- Treat DOM extension, optional OAuth browser app, website/waitlist and local tools as separate data flows. Do not promise exact bytes, message counts, recovery or performance that evidence does not establish.
- Inputs to local tools remain local; only the user's explicit Gmail handoff sends the chosen query to Google. No query/address/message content in analytics, public URLs or shared evidence.
- Preserve the 12 existing redirect decisions as history; reverse or extend one only through a specific reviewed mapping and evidence. No arbitrary further merges or mass indexing submissions.
- Do not expand the legacy gate exemption or grant scheduled drafts their own `publish_ready` state. Fix actual defects and validate reviewed content rather than bypassing controls.
- Preserve unrelated changes, drafts and reports. Stage exact task paths. Commit each major verified slice. Never force-push, rewrite history, or treat this plan as authority to publish unrelated local work.
- Read-only owner-accessible collection is useful; blocked access is recorded. Real mailbox actions require an explicitly authorized disposable account and approved actions; never use production mail for tests.
- No external posts, emails, community messages, paid subscriptions, expanded account access or store submission without the applicable specific user authorization. Prepare reviewable materials first.
- Technical readiness is finite; indexing, acquisition and usefulness require observations. No guaranteed citation, ranking, CTR, install, retention or storage-savings targets.

## 3. Work ownership and dependency graph

| Track | Owner | Runs when | Output |
|---|---|---|---|
| Release/gates | Agent A | Immediately | T01–T02; clean reproducible release candidate |
| Canonical/redirect/discovery | Agent B | Audit after T01; edits after T02 | T03; verified URL disposition and deployed behavior |
| Acquisition/evidence | Agent C | Read-only baseline can start alongside T01 | T04–T05; dated inputs, attribution design and operating checks |
| Package/usability | Agent D | Read-only comparison can start immediately; mutation waits on authorization | T06; verified package matrix and task observations |
| Editorial/distribution | Agent E | Brief research after T04; publication waits on T01–T03/T06 for product claims | T07–T09; ready articles, honest comparisons and prepared distribution |
| Coordinator/reviewer | Root plus fresh reviewer | All tracks | Single integration owner; final release check; T10 recurring review |

Use at most three active workers plus the coordinator. A/B/C can start independently on disjoint files. D follows when a slot frees. E follows evidence. Only the integration owner rebuilds shared discovery after article edits settle. Tasks touching `scripts/content-records.json`, generator, README/version/changelog or shared site files run serially; workers must not stage each other's files.

Dependency spine: **T01 → T02 → T03 → release**. **T04 → T05 → T07 → T09**. **T06 → firsthand product/competitor claims in T08**. **T03 + T04 + release/crawl observations → T10**. Access-blocked tasks do not prevent completion of independent repository work.

## 4. Review focus

| Failure mode | Required behavior | Owning task/check |
|---|---|---|
| A manifest update or consolidation stales reviewed HTML | Fail closed until a real source/content re-review; coverage reports validity separately from labels | T01 stale-version/hash cases; T02 current records |
| A retired URL redirects incorrectly or loses useful information | One permanent hop to a live self-canonical owner; retained unique material and no stale internal links | T03 every one of the 12 mappings |
| ChatGPT/store sessions are joined to GSC clicks as conversions | Preserve window, surface, timezone and denominator; owner tests separated; missing remains unknown | T04–T05 scorecard cases |
| A negative/age query or sender count is presented as protection/storage | Native task review, mixed-thread fixture and actual observed results distinguished; no inherited extension filters | T06–T08 protocol and editorial checks |
| The running local tree differs from production or the installed package | Record exact commit, build/deployment, package manifest/hash and permissions; don't generalize fixture success | T02–T03/T06 release evidence |

## 5. Execution tasks

### T01 — Restore trustworthy repository verification (P0)

**Files:** modify `test/site.test.js`; inspect `scripts/content_gate.py`, `scripts/build_site.mjs`; if needed extend `test/test_content_gate.py`, `test/test_growth_scorecard.py` and `scripts/growth_scorecard.py`.

**Interface:** keep `coverage(root: Path = ROOT) -> dict` in `scripts/growth_scorecard.py`; retain `reviewed` as the historical state-label count and add `current_reviewed: int`, `stale_records: list[str]` and `retired_records: list[str]` for present article/version/fingerprint validity. A source-reviewed `evidence_checked` record can be current without being publication-ready; do not call `check_readiness` to equate those states. Produce a self-contained test site and a verification result containing command, revision, pass/fail and known limits. No new testing framework.

- [ ] Reproduce the current publisher-success failure with `node --test test/site.test.js`. The expected initial error names both missing tool routes.
- [ ] Make the temporary site fixture include the actual linked local tool routes/assets or use a deliberately independent authored article fixture without those links. Keep a separate missing-tool link rejection test; do not whitelist broken destinations.
- [ ] Add a coverage regression asserting that a record marked reviewed with a stale hash/version is reported as stale, not current verified coverage. Keep historical review counts as a separate measure if useful. Include merged records, unknown values and orphan records.
- [ ] Pin the coverage interface with fixtures: a reviewed record with a mismatched manifest or authored fingerprint yields `current_reviewed == 0` and `stale_records == ["example"]`; a matching source-reviewed record yields `current_reviewed == 1` and an empty stale list. A merged record with no current article is reported as a retired record, not verified live coverage. Keep existing orphan/uncovered reporting.
- [ ] Implement only any missing coverage-validity reporting; retain fail-closed publisher/build behavior and exact-slug canonicals.
- [ ] Run `node --test test/*.test.js` and `python3 -m unittest discover -s test -p 'test_*.py'`; require zero failures. Report actual current counts rather than copying historical 68/74 counts.
- [ ] Independently review and commit this verification slice.

**Done:** complete fixtures pass, genuinely broken links still fail, and stale evidence is visible. This does not approve stale production content.

### T02 — Reconcile source, evidence and the release candidate (P0; after T01)

**Files:** `scripts/product-facts.json`, `scripts/content-records.json`, the two setup/comparison HTML files, any actually affected guides/privacy/store draft, `README.md`, `CHANGELOG.md`, `VERSION`; retain runtime code unless a separately justified defect requires changes.

**Interface:** actual `manifest.json.version` is the product version; `post_fingerprint(path)` is the authored HTML fingerprint; `check_post` plus `check_readiness` is the review acceptance interface.

- [ ] Record which local commits are intended for the release, including the existing unpushed extension commit. Reconcile its owner/status rather than silently bundling it under a content-only release.
- [ ] Read the 3.2.1→3.3.1 source changes and recheck each affected product statement. Update facts with the current evidence scope, retaining source versus installed-package limitations.
- [ ] Re-review the two failing ready pages, current internal links and the changed runtime claims. Correct content if needed; preserve publication dates. Store actual reviewer, date, sources, limits and a fingerprint only after review.
- [ ] Audit other retained reviewed records against current HTML/manifest; classify current, stale, merged or needs external verification. Do not mechanically bless the historical inventory.
- [ ] Run both ready commands, basic gates over every retained article, the full suites, and `node scripts/build_site.mjs` twice. Require zero readiness failures for gated pages and zero second-build changes.
- [ ] Review/stage exact release paths, update release metadata around the actual delivered slice, and commit. Do not publish private drafts or untracked audit reports by accident.

**Done:** a reproducible clean candidate builds without disabling safeguards; product and documentation versions are explicitly distinguished. Push/publication remains a release action for the selected candidate.

### T03 — Verify consolidation, live deployment and crawl eligibility (P0/P1; after T02)

**Files:** `vercel.json`, `docs/sitemap.xml`, `scripts/build_site.mjs`, `test/site.test.js`, `scripts/blog-topics.json`, evidence records if fixes require them. Create `reports/2026-10-26-seo-url-reconciliation.md` and `research_notes/SEO completion 2026-10-26/url-checks.json` at execution, with actual check timestamps.

**Interface:** the 12 `vercel.json.redirects` blog mappings are the source→owner contract. Check local revision versus deployed revision, then record source URL, first status/Location, final URL/status, canonical and sitemap membership.

- [ ] Inventory 39 articles/two tools/44 sitemap URLs from the current candidate; recompute if content changes. Map all 12 merged topics and redirects to existing owners.
- [ ] Add meaningful tests for missing destination, redirect cycle/chain, retired URL in sitemap, stale related/record links and retained owner content where coverage is absent.
- [ ] Capture the available pre-merge query/page evidence, dates and the recorded absence of backlinks. Seek backlink evidence through existing free/owner-accessible reports; no paid dependency. Reassess a mapping only if evidence exposes a real loss or distinct job.
- [ ] Publish only the agreed verified candidate under the standing Git authorization, then verify its remote SHA and hosting deployment success. If publication authorization does not cover the candidate, request confirmation with the exact commit and diff.
- [ ] Check every canonical sitemap target, all 12 merge sources, `/index.html`, `/blog/index.html`, `/privacy`, `/favicon.ico`, `/og-image.png`, robots and both tool assets. Require expected 200/type, permanent single-hop aliases, owner self-canonical and no conflicting noindex.
- [ ] Check representative old private paths return unavailable and no private draft/research path appears in deploy output. Verify actual crawler/host access if logs are available; no robots-only claim of CDN access.
- [ ] Inspect valuable excluded GSC owners through authorized URL Inspection. Record last crawl and Google/user canonical separately; preserve existing validation. Request indexing only where a specific corrected URL warrants it.
- [ ] Commit finite fixes/results. Timeouts remain inconclusive and retry through an available legitimate route; never label them as measured 404s or successful checks.

**Done:** all mappings and deployed canonical resources have evidence; unresolved authenticated indexing checks have named access blockers. A redirect implementation is no longer an unchecked promise to create merges.

### T04 — Collect a fresh acquisition baseline and reconcile attribution (P1; can collect alongside T01)

**Files:** create a dated directory under `research_notes/Analytics intelligence YYYY-MM-DD/`; update `reports/organic-growth-scorecard.md` through the existing `scripts/growth_scorecard.py`; extend its tests only if import behavior changes.

**Interface:** retain existing filenames for GSC chart/pages/queries/devices/countries/filters and GA traffic-source/install-filtered CSVs. Add `collection-manifest.json` documenting source/property, date window, timezone, filters, export time and missing files. Do not place exports under `docs/`.

- [ ] Export latest available complete GSC days plus comparable previous periods; preserve all disclosed rows, page and query dimensions, devices/countries and exclusions. Do not join anonymized queries or compare incomplete days as full days.
- [ ] Obtain store GA source/session and separately install-filtered events, preserving their window/timezone. Record any owner/test activity. Ask for owner-exported Developer Dashboard installs/uninstalls/active users/acquisition reports when browser access is blocked.
- [ ] Identify the provenance of existing ChatGPT-attributed links where evidence is available: public answer links, owner-shared links or unknown. Never assume the observed queries are ChatGPT prompts.
- [ ] Re-run the scorecard against the new directory; include validated coverage from T01 and release/redirect dates from T02–T03. Test missing files/blank values/zero denominators and keep unknowns explicit.
- [ ] Commit sanitized baseline and provenance. Record uncollected dashboard/website/product metrics as blocked or unknown; never substitute listing sessions for website visits.

**Done:** each reported metric has a source, period and denominator; a reviewer can reproduce the numbers. The October17 sample remains historical, not today's claim.

### T05 — Make website-to-store usefulness measurable without collecting mailbox data (P1; after T04)

**Files:** inspect `docs/app.js`, `docs/privacy.html`, scorecard and hosting analytics configuration. Create `internal/superpowers/specs/2026-10-26-acquisition-measurement.md` and a manual feedback record template under private research.

**Interface:** distinct measures are website landing, outbound store click, store-reported install and voluntarily observed useful cleanup. No inferred cross-surface conversion without an actual join.

- [ ] Inventory existing website/hosting measurements and owner permissions before proposing a service. First use existing lawful aggregate reports plus a small voluntary task-feedback log.
- [ ] Specify event purpose, retention, collection surface, opt-out/consent needs and owner/test handling before any tracking implementation. Candidate fields are canonical article path, sanitized source and outbound-store action; exclude tool inputs, email/domain/query strings, message IDs and mailbox contents.
- [ ] If existing aggregates/feedback answer the decision, document the deliberate no-new-tracker choice. If not, prepare the smallest concrete privacy-consistent change for review; adding a third-party tracker is not implicitly authorized by this plan.
- [ ] For an authorized implementation, test that sender-bearing tool queries, URL search/hash and arbitrary referrers cannot leak, update privacy and use separate denominators in the scorecard. No extension telemetry.

**Done:** website actions and product usefulness can be evaluated at the stated level, or the exact measurement limit is documented. No fabricated article→install attribution.

### T06 — Verify the actual package and run authorized disposable-mailbox tasks (P0 for product claims; access-gated)

**Files:** `manifest.json`, existing extension package(s), `scripts/product-facts.json`, `internal/CHROME_WEB_STORE.md`; create `reports/2026-10-26-package-and-task-verification.md` plus private sanitized evidence under `research_notes/SEO completion 2026-10-26/`.

**Interface:** separately identify repository commit/version, built ZIP manifest/hash, installed extension version/permissions and current store/dashboard version. A synthetic harness result is not a live result.

- [ ] Compare the chosen ZIP file-by-file with the intended source. Inspect owner-accessible store/installed version and actual permissions; do not infer the uploaded package solely from listing copy.
- [ ] Prepare a disposable-account seed manifest from `scripts/seo-fixtures.json` and the existing synthetic-cleanup harness. Specify allowed moves/restores and evidence to capture. Obtain explicit authorization for that account and those actions before any mail mutation; never empty Trash as part of this task.
- [ ] Run native and extension tasks: known sender; multiple senders sharing a conversation; mixed old/new/starred thread; archived receipt; large file versus high sender count; multi-account/tab identity; interrupted scan/action; Trash restoration. Capture real setup, actual query/selection, expected/observed scope and failure/unknown outcomes.
- [ ] Use existing tests and minimal fixes for reproducible defects, then repeat only affected tasks. Do not turn an uncertain outcome into success or remove safeguards for a demo.
- [ ] Update facts/help/listing draft to verified behavior. Prepare a reviewable store submission package; submission/permission changes require their own applicable authorization. Keep an honest native-Gmail fallback while store identity is unresolved.

**Done:** capability claims trace to the actual tested package and account scope, or remain explicitly qualified. No broad feature expansion is required to finish the SEO plan.

### T07 — Turn the backlog into a small, evidence-led publishing programme (P1; after T02–T05)

**Files:** `scripts/blog-topics.json`, `scripts/blog-refreshes.json`, `scripts/content-records.json`, existing private drafts; only selected owner HTML under `docs/blog/`. Keep existing generator and first-ready selection.

**Interface:** states remain draft → evidence_checked → publish_ready → published. Every promoted article has one maintained intent owner, current product version, actual source review, concrete information gain, limitations and matching hash.

- [ ] Score candidates with transparent editorial priorities: observed query exposure, practical ranking opportunity, distinct reader job, product fit, source/asset readiness and effort. Unknown search volume remains unknown; source evidence outranks a fabricated numeric score.
- [ ] Refresh exposed owners before new URLs. First families: missing selection link/bulk completion; `older_than` syntax; storage after deletion; sender cleanup while retaining recent/receipt mail; counts versus bytes; permissions/trust. Use T04 to confirm which still deserve priority.
- [ ] Review accumulated private drafts rather than regenerating them. Reject/merge overlapping drafts into owners, verify current results and official procedures, add a real example/fixture/screenshot when it contributes, and label its evidence class honestly.
- [ ] Prepare an initial batch of at most three independently reviewed assets per week, as a capacity ceiling rather than quota. If only one is ready, publish one. Four scheduled runs remain opportunities to draft/review supply, not a promise of four daily articles.
- [ ] Verify genuine answer quality, canonical/head metadata, source/claim alignment, tool links, mobile-native path, product scope and current readiness before each publication. Keep years/dates meaningful and no forced FAQ/word-count padding.
- [ ] Commit each finished asset/batch and verify deployed discovery. Do not publish all130 pending topics simply because they exist.

**Done:** a reviewed first batch is published with a maintained next-batch shortlist. Backlog production then becomes T10's continuing process rather than a claim that all future content is done.

### T08 — Complete the firsthand comparison and evidence gap (P2; after T06/access)

**Files:** extend `reports/seo-evidence-and-distribution.md`, fixture/test evidence and selected existing comparison owner; new competitor page only if its distinct job and evidence justify one.

- [ ] Select one relevant competitor using current official facts and a genuine customer decision; no paid trial or account connection without authorization.
- [ ] Run equivalent authorized disposable-account tasks using the documented protocol. Record plan/version/permissions, setup, scope failures, recovery and where each alternative wins. If timing is reported, use repeated comparable restored trials and disclose the small sample.
- [ ] Publish only supported observations with affiliation disclosure. Source-only comparison must be named source-only; an unperformed trial remains pending and is not replaced by confident marketing.
- [ ] Reuse actual permitted screenshots/demo footage and update evidence records. No fabricated testimonials, benchmarks or competitor safety claims.

**Done:** one independently reviewed firsthand comparison exists, or access/cost/data authorization is explicitly blocked and no firsthand claim is published.

### T09 — Distribute the verified assets and test ChatGPT discovery (P1/P2; after ready assets)

**Files:** existing demo/report, Medium import drafts, `reports/seo-evidence-and-distribution.md`; create a dated private `citation-checks.csv` and a distribution ledger with destination, canonical owner, attribution and observed result.

- [ ] Select 10 fixed question families from real needs: selection link, bulk completion, sender cleanup, age syntax, size recipes, full storage, storage after deletion, archive/delete, unsubscribe/backlog and permissions. Record exact prompts, search mode, date, cited URL, answer correctness and owner-test status. Run a small consistent manual sample; don't treat it as an organic ranking score.
- [ ] Check public HTML/canonicals/internal links and OAI-SearchBot host access when authorized logs are available. Preserve the existing llms.txt as optional infrastructure; do not treat it, schema or hidden assistant instructions as a citation guarantee.
- [ ] Prepare two relevant derivatives of each strongest asset: e.g. a project README/demo update and a useful tutorial/community answer. Prioritize the existing 16-second tool demo and worked examples over generic promotion.
- [ ] Review Medium drafts as imports/syndication, preserve canonical attribution to the owned original where supported and verify after publication. Obtain specific authorization before posting to Medium or a community; preparation is not permission to send.
- [ ] Do not label all outbound links ChatGPT or add internal campaign tags that manufacture attribution. Record genuine sources and exclude owner checking from acquisition claims.

**Done:** a reproducible citation-check baseline and ready distribution kit exist; authorized sends are recorded separately from prepared materials. Citation observations are not a performance guarantee.

### T10 — Close the finite roadmap and operate 28/56/84-day reviews (ongoing)

**Files:** this plan/status ledger, the historical roadmap pointer, scorecard, dated exports and release annotations.

- [ ] At release, record exact remote SHA/deployment and passing test/build/HTTP evidence. Give each task a status: not_started, in_progress, complete, blocked_access or monitoring; attach artifact/command/date/owner and next action. Do not blanket-check historical lists.
- [ ] Collect weekly complete exports. Define T0 as the first verified relevant recrawl after the measured release, not the date this plan was written. Keep redirected owner cohorts and untouched pages separate.
- [ ] At T0+28 compare the first complete 28-day cohort with a comparable prior28 window; at +56 and +84 repeat on adjacent complete windows. Record report lag, devices/countries, title/content/release changes and sample limits. Use impressions/clicks/CTR/position together; no isolated CTR claim of causation.
- [ ] Compare genuinely observed website actions, store events and task feedback separately. Evaluate relevance/usefulness and completed review coverage rather than raw article count.
- [ ] Expand a winning cluster only when new evidence supports a distinct job. Revisit losers for crawl/intent/truth problems before writing more variants; no automatic locale, mobile-app, paid-SEO or AI-product expansion.

**Done:** the finite release can be closed once T01–T03 and all available deliverables are verified. The full evidence programme is complete only when T04–T09 access-dependent work is actually fulfilled and the first post-recrawl review exists. Weekly and 28-day operation continues thereafter.

## 6. Delivery calendar and external inputs

| Window from authorized execution start D0 | Intended result | Gate |
|---|---|---|
| D0–D2 | T01–T02 release blockers and factual readiness repaired; fresh baseline collection started | Green checks, substantive evidence review, selected release revision |
| D2–D5 | T03 live/redirect verification; T04–T05 baseline/design; package comparison prepared | Actual deployment/owner access; no guessed HTTP results |
| Week2 | Authorized T06 tasks, first T07 reviewed assets, T09 citation/distribution baseline | Disposable account/actions and sufficient primary evidence |
| Weeks3–4 | T08 firsthand trial when access permits; next small asset batches; authorized distribution | No paid enrollment/outreach without the specific approval |
| T0+28/+56/+84 | Measured cohort reviews and selective expansion | Complete observed windows after relevant recrawl |

These are working estimates, not deadlines promised against unavailable access. D0 is not assumed to have happened. As of October26, an October17 release is only nine days old; a full post-release28-day result cannot yet be claimed, and later changes/recrawl can move T0 further.

Required external inputs: owner-accessible GSC/GA/store exports; installed/store package identity; explicitly authorized disposable Gmail account and actions; any necessary competitor trial permission; permission for specific public distribution. Each missing input gets a named task/blocker. Continue independent repository work while access is pending. Do not bypass refusals or re-request already supplied authorization.

## 7. Definition of complete and non-goals

**Technical/release complete:** no current test/readiness failure; reviewed facts match actual source; agreed package status is explicit; canonical owners/tools/assets and all12 redirects verified live; no private output leakage; clean repeat build and known deployed SHA; current status reconciles the actual39-article inventory.

**Evidence complete:** fresh source-separated acquisition baseline; legitimate package/task observations; measured competitor claims if published; validated ready editorial batch and authorized distribution record; first complete post-recrawl cohort review. Missing dashboard access or live tests remain blocked, never “complete by documentation.”

**Ongoing growth:** weekly collection and +28/+56/+84 reviews, selective refreshes and publication. SEO has no permanent “everything optimized” endpoint and no guaranteed ChatGPT inclusion.

Not part of this plan: build another app/backend, buy SEO software/backlinks, indiscriminately publish the entire queue, change user mail, add telemetry, replace the working generator, or migrate domains just to claim completion.

## 8. Planning references and self-review

Current primary guidance checked October26: [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) distinguishes search and training crawlers; [Google AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features) says normal search fundamentals apply and no special AI optimization is necessary. These support crawlable, useful, factual content; the editorial and measurement choices above are project-specific decisions, not claimed ranking formulas.

Coverage self-check: SEO01→T02/T06; SEO02→T03; SEO03→T04/T05; SEO04→T01/T02/T07; SEO05→T03/T07; SEO06/07→T01/T03 verification of existing tools; SEO08→T06/T08/T09; SEO09→T10. All15 historical portfolio briefs map to maintained owners/tools or explicit evidence-gated comparisons; they are not15 mandatory new pages. Source/date/hash types use existing interfaces. All five review-focus conditions have an owning verification step. No implementation has been marked complete merely by this plan.
