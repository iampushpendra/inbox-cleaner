# Inbox Cleaner roadmap and model assignments

> **For agentic workers:** Use `superpowers:executing-plans` for approved implementation work, or `superpowers:subagent-driven-development` if the user chooses delegation. Each unchecked task is proposed work, not work already completed.

**Goal:** Make local Gmail cleanup predictable and trustworthy, then add safer cleanup choices and carefully validated maintenance features.

**Architecture:** Keep the current Manifest V3 extension, vanilla JavaScript, Gmail DOM automation and local storage. Share the account, scope and operation rules between scan, preview, action and receipt. Treat the separate OAuth browser app as a separate product surface; a roadmap task does not silently migrate the extension to a cloud service.

**Tech stack:** `popup.html`, `popup.css`, `popup.js`, `content.js`, `parsing.js`, Chrome extension APIs and Node's built-in test runner.

**Source:** [SEO roadmap](2026-10-17-seo-roadmap.md), [organic growth audit](../../../reports/Inbox%20Cleaner%20organic%20growth.md), [analytics intelligence](../../../reports/2026-10-17-analytics-intelligence.md), and [Competitive teardown](../../../reports/Inbox%20cleaner%20extension%20teardown.md), researched 17 October 2026. Model assignments are engineering recommendations, not benchmarks or promises of correctness.

**Status:** Proposed roadmap, prepared 17 October 2026. This change creates planning documents only. Implementation, store submission, pushes and rollout are separate actions.

## The sequence

Ship trust before breadth. The initial deliverable should help a person answer five questions: which Gmail account is active, what was scanned, what the number means, what the action affects, and how to recover. Expand only after those answers remain correct during interrupted runs and account changes.

| Milestone | Tasks | Result | Exit gate | Suggested product release |
|---|---|---|---|---|
| 0. Establish the truth | R01–R02 | Verified package/story and documented action contract | Source, published build and permission differences are recorded; count entity is defined | Preparation for 3.3 |
| 1. Trustworthy cleanup | R03–R09 | Account binding, truthful scope, preview, progress and receipt | Two-account and partial-failure cases pass; unsafe ambiguity blocks action | 3.3.0 |
| 2. Clear first use | R10–R14 | Better onboarding, accessible controls and validated first-run flow | People can predict the action and recover without coaching | 3.4.0 |
| 3. Safer choices | R15–R19 | Protection filters, archive, age rules and gated recovery | Preview and action use identical policies; restoration is demonstrated or withheld | 3.5.0 |
| 4. Maintain selectively | R20–R23 | Guided unsubscribe, local maintenance rules, optional storage insight | Feasibility and privacy gates pass before each capability ships | 3.6+; separate releases |
| 5. Broaden on evidence | R24–R26 | Optional wider workspace, locales and transparent commercial model | Demand and maintenance capacity justify each addition | Unscheduled |

Acquisition delivery is a coordinated track: **R27–R34**, detailed in the [SEO roadmap](2026-10-17-seo-roadmap.md). Start factual repairs and the observed-page refreshes alongside R01/R02; tools and growth claims must respect the relevant safety contracts. Growth work does not make the remaining runtime milestones prerequisites for correcting native Gmail instructions.

Versions are proposed grouping, not delivery dates. Use a major version only for an actual breaking contract or architecture change. A small team can ship each milestone independently; conditional tasks may be declined without blocking the reliable cleanup core.

## Model types and exact assignments

“Model required” means the recommended development/review capability. These models help build the extension; **the shipped cleanup flow needs no AI model, AI API key, email upload or inference service**. An LLM must never decide which mail to move in the core flow.

| Code | Model type | Recommended Codex model | Reasoning | Appropriate work |
|---|---|---|---|---|
| L | Efficient, tightly scoped worker | `gpt-6-luna` | `medium` | Approved copy, release notes, small static documentation changes |
| S | General implementation engineer | `gpt-6.1-sol` | `high` | Bounded UI, tested integrations, progress rendering and feature implementation |
| V | Visual implementation/review | `gpt-6.1-sol` | `xhigh` | Screenshot-informed layout, hierarchy, accessibility and state consistency |
| A | Deep reasoning and safety design | `gpt-6-astra` | `xhigh` | Account isolation, query scope, cancellation races, recovery feasibility and adversarial review |
| H | Human tester or product owner | No model substitute | Not applicable | Observed usability, disposable-mailbox verification, business choices and release authorization |

These exact identifiers and effort levels are exposed by this Codex session. Availability elsewhere must be checked in that model picker. The assignments below are my recommendations; they are not official per-task requirements. [Official OpenAI model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection) describes the broad capability/cost tradeoffs and recommends testing the lightest setting that meets the quality bar. No token-price or completion-time estimate is assumed here.

For each task, **Build** gives model type and therefore exact model/effort from this legend; **Review** gives an independent fresh-context check. A review can be a new pass in the same chat with only the diff and requirements; parallel agents are optional. Human validation is required where actual Gmail behavior or user comprehension is the evidence. Start routine work with S; escalate to A when the failure case or scope remains unresolved. Do not keep regenerating with a cheaper model after two materially failed attempts.

## Constraints and review focus

