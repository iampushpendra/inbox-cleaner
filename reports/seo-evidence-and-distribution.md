# SEO evidence and distribution preparation

Reviewed: 2026-10-17. Status: local source review and synthetic assets prepared; no outreach, posting, mailbox mutation, account settings or tracking changes performed.

## What readers can inspect

| Asset | Added value | Evidence class |
|---|---|---|
| `/blog/inbox-cleaner-setup-permissions-recovery.html` | Account/tab selection, permission meanings, local data flow, sender-wide scope and recovery in one guide | Repository and official documentation review; one labeled synthetic example |
| `/blog/inbox-cleaner-vs-native-gmail.html` | Task-based tradeoffs with mixed-thread, overlapping-sender and count-versus-byte examples | Source-based comparison, not firsthand installed-product testing |
| `scripts/seo-fixtures.json` | Four reusable, account-free task models with expected outputs and assumptions | Synthetic library; local validation does not certify Gmail |

The information gain over the reviewed Google documentation is the connection between sender-wide extension queries, conversation-level pitfalls, sender-count overlap and storage prioritization. Google's documentation provides the underlying Gmail procedures; the extension source explains which conditions its workflow actually carries. These assets are useful for setup/implementation and workflow choice rather than another generic deletion page.

## Sources and boundaries

