# SEO-08 evidence assets report

Date: 2026-10-17. Owner scope: two new guide pages, synthetic fixture library, distribution/evidence report. Root owns topic queue, evidence records, discovery, release metadata and final site gates.

## Delivered

- `docs/blog/inbox-cleaner-setup-permissions-recovery.html`: source-reviewed setup, deliberate account/tab choice, permission meanings, local data flow, website/legacy-app distinction, archived sender scope, scan/count limits, failure guidance, Gmail recovery, extension removal and links to both local tools.
- `docs/blog/inbox-cleaner-vs-native-gmail.html`: affiliated source-based decision table, native bulk-selection capability, precise-query versus sender-overview tradeoffs, mixed-age/starred conversation, sender overlap and count-versus-size examples. No installed-package or firsthand competitor test claim.
- `scripts/seo-fixtures.json`: four explicit synthetic task models, assumptions, expected values, account-free local reproduction protocol and separately deferred external observation protocol.
- `reports/seo-evidence-and-distribution.md`: unsent community answer and tutorial excerpt, a low-cost 40–55 second storyboard (no rendered video), original competitor test protocol with gaps and safeguards against claiming evidence that does not exist; full query/page and backlink review requirements for merge candidates.

Both pages use current blog structure/styles, canonical/OG URLs, valid Article JSON-LD and visible October 17, 2026 publication dates. Neither asserts an earlier publication history. Comparison table uses shared `blog-table-scroll` and `compare-table` styles, a named region and keyboard focus. There are no inline style blocks, rendered Gmail screenshots or invented observed results.

## Source review

Read `scripts/product-facts.json`, the package-truth audit, manifest, popup setup/cache/confirmation flow, parsing and content-script queries/actions. The older audit's broad privacy verdicts are qualified by current product facts and the new guides' explicit surface separation. Current source reports unverified batches rather than guaranteeing success; the guides never present a click as a verified result.

Fetched and reviewed Google primary documentation on 2026-10-17:

- https://support.google.com/mail/answer/7190?co=GENIE.Platform%3DDesktop&hl=en — search operators, especially mixed-conversation negative exclusion caveat.
- https://support.google.com/mail/answer/7401?co=GENIE.Platform%3DDesktop&hl=en — native selection beyond the visible page, individual-message deletion and Trash recovery.
- https://support.google.com/chrome_webstore/answer/2664769?hl=en — installation, site-access controls and removal.

The new guides add the connection between documented native behavior, reviewed sender-wide extension queries and original synthetic examples. They do not manufacture mailbox experience. Candidate competitor names in the internal report identify future research participants, with all current features, plans, scopes and firsthand task results left unverified.

## Verification performed

- Parsed both articles with Python's HTML parser: one H1 and English language per page.
- Ran `scripts.content_gate.check_post` with `today=date(2026,10,17)` for each new page: both return no problems. This checks canonical/meta/date/JSON-LD, current disproved-claim patterns and all local link targets.
- Loaded JSON and asserted all four fixture calculations: mixed message/thread membership, prior versus sender-wide scope, sender-count sum versus union and decimal KB arithmetic/ratio. All pass. This is local model validation, not Gmail validation.
- `git diff --check`: pass.
- Editorial passes: structure, procedural/source accuracy, evidence labels, scope/limits and metadata/link review. Replaced the gate-triggering negative phrase “no one-click Undo” with plain Undo wording while preserving its limitation.

No global generator run was performed here: root is adding the new publish-ready evidence/topic records before running discovery generation. No browser/live visual check, installed extension run, mailbox mutation, competitor trial or production URL verification is claimed. Local link existence establishes only repository targets, not current deployment.

## Root integration

Register these slugs with distinct intent ownership and published status only after the root evidence review: `inbox-cleaner-setup-permissions-recovery`, `inbox-cleaner-vs-native-gmail`. Use `verification_kind: source_review`, repository and Google sources, and synthetic assets explicitly labeled. Fixture reference: `scripts/seo-fixtures.json`. Report source review identity as an agent, verified date 2026-10-17, extension manifest 3.2.1; derive fingerprints from final authored files after edits. No record should imply a live mailbox run.

Related targets: `/blog/how-to-bulk-delete-gmail-emails.html`, `/blog/how-to-delete-old-emails-gmail.html`, `/blog/gmail-delete-emails-by-size.html`, `/blog/how-to-free-up-gmail-storage.html`, `/blog/gmail-select-all-conversations-not-showing.html`, both new pages and both `/tools/` pages linked within the guides. Run generator/check gates after root registration; use new source hashes if authored copy changes.

Pending external evidence: installed store version/package/permissions, real Gmail selectors and account/tab behavior, complete scan and overlapping count observations, actual mixed-thread action scope and recovery, competitor official current facts and firsthand task trials, storage quota observations/lag, current deployment/links, full Search Console page-query and backlink exports. No outreach, account changes, tracking or automatic redirect actions were taken.