- Preserve local extension processing and existing permissions by default. Any new permission, cloud path or server data retention needs an explicit design decision before implementation.
- Distinguish sender unsubscribe requests, future filtering, archive, Trash and permanent deletion. Never call filtering “unsubscribe.” No permanent-delete feature is in the committed core scope.
- No preselected senders. Counts and confirmations must use the same account, entity and query scope as the action.
- Do not claim exact message counts when Gmail evidence only supports conversation counts or estimates. Do not claim storage reclaimed when mail only moved to Trash.
- Preserve the last complete scan when a new run fails. Unknown account, stale scope or ambiguous action state must disable further mutation until resolved.
- Gmail-page automation requires an available Gmail tab and must cope with navigation and DOM changes. Do not promise browser-closed background work.
- Use fixtures and disposable Gmail data for mutation tests. Record which UI paths were actually exercised; screenshots and unit tests alone do not prove live behavior.
- Commit each independently verified task. Update CHANGELOG, README and version metadata at actual release boundaries; keep the extension manifest aligned when runtime changes ship. Do not push, publish or rewrite history without authorization.

| Review condition | Required behavior | Owning task |
|---|---|---|
| Account A results while account B is active, or missing identity | No cross-account action; explain and require resolution | R03 |
| Approximate count, threaded results, archived mail or overlapping sender matches | Preserve uncertainty and avoid false totals | R02, R04, R05 |
| Popup close/reopen, Gmail navigation or another run during mutation | One operation owner; stop at a safe boundary; no duplicate submission | R06–R08 |
| Action partly succeeds, selectors change, or completion cannot be verified | Report verified/unknown outcomes separately; never show unconditional success | R07–R09 |
| Starred/important/unread exclusions or restoring previously trashed mail | Same-policy preview/action; no restoration outside the original operation | R15, R18, R19 |

## Milestone 0: Establish the truth

### R01 — Verify the distributed product and align the story

**Build:** L for copy after S performs package/permission verification. **Review:** S. **Depends on:** none. **Size:** Small, plus store access. **Human:** publisher verifies the distributed package and authorizes submission.

- [ ] Record local manifest/version/permissions and the actual installed store package/version/permissions. A public listing snapshot alone is insufficient to establish runtime behavior.
- [ ] Draft consistent extension versus browser-app descriptions covering OAuth, local processing, open-Gmail requirement, scan duration and Trash behavior. Update screenshots and listing copy only to demonstrated behavior.
- [ ] Check every install CTA reaches the intended verified listing. Produce a before/after release checklist; keep submission separate.

**Touchpoints:** `manifest.json` description, `README.md`, `docs/CHROME_WEB_STORE.md`, `docs/index.html`, `docs/privacy.html`, `scripts/site-config.json` and publisher-console copy.

**Done when:** A reviewer can trace each public claim to tested behavior or an explicitly qualified limitation; package mismatches have a concrete resolution. Avoid changing permission claims based solely on the teardown's suspected mismatch.

### R02 — Define count, scope and operation contracts

**Build:** A. **Review:** A. **Depends on:** none. **Size:** Medium investigation. **Human:** checks threaded/unthreaded Gmail fixtures.

- [ ] Determine which Gmail counters represent conversations versus messages under supported settings. Define the displayed unit and when a count can be called exact.
- [ ] Write the shared account/snapshot/query/operation contract. Separate category discovery from All Mail action scope, estimates from observed totals, and attempted actions from verified results.
- [ ] Specify deduplication and query-union counting so one conversation matching several senders is not added twice. Document invalidation when a preview ages or Gmail state changes.

**Touchpoints:** `parsing.js`, `content.js`, `popup.js`; create `docs/superpowers/specs/2026-10-17-cleanup-contract.md` during implementation.

**Done when:** A small seeded mailbox with multi-sender threads, archived mail and estimated counts has unambiguous expected labels and outcomes. Do not lock premature method signatures before this investigation resolves the entity.

## Milestone 1: Trustworthy cleanup

### R03 — Bind account, tab, cache and action

**Build:** A. **Review:** A. **Depends on:** R02. **Size:** Large. **Human:** two Gmail accounts.

- [ ] Resolve stable account identity from supported Gmail UI evidence; `/u/0` alone is not a stable cross-session account key. Show the verified address.
- [ ] Namespace scan cache by account; migrate unbound legacy data to view-only or discard it. Bind each run to the initiating account/tab and revalidate before every mutation boundary.
- [ ] Block unknown/mismatched identity, disconnected tabs and stale cached actions with a specific route back to a valid scan.

**Touchpoints:** `findGmailTabId()`, `sendToContent()`, cache initialization in `popup.js`; storage and message handlers in `content.js`; `popup.html`; extend `test/content.test.js`, create `test/popup.test.js`.

**Done when:** Tests cover account A→B switching, multiple tabs, reload, missing identity, stale cache and account changes during a run; none can act against the wrong account. Unknown identity fails closed without exposing a fallback mutation path.

### R04 — Preserve count confidence and scope in every state

**Build:** S. **Review:** A. **Depends on:** R02, R03. **Size:** Medium.

- [ ] Use one formatter/summary contract for row counts, selected totals, confirmation and receipt. Preserve estimated qualifiers and the selected entity.
- [ ] Explain that category badges describe discovery and archived matches can be affected. Show sender name plus full email address; do not silently round a destructive total.
- [ ] Handle mixed exact/approximate selections and multi-sender overlap according to R02.

**Touchpoints:** `parsing.js`, `updateActionBar()` and confirmation logic in `popup.js`, `popup.html`; `test/parsing.test.js`, `test/popup.test.js`.