- Local evidence: `scripts/product-facts.json`; `internal/superpowers/specs/2026-10-17-package-truth-audit.md`; `manifest.json`, `content.js`, `parsing.js`, `popup.js` and `popup.html`. The package audit contains older broad privacy verdicts; use the newer product-facts scope separating extension, Gmail, website and legacy browser app.
- [Gmail search operators](https://support.google.com/mail/answer/7190?co=GENIE.Platform%3DDesktop&hl=en), reviewed 2026-10-17: negative exclusions do not establish that every message in a returned conversation satisfies the query.
- [Gmail deletion and recovery](https://support.google.com/mail/answer/7401?co=GENIE.Platform%3DDesktop&hl=en), reviewed 2026-10-17: native bulk selection and recovery route.
- [Chrome extension management](https://support.google.com/chrome_webstore/answer/2664769?hl=en), reviewed 2026-10-17: site access, extension management and removal.

No account-connected run, installed-package verification, real Gmail screenshots, benchmark, reclaimed-byte measurement or firsthand competitor trial was produced. No synthetic record should be used as an observed result, testimonial, network capture or current store certification. Existing primary sources need rechecking when procedures change.

## Prepared community answer: mixed starred threads

**Status: unsent.** Use only in a relevant discussion where rules allow an affiliated answer. Disclose: “I work on Inbox Cleaner.” Lead with the independent answer, add a project link only when it materially helps and is permitted.

> A Gmail search such as `before:2025/01/01 -is:starred` can still show a conversation containing a newer starred reply. Google's help explains that one matching message can bring a mixed conversation into results. Open that conversation and check the messages and action scope before bulk deletion. If you need to remove one message, Google's deletion help documents the message menu's “Delete this message” option. I work on Inbox Cleaner; its sender-wide action does not inherit that date/star query, so it is unsuitable when you need those exceptions. Our comparison uses labeled synthetic examples rather than a live test: https://inbox-cleaner.vercel.app/blog/inbox-cleaner-vs-native-gmail.html

For an actual post, link Google's search documentation directly as well as or instead of the project guide, depending on relevance and community rules. Do not paste into unrelated threads or claim a user outcome.

## Prepared tutorial excerpt: counts and storage

**Status: unsent.** Suitable for a project-owned tutorial after publication paths and copy are checked.

> A sender with more conversations is not necessarily the largest source of Gmail storage. In our synthetic example, 100 newsletters at 20 KB each total 2,000 KB, while one declared 12,000 KB message is six times larger. These invented sizes explain the arithmetic; they do not predict Gmail quota savings. Use size searches for storage cleanup, and review mixed conversations before acting. Inbox Cleaner’s sender counts are conversation/result counts, with estimates possible, rather than byte measurements. Read the worked comparison: https://inbox-cleaner.vercel.app/blog/inbox-cleaner-vs-native-gmail.html

Second owned destination: include a short “Check sender-wide scope first” note in setup/release notes pointing to the setup guide. This repurposes one evidence-backed explanation for two relevant contexts. No outbound messages or release publication are part of this report.

## Low-cost demo storyboard, not a rendered clip

Proposed duration: 40–55 seconds. Production status: storyboard only; no video, screenshots or live result exist.

| Beat | Proposed screen | Narration and evidence constraint |
|---|---|---|
| 0–7 s | Static diagram of one conversation with an old unstarred and new starred message | “One search result may contain messages you want to keep.” Burn in “Synthetic example” throughout. |
| 7–18 s | Highlight the matching old message; retain both messages inside the same conversation outline | Explain Google's documented exclusion warning; cite the help URL on screen. Do not simulate a Gmail screenshot. |
| 18–30 s | Two query cards: restricted search versus sender-wide query | Show that the extension creates a fresh sender query and does not inherit date/star conditions. Cite source version and review date. |
| 30–42 s | T1/T2/T3 set diagram and 4 versus 3 count | Show overlap; label arithmetic synthetic and counters illustrative. |
| 42–55 s | Native Gmail / sender overview decision card and setup-guide URL | Invite scope review. Say “Source review; installed package and live behavior not verified.” No “faster,” storage-saving, safety or competitor ranking claims. |

If later capturing real UI, get separate test-account authorization and record version, settings and complete outcome evidence first. Never present illustrative screens as real Gmail captures.

## Original competitor test protocol and evidence gaps

Status: **deferred external test required**. This report does not assert firsthand competitor experience. Native Gmail is the current source-based baseline. Candidate third-party participants for a future test: Clean Email, Cleanfox and Mailstrom. Names identify candidates only; feature availability, current pricing, supported providers, access requirements and product versions must be verified from each vendor's official documentation before enrolling a trial. No feature or ranking conclusion is made here.

1. Define tasks before testing: find sender backlog; retain newer/starred messages in a mixed conversation; clear one sender while retaining an archived receipt; identify large mail; recover a trashed item. Use the JSON fixture concepts as the seed specification, not as assumed provider results.
2. Obtain explicit account and action authorization for a disposable account. Never use production mail. Confirm support for the provider and relevant interface before setting anything up.
3. Record dated vendor documentation, installed/version identity, browser, plan/trial, permissions/OAuth scopes, account type, language, conversation settings and fixture IDs. Document unsupported tasks without inventing parity.
4. Give each workflow the same goal and seeded starting state. Record every query/selection/confirmation, displayed results, affected message and conversation IDs, residual mail, failures and recovery. A screenshot alone is insufficient evidence of completeness.
5. If timing is needed, define start/end and include setup and review time; run at least three independent restored trials per task. Publish all trial values, errors and operator learning effects. Do not extrapolate a tiny mailbox to large-mailbox performance.
6. Evaluate task completion and scope preservation before speed. Report interface limitations separately from a destructive mistake. Do not produce an overall winner from incomparable plans or unsupported tasks.
7. Publish only after evidence review, with affiliation disclosure and complete methodology. Avoid permanent deletion. A recovery task needs its own approved mutation and verification.

Named gaps: Chrome Web Store installed package/version and permissions; selector compatibility in current Gmail; actual mixed-thread action scope; multi-account/tab handling; sender overlap in displayed counters; real scan completion/guards; Trash recovery in the test account; competitor current official facts, active-plan identity and firsthand task results; quota measurements and reporting lag. None is closed by local fixtures or prose.

## Merge-candidate review: preserve the evidence before deciding

No redirects or merges are proposed from keyword similarity alone. Retain every candidate URL until full evidence is reviewed. Likely review sets already present in the site are the bulk/mass/thousands cluster (`how-to-bulk-delete-gmail-emails`, `how-to-mass-delete-emails-gmail`, `how-to-delete-thousands-of-emails-gmail`) and storage/full cluster (`gmail-storage-full-how-to-fix`, `gmail-storage-almost-full-what-to-do`, `gmail-mailbox-full-cant-receive-emails`, `how-to-free-up-gmail-storage`). These are review candidates, not approved destinations.

Before choosing any survivor, preserve the complete Search Console page-by-query export (all available rows, date range, country/device filters, clicks, impressions, CTR and position), page-level totals and query-page overlap. Preserve backlink/referring-page exports for every URL with target URL, source URL, anchor, follow status and retrieval date. Record external links, internal anchors, canonical/index state, conversions if legitimately available, unique intent, information and assets for each page. Keep raw exports and a dated decision record; do not truncate to a top-N query list or ignore a lower-traffic URL's backlink equity.

Decide whether pages serve different intents before merging. Only if intent and evidence support consolidation should a specific mapping, content preservation plan and publisher-approved redirect be proposed. Recheck links, sitemap, canonical and query/page performance after an approved deployment. No access to full Search Console or backlink exports was available for this asset task, so consolidation remains blocked on evidence rather than guessed.

## Delivery checks and follow-through

Local JSON/HTML checks and semantic fixture assertions are recorded in `internal/superpowers/plans/seo-evidence-assets-report.md`. Root integration must add discovery/manifest/evidence records and run the site gates. Live publication, search indexing, community publication, competitor testing and mailbox demonstrations are separate unfinished external work; no completion claim is implied.

## Status update — 26 October 2026

**Competitor comparison (T08): blocked, no firsthand claim published.** No competitor was installed, no trial was purchased and no account was connected. The candidates and protocol above remain preparation only. The existing native-Gmail comparison stays explicitly source-based. A firsthand comparison can be added only after the authorized disposable-account tasks are run with a documented method; until then, any source-only competitor section must say so.

**Distribution and citation (T09): prepared, nothing sent.** The ten fixed question families are in `research_notes/SEO completion 2026-10-26/citation-checks.csv` with blank results because no authenticated ChatGPT/search session was available. The distribution ledger is `reports/2026-10-26-distribution-ledger.md`; Medium/community sends still need specific authorization. The 16-second demo and the worked examples remain preferred over generic promotion. `llms.txt` stays optional infrastructure, not a citation guarantee.