**Done when:** Exact, approximate, mixed, zero, large and overlapping selections never acquire an unsupported exact total. The same account/unit/scope appears at review and action.

### R05 — Add sender drilldown and batch preview

**Build:** S. **Review:** A. **Depends on:** R03, R04. **Size:** Large.

- [ ] Add “View messages in Gmail” per sender and a read-only batch preview using the canonical action query.
- [ ] Show account, selected senders, entity/count confidence, exclusions and archived-mail inclusion in the final review. Revalidate account and policy when confirming; changed scope requires review again.
- [ ] Keep scan/preview free of mail-state mutations; never render arbitrary sender text as trusted HTML.

**Touchpoints:** `popup.html`, `popup.css`, `popup.js`, query builders in `parsing.js`, navigation helpers in `content.js`; parsing/popup/content tests.

**Done when:** Preview and execution consume the same policy/query, a changed account invalidates review, hostile display names render as text, and no mail moves during scan or preview.

### R06 — Give runs a single owner and observable lifecycle

**Build:** A. **Review:** A. **Depends on:** R03. **Size:** Large.

- [ ] Introduce account-bound operation IDs and states: idle, discovering, counting, reviewing, executing, stopping, completed, partial, failed and cancelled where applicable.
- [ ] Prevent concurrent scan/action work from sharing Gmail navigation; reject duplicate action submissions and ignore stale progress from old runs.
- [ ] Rehydrate truthful progress after popup reopening. Invalidate execution after Gmail navigation if the current operation context cannot be established.

**Touchpoints:** run state/broadcast/message handlers in `content.js`, initialization and listeners in `popup.js`; `test/content.test.js`, `test/popup.test.js`.

**Done when:** Rapid double-click, two popups/tabs, late broadcasts, reload and disconnect do not start duplicate mutations or attribute another run's progress to the current account.

### R07 — Add real cancellation and interruption handling

**Build:** A. **Review:** A. **Depends on:** R06. **Size:** Large.

- [ ] Add cancellation checks around category pages, sender counting and action batches; “Stop after current batch” must describe the actual boundary.
- [ ] Never imply an already-submitted Gmail action was rolled back. Mark uncertain batches unknown and require reconciliation before retry.
- [ ] Preserve the last complete scan and distinguish cancelled discovery from complete results. Add resume only if checkpoints can be revalidated; otherwise offer a fresh scan.

**Touchpoints:** scan/count/delete loops in `content.js`, controls and status in `popup.*`; content/popup tests.

**Done when:** Stopping before/during/after a batch cannot create a false success or blind retry; closing the popup is not treated as cancellation unless implemented that way.

### R08 — Make progress explain the wait

**Build:** S. **Review:** V. **Depends on:** R06, R07. **Size:** Medium.

- [ ] Render separate “Discovering senders” and “Verifying counts” phases, category/page context, elapsed time and the current safe stop state.
- [ ] Use determinate progress only with a known denominator; avoid fabricated ETA and misleading percentages across phases.
- [ ] Explain that Gmail navigation is expected and show incomplete-scan recovery without overwriting good cached results.

**Touchpoints:** `popup.html`, `popup.css`, progress rendering in `popup.js`; popup state fixtures.

**Done when:** Long sender addresses, unknown result counters, stalled pages, reopened popup and narrow displays preserve readable status and one clear next action.

### R09 — Produce a verified completion receipt

**Build:** S. **Review:** A. **Depends on:** R04–R07. **Size:** Large.

- [ ] Record account, timestamp, action, scope, batches and verified outcomes. Separate moved, skipped, failed and unknown; label unsupported per-message totals as unknown rather than inventing them.
- [ ] Provide “Open Trash,” “Review affected mail” where identifiable, and accurate recovery instructions. Say “Moved to Trash,” not “storage freed.”
- [ ] Store only the local history necessary for support/recovery, with a clear retention setting and “Clear local history.” Avoid email bodies and cloud telemetry.

**Touchpoints:** `content.js`, `popup.*`, local storage schema; create a focused local history helper only if shared logic warrants it; tests for partial outcomes and storage cleanup.

**Done when:** Fully successful, partial, failed and unverifiable runs have distinct receipts; rerunning cannot silently assume unknown batches failed. History deletion does not restore or delete mail.

**Milestone 1 gate:** Pass seeded two-account and interruption scenarios, review the full diff with A, and verify the actual packaged extension. Ship this core before adding more action types.

## Milestone 2: Clear first use

### R10 — Build a short, truthful onboarding path

**Build:** V. **Review:** S. **Depends on:** R03, R08, R09. **Size:** Medium.

- [ ] Use one primary entry: “Scan Gmail senders.” Show verified account, five-category coverage, minutes-long expectation, local operation and no movement before confirmation.
- [ ] Add “Open Gmail” for a missing tab and distinguish it from an already-open tab requiring reload. Avoid an unexplained Retry dead end.
- [ ] Show a short Scan → Review → Move to Trash sequence and an honest completion route back to Gmail.

**Touchpoints:** `popup.*`, first-use help in `README.md`; popup state tests for missing/disconnected Gmail.

**Done when:** A first-time user can identify prerequisites and the next action in every empty/error state; closing/reopening does not repeat unnecessary onboarding or hide scan state.

### R11 — Polish hierarchy, labels and selection

**Build:** V. **Review:** V. **Depends on:** R04, R05, R10. **Size:** Medium.

- [ ] Replace ambiguous Clear/refresh-only actions with “Clear selection” and labeled Rescan. Keep one primary action with qualified affected quantity.
- [ ] Make full address, category meaning and count confidence available without relying on color or truncation. Scope “Select all” to an explicit denominator: visible, filtered or all results.
- [ ] Maintain deliberate selection across sort/search, show hidden selected items, and never preselect senders.

**Touchpoints:** `popup.*`; selection/search/sort tests in `test/popup.test.js`.

**Done when:** Search changes cannot hide selected destructive scope; long names, zero results and many selected rows leave the next action legible. Review screenshots of all major states at the actual popup size.

### R12 — Verify accessibility and both themes

**Build:** V. **Review:** V plus H. **Depends on:** R10, R11. **Size:** Medium.

- [ ] Measure light/dark contrast, including primary-button text; meet WCAG AA text contrast targets of 4.5:1 for normal text and 3:1 for large text.
- [ ] Verify keyboard selection, visible focus, dialog focus containment/return, Escape cancellation before action, accessible checkbox labels and restrained progress announcements.
- [ ] Test zoom, reduced motion and non-color count confidence. Retain the compact layout without clipping essential action scope.

**Touchpoints:** `popup.html`, `popup.css`, dialog/status code in `popup.js`; rendered browser checks plus targeted keyboard regressions.

**Done when:** Keyboard-only completion works in a seeded profile, measured contrast passes and assistive-tech checks identify the account/action. Model visual review alone does not satisfy this gate.

### R13 — Improve large-list responsiveness without a rewrite

**Build:** S. **Review:** S. **Depends on:** R11. **Size:** Medium, conditional on measurement.

- [ ] Profile 250, 1,000 and 10,000 synthetic senders; record render/search/selection times and hardware.
- [ ] Remove measured bottlenecks with batching or incremental rendering. Add virtualization only if the measurements justify it and selection/accessibility remain intact.
- [ ] Keep filtered totals and off-screen selections correct; document scan cost separately from list rendering cost.

**Touchpoints:** list rendering in `popup.js`, `popup.css`; large-list fixtures in popup tests.

**Done when:** Before/after measurements show a meaningful improvement where needed with no missing rows or changed selected scope. If the existing list meets the agreed responsiveness target, close with evidence and no new abstraction.

### R14 — Run a small observed usability round

**Build:** S prepares tasks/synthesis. **Review:** H owns observation; A reviews safety findings. **Depends on:** R09–R13. **Size:** Small study, participant scheduling external.

- [ ] Ask five new users to identify account, explain scan coverage, interpret an estimate, inspect a sender, predict archived-mail impact, cancel and find recovery.
- [ ] Record prediction errors, hesitation, abandonment and assistance; exclude mailbox content from notes. Compare against the original flow where feasible.
- [ ] Fix every wrong-account or unintended-scope misunderstanding before release. Aim for at least four of five users completing the core path without coaching; this is a small-study gate, not statistical proof.

**Touchpoints:** create `research_notes/Inbox Cleaner usability/` with anonymized protocol/results during execution; fixes go to their owning UI task.

**Done when:** Actual observations, not model-simulated users, support the first-use release. Keep unresolved issues visible.

## Milestone 3: Safer choices

### R15 — Add consistent protection filters

**Build:** S. **Review:** A. **Depends on:** R02–R05, R09. **Size:** Large.

- [ ] Offer explicit starred/important exclusions, initially on for the new safe policy; offer “Keep unread” separately. Show the chosen policy before preview and action, including how conversation-level semantics affect mixed threads.
- [ ] Apply one canonical filter to preview counts and mutation. Reject unsupported exclusions rather than displaying a protection checkbox that is not enforced.
- [ ] Recount when policy changes; never silently reuse the prior all-sender count.

**Touchpoints:** query builders in `parsing.js`, `content.js`, `popup.*`; query and seeded mixed-thread tests.

**Done when:** Each protected fixture survives, preview agrees with actual affected entities, and users can see when they explicitly include protected mail. If Gmail cannot enforce a promised conversation-level policy safely, withhold that option.

### R16 — Add Archive as a separate cautious action

**Build:** S. **Review:** A. **Depends on:** R05, R09, R15. **Size:** Medium.

- [ ] Offer Archive and Move to Trash as separate named choices; explain that Archive removes Inbox placement and keeps mail searchable, without stopping future mail or freeing quota.
- [ ] Reuse the review contract and protection policy, while defining an Inbox-only actionable archive scope so already-archived matches do not inflate the affected total.
- [ ] Track archive outcomes separately in receipts; do not reuse Trash recovery language.

**Touchpoints:** `popup.*`, action execution in `content.js`, queries in `parsing.js`; archive-scope and receipt tests.

**Done when:** Preview/action match for Inbox versus archived fixtures and users can explain both actions before confirming.

### R17 — Add age filters and a few understandable presets

**Build:** S. **Review:** A. **Depends on:** R15, R16. **Size:** Large.

- [ ] Add an explicit “Before date” filter and proposed presets for old promotions and old social notifications. Display the resolved cutoff, account, category, action and protections.
- [ ] Keep presets review-only until the user confirms; handle date boundaries and timezone consistently in query construction.
- [ ] Prototype “Keep newest N” as a separate feasibility subtask. Do not ship it until ordering, mixed threads, pagination and exact preservation are demonstrated.

**Touchpoints:** `parsing.js`, `content.js`, `popup.*`; cutoff-boundary, thread and pagination tests.

**Done when:** Mail on both sides of a cutoff matches the preview; a preset never implies it protects important mail unless that policy is actually active. Keep-newest-N can remain unshipped without blocking date filters.

### R18 — Prove precise recovery is feasible

**Build:** A. **Review:** A. **Depends on:** R09, R15. **Size:** Large investigation; decision gate.

- [ ] Evaluate stable entity identifiers versus temporary per-operation Gmail labels. Determine whether marking/restoring changes other labels or exceeds the intended local DOM constraints.
- [ ] Demonstrate isolation of newly moved entities from messages already in Trash and from unrelated later arrivals. Define retention, missing/deleted entities and partial-label cleanup behavior.
- [ ] Write a go/no-go decision. If exact restoration cannot be proven, keep Open Trash/recovery guidance and do not advertise one-click Undo.

**Touchpoints:** create `docs/superpowers/specs/operation-recovery.md`; disposable fixtures and experimental `content.js` work isolated until approved.

**Done when:** A reproducible experiment establishes the original operation's entity set and correct prior-state restoration, or records why the feature is deferred. An overbroad sender restore query is rejected.

### R19 — Implement operation history and precise Undo if proven

**Build:** A. **Review:** A plus H. **Depends on:** R18 go decision. **Size:** Large; conditional.

- [ ] Restore only entities belonging to the selected operation and only prior labels/state that were tracked. Display partial restoration and unavailable entities honestly.
- [ ] Make duplicate Undo idempotent, bind to the original account and apply retention/clear-history rules.
- [ ] Explain that Undo cannot reverse an unsubscribe request or recover permanently deleted mail.

**Touchpoints:** history helper/storage, `content.js`, `popup.*`; original-Trash, changed-label, account-switch, repeated-Undo and partial-failure tests.

**Done when:** The disposable mailbox returns to the tracked prior state without affecting preexisting Trash or later messages. No broad restore fallback is allowed.

## Milestone 4: Maintain selectively

### R20 — Add guided, truthful unsubscribe

**Build:** A for feasibility, S for bounded UI. **Review:** A plus H. **Depends on:** R10, R14. **Size:** Large; conditional.

- [ ] First investigate Gmail-native unsubscribe availability and outcomes. Prefer a guided user-confirmed flow; avoid opening or fetching arbitrary untrusted unsubscribe links automatically.
- [ ] Separate “Unsubscribe” from “Move past mail to Trash.” Default historical cleanup off and require its own preview/consent if selected.
- [ ] Report requested, manual step required, unsupported and failed. Request acceptance is not proof that a sender will stop future delivery.

**Touchpoints:** optional focused unsubscribe helper, `content.js`, `popup.*`, privacy/help documentation; native-supported/unsupported fixtures and seeded manual checks.

**Done when:** A real sender request is distinguished from filtering and no irreversible external request is described as undoable. If native behavior is unreliable, ship a guide to Gmail Manage subscriptions instead of brittle mass automation.

### R21 — Evaluate an explicitly named future-mail rule

**Build:** A. **Review:** A plus H. **Depends on:** R15, R20. **Size:** Large; optional.

- [ ] Evaluate “Move future mail to Trash” as an independent Gmail filter policy, not an unsubscribe fallback hidden from users. Describe whether Gmail stores/runs the filter after the extension closes.
- [ ] Require a separate rule preview and explicit save, with a visible rule-management/removal path. Do not overwrite unrelated Gmail filters.
- [ ] Assess settings permissions/API/DOM reliability before committing to implementation; reject silent OAuth expansion.

**Touchpoints:** new rule design document first; then narrowly scoped execution/UI if approved.

**Done when:** Rule creation, identification and removal are proven without touching unrelated settings, or the task closes as deferred with a documented feasibility reason.

### R22 — Add local cleanup reminders before unattended automation

**Build:** S; A designs any mutation scheduling. **Review:** A. **Depends on:** R06–R09, R17. **Size:** Medium for reminders; Large for automation.

- [ ] Save a reviewed local policy and offer a reminder to preview it again. Revalidate account and counts on each run.
- [ ] Add `chrome.alarms`, a worker or notification permissions only if justified by the selected reminder mechanism. Explain browser-open requirements, sleeping/offline delays and missed reminders.
- [ ] Default unattended mutation off. Treat automatic execution as a separate go/no-go design with expiry, kill switch, conflict handling and reproducible recovery.

**Touchpoints:** `manifest.json` only when justified, an optional focused worker, local policy storage, `popup.*`; restart/time-change/missed-run fixtures.

**Done when:** A reminder never implies a cleanup occurred and saved policies cannot execute against another account. Reminder-only shipping is a complete acceptable outcome.

### R23 — Explore storage insights without fake precision

**Build:** S; A for feasibility decisions. **Review:** A. **Depends on:** R02, R09, R17. **Size:** Medium investigation; optional feature.

- [ ] Evaluate local Gmail size/attachment search evidence. Show estimates or size bands when bytes cannot be measured, and record missing coverage.
- [ ] Keep “messages moved” separate from actual quota reclaimed. Explain the Trash lifecycle and direct users to Gmail's storage management when appropriate.
- [ ] Do not add body/attachment downloads or server processing merely to fill a storage chart.

**Touchpoints:** parsing/query helpers, read-only report UI, documentation.

**Done when:** Every number has a defined unit, coverage and confidence. If meaningful size estimates are unsupported, ship count-only insight rather than an invented GB-saved metric.

## Milestone 5: Broaden on evidence

### R24 — Consider a larger workspace and additional accounts/providers

**Build:** V for workspace; A for architecture. **Review:** A. **Depends on:** R13, R14; separate design for each expansion. **Size:** Large; optional.

- [ ] Compare the existing popup with a side panel/full-tab results view using large-list tasks. Adopt a second surface only if it measurably improves review without divergent state.
- [ ] Keep multi-Gmail support account-bound. Treat Outlook, Yahoo and other providers as separate adapters/specs, not Gmail-selector variations.
- [ ] Do not combine this with a framework rewrite or a cloud backend by default.

**Touchpoints:** layout/message state and manifest if a new surface is chosen; new provider modules only after separate feasibility approval.

**Done when:** Evidence justifies the larger surface or provider and the same account/policy/receipt contract remains intact. No expansion is a valid decision.

### R25 — Expand language support safely

**Build:** S. **Review:** A for selectors; H native-language verification. **Depends on:** R14. **Size:** Large per initial locale.

- [ ] Inventory English-dependent selectors and copy; distinguish translated extension text from actual Gmail-locale compatibility.
- [ ] Add one demanded locale at a time with fixtures for dates, counters, controls and pluralization. Prefer stable attributes where verified.
- [ ] Block unsupported Gmail locales with actionable guidance instead of silently scanning or mutating incorrectly.

**Touchpoints:** `content.js` selectors, `parsing.js`, `popup.*`, optional Chrome `_locales/`; locale regression fixtures.

**Done when:** Native-language tests cover scan, preview, action, failure and recovery. Translation alone does not qualify as support.

### R26 — Decide commercial scope and maintain public claims

**Build:** S for decision analysis, L for approved copy. **Review:** H owns pricing; S verifies consistency. **Depends on:** R01, R14 and demonstrated feature value. **Size:** Medium; optional monetization.

- [ ] Evaluate whether paid convenience features are warranted; keep the existing core proposition explicit. State all trial/free limits before scan investment or checkout.
- [ ] If billing is approved, create a separate implementation plan covering checkout, licensing, cancellation, refunds and local-privacy implications. Do not quietly add a tracking or payment backend in a copy task.
- [ ] Maintain screenshots, permissions, versions, accessibility status and support recovery guidance for each release. Ask for a rating only after a verified useful result, never in place of the receipt.

**Touchpoints:** public docs/site/listing; new billing code only under an approved separate plan.

**Done when:** The owner has a documented commercial decision, public terms agree across surfaces and entitlement failures cannot block a safety/recovery path.

## Organic growth delivery: R27–R34

These tasks integrate every audit finding and all 15 page/tool briefs into product delivery. The [SEO roadmap](2026-10-17-seo-roadmap.md) owns detailed SEO-01–SEO-09 checklists, B01–B15 briefs, evidence windows, proposed files and the 30/60/90-day review plan. Existing R01–R26 identifiers, dependencies and feature gates remain unchanged. All new tasks are proposed.

### Evidence and sequence

The September 17–October 14 cohort has 13 search clicks / 1,847 impressions. Refresh select-all (534 impressions, position 11.0), size-deletion (112, 7.6), urgent mailbox-full (97, 7.5), biggest-mail (116, 11.7) and older-than-year (148, 13.8), alongside the homepage. Full-history metrics use a different window; do not substitute them silently.

Indexing updated October 12 has 29 indexed / 16 discovered-not-indexed, not a current 29/50 rate. The 50 live sitemap destinations returned 200; keep the generator. Six store-linked GA install events are listing observations, not website conversion or successful cleanup. Four attributed ChatGPT events need source/owner-test review. No usage data proves every proposed product feature is needed.

| Product task | SEO owner | Growth-audit ticket coverage | Portfolio briefs |
|---|---|---|---|
| R01/R02 + R27 | SEO-01 | GROW-01–03 | B01, B14 |
| R28 | SEO-02 | GROW-04 | Shared infrastructure |
| R29 | SEO-03, SEO-09 | GROW-05 | Measurement across all briefs |
| R30 | SEO-04 | GROW-06 | Quality gate across B01–B15 |
| R31 | SEO-05 | GROW-07 | B02, B03, B07–B12 |
| R32 | SEO-06 | GROW-08 | B04, B05, B09 |
| R23 + R33 | SEO-07 | Diagnostic expansion | B06, B07, B11 |
| R34 | SEO-08 | Evidence/distribution expansion | B13–B15 |

### R27 — Repair the acquisition story and risky instructions

**Build:** S; L only for verified copy. **Review:** S; A for scope/thread safety. **Depends on:** R01/R02 evidence. **Priority:** P0. **SEO owner:** SEO-01.

- [ ] Review all 47 guides and metadata against installed behavior; classify the 41 API and 33 Connect Gmail body matches by actual product surface.
- [ ] Correct native Gmail bulk-selection limits, scheduled age-filter claims, blanket record-retention advice and extension-vs-manual protection assumptions.
- [ ] Align homepage, privacy, setup/recovery and prepared store descriptions; make extension installation primary while explicitly deciding the supported browser-app route.

**Touchpoints:** docs/index.html, docs/privacy.html, docs/blog/*.html, README.md, docs/CHROME_WEB_STORE.md, manifest description, scripts/site-config.json and proposed scripts/product-facts.json.

**Done when:** Each claim has evidence and product scope; no known dangerous instruction remains; current package/version and recovery language agree across surfaces. Store submission is distinct from drafting. Do not overwrite concurrent fact-audit work or mark it complete from its presence alone.

### R28 — Consolidate public delivery and fix finite SEO hygiene

**Build:** S. **Review:** S. **Depends on:** preferred-host decision; coordinate with R30. **Priority:** P1. **SEO owner:** SEO-02.

- [ ] Normalize index aliases, add privacy canonical and migrate old-host links with appropriate redirects/static fallback.
- [ ] Restore valid favicon/share image and exclude internal strategy/spec/store notes from deployment using an allowlisted output.
- [ ] Keep existing sitemap/discovery generation; inspect important exclusions and recheck after crawl without ritual mass resubmission.

**Touchpoints:** vercel.json, scripts/build_site.mjs, scripts/site-config.json, docs assets/canonicals/robots/sitemap and test/site.test.js.

**Done when:** Canonical destinations/assets respond correctly, internal documents are not public, builds remain repeatable and no useful URL silently disappears. No invented crawl/indexing/CWV guarantee.

### R29 — Maintain separate search, listing and product scorecards

**Build:** S. **Review:** S; A reviews any privacy-sensitive event design. **Depends on:** none for existing data, R01 before new collection. **Priority:** P1. **SEO owner:** SEO-03/09.

- [ ] Preserve source/date/filter/time-zone metadata, adjacent 28-day search windows and a fixed refreshed-page cohort; annotate releases.
- [ ] Separate listing GA installs from website CTA clicks and successful cleanup. Record unknown Dashboard metrics and owner/test attribution limits.
- [ ] Use voluntary feedback before extension telemetry; specify any minimal website events independently, excluding personal mailbox/query data.

**Touchpoints:** versioned research exports, proposed reports/organic-growth-scorecard.md; site/privacy only under a separate measurement slice.

**Done when:** Every metric has a reproducible source and scope; missing activation stays unknown; six listing install events are never divided by search clicks as a website conversion rate. No paid backend is required.

### R30 — Replace publication quotas with evidence readiness

**Build:** S. **Review:** S. **Depends on:** R27 facts. **Priority:** P1. **SEO owner:** SEO-04.

- [ ] Add intent-owner, product-release, sources, original evidence, actual verification date and reviewed/publish-ready states to content records.
- [ ] Revise prompts and both scheduled/manual publishers to enforce readiness, date/link/asset/claim checks and an explicit no-ready-topic result.
- [ ] Retain substantive review of distinct usefulness and factual support; word count, five FAQs or schema cannot satisfy the gate.

**Touchpoints:** scripts/blog-topics.json, scripts/daily_publish_prompt.md, scripts/blog_prompt.md, scripts/publish_blog.py, scripts/build_site.mjs, proposed scripts/content-records.json; site/publisher tests.

**Done when:** Invalid records fail, valid records preserve discovery/dates, and the scheduler cannot bypass the same gate. Planning does not pause/change the current schedule; implementation must make any cadence change explicit.

### R31 — Refresh visible guides and curate five user journeys

**Build:** S; V for screenshot/layout work. **Review:** S. **Depends on:** R27, R29; R30 for new publication. **Priority:** P1. **SEO owner:** SEO-05.

- [ ] Refresh the five observed opportunities first, plus homepage and sender-conversion guidance, with tested native instructions and current scope.
- [ ] Organize sender cleanup, safe search recipes, storage diagnosis, subscriptions/backlog and trust/setup; retain complete index discovery and add useful contextual links.
- [ ] Give every inventory URL a reviewed disposition. Preserve age/size owners while full query overlap is evaluated; redirects require retained unique value, link updates and sitemap cleanup.

**Touchpoints:** docs/blog/*.html, docs/index.html, scripts/build_site.mjs, content records and the 47-page inventory.

**Done when:** Each retained page has a distinct job/evidence/CTA, mobile visitors receive useful native help and desktop handoff, and no merge is justified solely by similar titles. B02/B03/B07–B12 are explicitly accounted for.

### R32 — Ship a read-only local query builder and bounded checker

**Build:** S. **Review:** A for Gmail semantics; V for accessibility. **Depends on:** R02, R27, R30. **Priority:** P2. **SEO owner:** SEO-06.

- [ ] Build sender/category/date/size query composition with editable output, copy/open controls and dated boundary/thread explanations.
- [ ] Check only supported syntax/contradictions and broad criteria; explain that static checks cannot guarantee mailbox matches or protect whole threads.
- [ ] Keep inputs local, no OAuth/deletion/indexed parameter states; publish fixtures. Separate checker page only if a distinct maintained job warrants it.

**Touchpoints:** proposed docs/tools/gmail-cleanup-search-builder/index.html, docs/tools/query-builder.js/css, test/query-builder.test.js and generator integration.

**Done when:** Syntax/date/hostile-input fixtures and keyboard/mobile checks pass; the tool adds value beyond a generic builder. Website query settings do not imply the current extension enforces R15 protections.

### R33 — Provide useful storage diagnosis without a fake scan

**Build:** S. **Review:** A for scope claims; V for clarity. **Depends on:** R27, R30; R23 only for actual extension insights. **Priority:** P2. **SEO owner:** SEO-07.

- [ ] Build a manual-input local diagnostic for Gmail/Drive/Photos, Trash and delayed meter updates with official native next steps.
- [ ] Keep urgent receive failure distinct from clutter; clearly distinguish Trash movement and permanent removal.
- [ ] Link evidenced storage guides; never infer exact GB from sender counts or require new permissions/backend.

**Touchpoints:** proposed docs/tools/gmail-storage-troubleshooter/index.html, local JS/CSS, test/storage-troubleshooter.test.js, existing storage guides and generator.

**Done when:** Unknown/invalid totals and shared-storage/Trash scenarios yield useful honest advice; no inputs leave the device and no UI pretends the account was scanned.

### R34 — Publish firsthand evidence and distribute useful assets

**Build:** S; V for demonstrations, L for verified editorial edits. **Review:** S/A for method/safety; H validates observed behavior. **Depends on:** R27, R31/R32 useful assets; R14 for usability claims. **Priority:** conditional. **SEO owner:** SEO-08.

- [ ] Publish setup/data-flow/recovery, a current native Gmail comparison and one sourced/tested competitor comparison including alternatives' advantages.
- [ ] Run seeded native/extension cleanup tasks and publish methods/fixtures, actual timings/errors and limits; no invented benchmark claims.
- [ ] Prepare reusable demos, GitHub links and relevant community/tutorial answers. Sending outreach/posting requires its own user authorization.
- [ ] Expand only with actual query gaps and distinct information; no paid links/writers/ads dependency or mass synonym/brand/locale pages.

**Touchpoints:** portfolio B13–B15, how-it-works/help, proposed compare/research pages and synthetic fixtures.

**Done when:** Every result is traceable to an actual run or labeled documentation observation. Comparisons/research remain deferred until evidence exists; ongoing SEO-09 reviews govern expansion.

### Growth review gates

Days 1–30 prioritize R27–R31 and query-tool preparation; days 31–60 complete the helper/diagnostic and high-fit rewrites/tests; days 61–90 expand evidenced research/comparisons and actual query gaps. These are review windows, not ranking or revenue deadlines. No new cloud AI, mobile app, provider, locale or monetization commitment is justified by this small baseline. R03–R09 safety work remains ahead of promoting an expanded cleanup runtime.

## Suggestion coverage and deliberate deferrals

| Teardown suggestion or competitor pattern | Roadmap disposition |
|---|---|
| Account visibility, cache binding, unknown-account blocking | R03 |
| Exact/estimated totals, conversation/message distinction, archived scope | R02, R04, R05 |
| Sender inspection, read-only report, no preselection | R05, R10, R11 |
| Honest timing, phase progress, stop, stale cache, popup reattachment | R06–R08, R10 |
| Partial outcomes, receipts, Open Trash, local history | R09 |
| Clear labels, full sender identity, color meaning, accessible dark/light themes | R11, R12 |
| Large lists and virtual scrolling only if justified | R13 |
| User comprehension validation and failure scenarios | R14 and milestone gates |
| Starred/important/unread protection, archive and age filters | R15–R17 |
| Keep newest N | R17 feasibility subtask; not promised until ordering is proven |
| Whole-run Undo | R18 decision, R19 conditional implementation |
| True unsubscribe versus block/filter | R20 and separate R21 |
| Recurring rules, schedules and reliable background expectations | R22; reminder-first, unattended actions gated |
| Count/storage report and no false quota claims | R23 |
| Sidebar/full-tab results, multiple providers and locale support | R24, R25; evidence-gated |
| Listing/package/privacy mismatch, limits and upgrades | R01, R26 |
| Digests, rollups, DND, AI writing or cloud classification | Deferred: different jobs and data architecture; require user demand and a separate design |
| Permanent delete | Deferred: conflicts with the present recoverable cleanup proposition; no need to copy every competitor feature |
| Export | Defer until support/recovery demand warrants it; if added, redact mailbox identities by default and label local file contents |
| Automatic “smart” sender selection | Do not add destructive preselection; suggestions can be read-only and user-confirmed |

## Delivery and verification rules

This is a product roadmap with task-level acceptance criteria, not a complete executable specification for every later feature. Before starting a task, turn its accepted scope into a short implementation slice with exact interfaces and test fixtures; later conditional tasks require their go/no-go findings first. Do not invent those details to make uncertain work look ready.

For behavior tasks, reproduce the relevant failure in a focused test before fixing it. Run `node --test test/parsing.test.js test/content.test.js` plus any new focused popup/history tests, then the complete `node --test` suite at milestone integration. Run `python3 -m unittest discover -s test -p 'test_*.py'` when publishing/build scripts change. For copy-only tasks, link/claim and rendered-state checks are sufficient; avoid tests that merely restate a string.

Each runtime release also needs disposable-mailbox checks with account changes, threaded results, archived and preexisting Trash messages, protected mail, long-running scans and interrupted actions. Record observed results and unresolved limitations. The review model cannot certify a live Gmail flow it did not exercise.

**Recommended starting slice:** R01 and R02, then R03 → R04 → R05, with R06–R09 completing the first runtime release. R01 verification and R02 contract discovery can be separate work streams, but tasks editing the same popup/content state should be sequenced. No agents, reminders or implementation jobs are launched by this roadmap.
