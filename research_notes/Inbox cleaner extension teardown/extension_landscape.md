# Chrome inbox cleaner extension landscape — discovery and selected teardowns

Research date: 2026-10-17. Evidence levels: **Observed** = inspected public vendor screenshot, not authenticated product; **Documented** = publisher statement, not independently verified performance/privacy; **Inference** = reviewer assessment. No extension installed, Gmail authorized, or mailbox changed. Ratings/users are retrieved public snapshots, often cached; not independently measured installs or exact live adoption. Source summaries are intentionally concise.

## Which extensions deserve coverage, and how exhaustive is discovery?

### Takeaway
A defensible landscape separates established direct Chrome competitors from small new utilities and adjacent web services. This discovery found 21 competing direct extension identities plus the user's likely own listing; it cannot guarantee every extension in a changing, personalized store. Trimbox and InboxPurge are the clear extension scale leaders surfaced here, with Gmail Unsubscribe next; their deep dives are handled by another researcher.

### Cited Findings
Discovery query log (all run 2026-10-17, no date filter):
- `site:chromewebstore.google.com inbox email cleaner unsubscribe bulk delete Gmail extension`
- `site:chromewebstore.google.com "Gmail Unsubscribe"`
- `site:chromewebstore.google.com "Delete All Emails"`
- `site:chromewebstore.google.com cloudHQ unsubscribe`
- `site:chromewebstore.google.com "Unsub"`
- `site:chromewebstore.google.com "Email Cleaner" Gmail users`
- `site:chromewebstore.google.com "Email Unsubscribe" "cloudHQ"`
- `site:chromewebstore.google.com "Delete All" "users" email`
- `cloudHQ email unsubscribe Chrome extension`
- `"Delete All Emails" Chrome extension Gmail`
- `"Gmail Mass Unsubscribe" extension`
- `site:chromewebstore.google.com "Unsubscribe" "users" -Trimbox -Gmailics -InboxPurge -lang`
- `site:chromewebstore.google.com/detail "delete emails" "100,000"`
- `site:chromewebstore.google.com/detail "unsubscribe" "10,000" -Trimbox -InboxPurge`
- `site:chromewebstore.google.com/detail "Email Cleaner" "Delete All"`
- `site:chromewebstore.google.com/detail "Gmail" "cleaner" -Trimbox -InboxPurge -lang`

Inventory of unique extension identities (not a market-share ranking):

| Priority | Extension identity | Retrieved signal | Distinctive angle / evidence |
|---|---|---|---|
| Major | [Trimbox](https://chromewebstore.google.com/detail/gmail-unsubscribe-tool-by/jdlcknnokoelkdobgacandnnnmoblhgh?hl=en) | 60,000 users; cached English 4.5/653, other recent locale snapshots 4.4–4.5/658 | In-Gmail unsubscribe, deletion, AI writer. Other researcher owns deep dive. |
| Major | [InboxPurge](https://chromewebstore.google.com/detail/gmail-mass-unsubscribe-de/mogabgmejhmicinppdfeoaokolphbgcd?hl=en-GB) | 30,000 users; 4.7/699 | Direct bulk unsubscribe/delete; other researcher owns deep dive. |
| Major | [Gmail Unsubscribe — Baxter](https://chromewebstore.google.com/detail/gmail-unsubscribe-bulk-em/jljicfihpdcimopabpijdhhjbmenjala) | 20,000 users; 3.0/63; v3.24.1 Sep23 2026 | Sender scan, bulk unsubscribe + archive/trash, polished documented flow; see below. |
| Emerging | [Gmail One-Click Cleaner](https://chromewebstore.google.com/detail/bulk-delete-gmail-emails/bmcfpljakkpcbinhgiahncpcbhmihgpc) | 1,000 users; 4.1/7; v10.5.1 Oct10 | Exceptionally broad safeguards and low-cost one-time Pro; see below. |
| Emerging | [Tidy Tiger](https://chromewebstore.google.com/detail/gmail-mass-delete-stronge/chbnjcdnohaofhghechndlincognoggp) | 838 users in listing search; publisher page 877; 4.6/9 | Distinctive mascot and sender actions, dual web/extension funnel; see below. |
| Emerging | [Email Cleaner](https://chromewebstore.google.com/detail/email-cleaner/gidoimfcmopgaaneodgmdcmbdaeekboo) | Conflicting cached snapshots: 258 users 5.0/6 vs 339 users 4.4/7; v1.0.2 Aug3 | Rule-first automatic maintenance; see below. |
| Emerging | [Mass Unsubscriber: One-Click Email Cleaner for Gmail](https://chromewebstore.google.com/detail/mass-unsubscriber-one-cli/jpaajppadbkogfmgofandmiglolmecea) | 180 users; 5.0/8; v1.1.11 Aug31 | Documented sender grouping, unsubscribe requests, delete old mail, exact-sender filter-to-Trash protection. |
| Watchlist | [Gmailytics](https://chromewebstore.google.com/detail/gmailytics-%E2%80%94-gmail-inbox/nmmkncnnggchmnoinmpoockpdpboonkj) | Featured; 5.0/10, count not retrieved | Documented toolbar unread count; overnight metadata sync; sender dashboard trash/archive/unsubscribe. Account connection required. |
| Watchlist | [MailDefender](https://chromewebstore.google.com/detail/maildefender-gmail-unsubs/odkcpcakkofajpaecjnbmpndmmhmidbi) | Count/rating not retrieved | Documented connect → Scan for mailing lists → tick → Unsubscribe; opens 3 pages at a time; Passed / Needs manual step / Failed states. Reads sender/unsubscribe headers; local-processing claim. |
| Watchlist | [Gmail Cleaner / CleanMyInbox](https://chromewebstore.google.com/detail/gmail-cleaner-%E2%80%93-bulk-dele/hconkejfhepopjpgmpdflaindmlcpkng) | 9 users; no ratings; v1.1.3 Oct1 | Documented side panel + Super Unsubscribe/Super Delete toolbar; selection confirmations; age filters 1/3/6/12 months, preserve starred/important, local Google actions, no separate vendor account; free daily allowances, Pro removes limits. |
| Watchlist | [Bulk Delete Emails for Gmail — Games by Levi](https://chromewebstore.google.com/detail/bulk-delete-emails-for-gm/bchpecgdhkjfiioigekmcbjdcdeinlcf) | 3 users; 5.0/1; v1.0.1 Sep28 | Documented OAuth then full-tab scan by sender/count/size; 1k/5k/25k/all; exact pre-count, age/size/category/search; attachment export ZIP; dry run, cancel, backoff, last-10 history Undo; separate permanent-delete toggle/typed confirmation/permission. |
| Watchlist | [Unsub](https://chromewebstore.google.com/detail/unsub/hhlgkgeahdejlbnloeicbjgmmcpjldai) | 1 user; no ratings; v1.8.3 Sep24 (search earlier Sep21) | Documented Gmail Manage subscriptions automation. No OAuth/separate account; toolbar opens control panel → safe 2-sender trial → All remaining → Start; pause/stop/log/manual outcomes, availability check. |
| Watchlist | [Gmail Mass Unsubscribe](https://github.com/betaupsx86/gmail-mass-unsubscribe) / [store identity](https://chromewebstore.google.com/detail/gmail-mass-unsubscribe/iajcgkmdeohnelncjofdhmddejjlkahj) | Store direct retrieval failed; repo verified | Documented OAuth, category/search, age/read/starred/important filters; Start sends header unsubscribe requests, optional success-only trash. Floating Gmail button. Explicitly admits 403/expired-link failures; all-site host permission explained. |
| Watchlist | [Inbox Cleaner Pro — Email Unsubscribe Tool](https://chromewebstore.google.com/detail/inbox-cleaner-pro-email-u/iegapdlkoigjcemophcmfpnchmnfhojn) | 38 users | Documented Gmail/Outlook open email → icon finds unsubscribe links → opens link; stats. Pro €5/month bulk, rules, whitelist, export. |
| Watchlist | [Mailbox Magic](https://chromewebstore.google.com/detail/mailbox-magic-%E2%80%94-unsubscri/apebncoleabpbcpngijmmbmghfcjiidn) | 17 users | Documented Gmail/Outlook/Yahoo local tab operation; sender counts/unread/open-frequency sorting; unsubscribe/archive/delete/block/protect/undo/activity log. |
| Watchlist | [InboxZero — Gmail Cleanup](https://chromewebstore.google.com/detail/inboxzero-%E2%80%94-gmail-cleanup/ejngcphceeieidoonjjjjjailddmjeme) | 6 users, no ratings; v1.0.0 Jun10 | Sparse listing: promotions/spam/newsletter browsing, bulk trash, find unsubscribe links. Do not confuse with getinboxzero.com. |
| Watchlist | [Inbox Cleaner for Gmail — akins.app](https://chromewebstore.google.com/detail/inbox-cleaner-for-gmail/ioijkmlbkkjkdjnejinaacpcbknckdkl) | No ratings; v1.8.6 Sep22 | Documented OAuth → scan size → KEEP/REVIEW/CLEAN rules; sender grouping, category/search, explicit Trash confirmation, local deterministic processing, 24h cache and disconnect clears cache. |
| Watchlist | [Gmail Cleaner — Jainendra Singh](https://chromewebstore.google.com/detail/gmail-cleaner/ndfjbmmkflhajgdkngkinlbgcedhbdlf) | 10 users, no ratings; v1.0 Jun22 | Sparse claims: dashboard, sender grouping, read/unread/starred filters, auto-delete by sender/keywords. |
| Watchlist | [Gmail Cleaner — viralgondaliya](https://chromewebstore.google.com/detail/gmail-cleaner/kmjambcakpcieafnocnfheajpbojeglf) | 13 users, no ratings; v1.0 Mar2 2025 | Date-range analysis/download/delete. Little evidence of UX/onboarding. |
| Watchlist | [Gmail Cleaner — bhagawatdongre](https://chromewebstore.google.com/detail/gmail-cleaner/caffckbkfgmeieblmainnjdmnpbgolbe) | Conflicting cached 320/333 users, 1.0/1; v0.0.1 Feb29 2024 | Mostly marketing text, insufficient functional specifics for serious teardown. |
| Watchlist | [Gmail Inbox Cleaner — sendsmiles.biz](https://chromewebstore.google.com/detail/gmail-inbox-cleaner/mmngliidelopceikocdffeindahgbemp) | 97 users, 1.0/1; v11 Jul9 2025 | AI suggestions; listing says Google verification delayed and warning may appear; OAuth/Gmail API claimed. No independent verification. |

Own-product exclusion: [Inbox Cleaner — iampushpendra](https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep) appears to be user's published product (publisher email and GitHub identity), not a competitor. Retrieved listing: 1 user, v2.1.0 Sep4 2026, all-five-category sender counts, date/category badges, bulk Trash; describes Google OAuth/Gmail API with From/Date metadata. This differs from parent-provided current local DOM architecture; treat as possible product/version drift to reconcile, not proof local implementation uses OAuth.

### Inferences
- Prioritize established direct tools by surfaced adoption, then products with distinct interaction models or unusually relevant features. Low users do not imply poor design, and high users do not demonstrate safety.
- Practical deep-dive set: Trimbox, InboxPurge, Gmail Unsubscribe, Tidy Tiger, Gmail One-Click Cleaner, Email Cleaner, plus web-service substitutes handled separately. Watchlist addresses breadth without pretending evidence supports scores.
- Dedupe by extension ID, not generic titles: four unrelated Gmail Cleaner listings surfaced.

### Gaps
- No exact 'all extensions' denominator exists here; store search index coverage, region, ranking, removals, renamed products and small listings may hide tools.
- Exact “Delete All Emails” product identity was not verified; generic deletion-search queries mainly returned Gmail instructions. Do not invent a product under that title.
- No direct cloudHQ Gmail Email Manager/Unsubscriber was verified. [Official cloudHQ app catalog](https://support.cloudhq.net/list-of-all-cloudhq-chrome-extensions/) surfaced reply, export, tracking, label and backup tools; these are not direct cleaners. Exclude tentative names unless independently verified.
- [Gmail Cleaner & Checker — Swipe Cleanup](https://chromewebstore.google.com/detail/gmail-cleaner-checker-%E2%80%93-s/nmhepfiepgmpepfnfkjhmkcdklbmknha) is an adjacent checker/swipe interaction comparator, excluded from direct sender-bulk landscape count.
- Firefox Gmail Mass Unsubscriber by Ariel Blanco is [verified on Mozilla](https://addons.mozilla.org/en-GB/firefox/addon/gmail-mass-unsubscriber/), but a Chrome identity was not verified here; do not mislabel Firefox-only evidence as current Chrome availability.

## What do the most relevant additional products teach about onboarding, design, buttons and CTA clarity?

### Takeaway
Gmail Unsubscribe has the strongest visual evidence in this subtask: a clear stepped, count-aware selection flow. Tidy Tiger offers memorable, exceptionally visible sender actions, but its “unsubscribe” semantics are misleading because its own FAQ describes a Gmail Trash filter. Other products' flow assessments below are based on documentation, not hands-on observation.

### Cited Findings

#### Gmail Unsubscribe / Baxter — observed screenshot and documented flow
- Official [cleanup screenshot](https://gmailunsubscribe.com/assets/shot2-v2-cleanup.png), saved `assets/gmail-unsubscribe-cleanup.png`, inspected visually: lavender/white large rounded panel, connected account top-right; Connected → Clean up → Done stepper; 38 subscriptions; left sender checkboxes/counts; right selected-sender tally; Archive/Trash tiles with “Still searchable” / “Gone in 30 days”; large purple selection-count CTA and subdued Skip link. The screenshot says three noisy senders were preselected and user can untick.
- Official [success screenshot](https://gmailunsubscribe.com/assets/shot3-v2-done.png), saved `assets/gmail-unsubscribe-success.png`, inspected: green check; sender total; archived-message number; one Go to Gmail CTA; tiny location/support guidance.
- [Website](https://gmailunsubscribe.com/) documents toolbar → scan → select → unsubscribe + archive/trash; per-sender statuses; modern one-click, email and fallback methods; optional simplified Gmail view; site Free 25 senders/month, Pro $35.88/year. Site FAQ limits discovery to newest 3 months, cleanup can affect all sender history; Undo restores moved mail, not unsubscribe.
- [Store](https://chromewebstore.google.com/detail/gmail-unsubscribe-bulk-em/jljicfihpdcimopabpijdhhjbmenjala) instead says full-history scan, five free unsubscribes/month and free bulk delete/archive. This materially conflicts with site. Do not present either free allowance/scope as settled current fact.

Reviewer inference: strong hierarchy, readable contrast, approachable styling, explicit lifecycle progress, visible active account, specific dynamic CTA, and explaining Archive vs Trash reduce uncertainty. Preselecting senders before a destructive/irreversible unsubscribe is a meaningful consent risk. CTA names unsubscribe but also performs archive/trash, so consequential side effect deserves explicit combined wording. Screenshot denominator “234 recent emails; all their mail is cleared” may obscure the actual scope; require actual affected count before confirm. The success design closes the loop and shows where to find extension afterward. These are visual-review opinions, not task-completion measurements.

#### Tidy Tiger — observed web dashboard screenshot, documented extension
- Official [sender screenshot](https://trytidytiger.com/assets/AppScreenshotStep1Of3-Dpzh9hM2.png), saved `assets/tidytiger-remove-step.png`, inspected: generously spaced white rows; sender icon/email; total and unread count/percentage; large pale-purple outlined Unsubscribe & Delete All action per row; separate chevron for alternatives. Long email truncates.
- [Website](https://trytidytiger.com/) distinguishes web Smart Scan deep cleanup from extension daily maintenance. Web onboarding Connect Gmail → Lean Back → Remove in Minutes; landing Start Guided Scan, extension Add to Gmail; extension email → tiger → Unsubscribe/Delete All. FAQ says “unsubscribe” filters mail directly to Trash, and recovery is through Gmail Trash. Google-security assertions are publisher claims, not verified certifications.
- [Store](https://chromewebstore.google.com/detail/gmail-mass-delete-stronge/chbnjcdnohaofhghechndlincognoggp) documents three options Unsubscribe, Delete one, Delete all; free to start, no card; local-processing claim. [Publisher snapshot](https://chromewebstore.google.com/publisher/tidy-tiger-llc/u40aae888de43512deead673a7a372185) reinforces 30-day Trash recovery; counts differ by snapshot.

Reviewer inference: mascot humanizes an anxious task; big buttons, plain sender IDs and unread context make individual choices easy. Extremely repeated primary buttons compete with each other across the list; batch selection may be more efficient for large sets, but actual speed untested. “Delete All” needs sender-specific scope/count. Pale lavender control emphasizes friendliness over danger; confirmation critical. Web-vs-extension dual funnel increases choice burden. Most serious issue: term Unsubscribe implies leaving a mailing list but documented implementation blocks delivery into Trash. Use “Block future mail” for that behavior. Do not score screenshot as extension UI: it is marketed Smart Scan dashboard.

#### Gmail One-Click Cleaner — documented, no visual score
- [Store](https://chromewebstore.google.com/detail/bulk-delete-gmail-emails/bmcfpljakkpcbinhgiahncpcbhmihgpc): install → Gmail → Clean Gmail corner button → free read-only Mailbox Report → run biggest step / sender triage / rules → live progress → Recovery Log Restore. Features: age/size/category/search rules; Light/Normal/Deep/Maximum sets; custom rules; schedules; dry-run/review/live modes; sender/domain protection; starred/important/unread/labeled skip defaults; tagged batch restoration; storage tier floors; distinguish Trash from reclaimed storage; unsubscribe checks after two weeks; sender triage Keep/Archive/Delete/Unsubscribe; one-time Pro $9.99, three free unsubscribes. v10.5.1 Oct10 snapshot 1k users 4.1/7; older snapshots 4.7/6.

Reviewer inference: excellent informed-consent ideas (read-only first value, dry run, exact same safety filter for count and action, whole-run undo, honest storage numbers). Very high feature breadth and terminology can overwhelm a novice; surface one recommended path and progressively disclose rules. Entry in Gmail addresses forgotten-toolbar-icon friction. Usability/performance/open-source privacy claims untested. Site retrieval failed; no typography/color/layout score justified.

#### Email Cleaner — documented, no visual score
- [Store](https://chromewebstore.google.com/detail/email-cleaner/gidoimfcmopgaaneodgmdcmbdaeekboo): install → Google sign-in → suggested/custom rule → ongoing cleanup. Age rule (older than N days), retention count (keep latest N), delete/archive/mark read; domain grouping; exact preview; noisiest-sender suggestions; history restore; pause/edit/remove rules; live counters/lifetime statistics; background scheduled operation without open tabs. Local encrypted sender data/rules claim. Free core with unspecified upgrade; store discloses PII/location/activity handling. Cached rating and users conflict (table above).

Reviewer inference: “keep latest N” speaks a concrete retention mental model users understand. Rule-first setup requires trusting recurring future behavior before initial cleanup; a one-off preview-first path may feel safer. “Delete” meaning Trash vs permanent and undo conditions not adequately verified from listing. No public product UI inspected, no design score warranted. Homepage retrieval failed.

#### Unsub — documented interaction comparator
- [Store](https://chromewebstore.google.com/detail/unsub/hhlgkgeahdejlbnloeicbjgmmcpjldai) explains no separate account/OAuth, two-sender trial, All remaining, Start, Pause/Stop, running log and unavailable-feature state. It never chooses Gmail Block; uses native Manage subscriptions and does not guarantee immediate sender compliance.

Reviewer inference: deliberate tiny trial + stop + log is a useful model for making a browser automation trustworthy. Dependency on Gmail's own feature availability must be detected early. Sparse branding/visual evidence means no design assessment. It is strategically relevant to a local-DOM approach even with negligible traction.

### Inferences
- Distinguish three operations in all comparison tables: sender unsubscribe request, future-mail filtering/blocking, and historical-mail trash/archive. Competitors conflate them; a transparent product can win through precise language.
- Onboarding model taxonomy: inline contextual (Tidy Tiger extension), bulk sender dashboard (Baxter), report then recommended action (One-Click Cleaner), automation rules (Email Cleaner), native-page automation with trial (Unsub), side panel (CleanMyInbox).
- The most transferable combination for Inbox Cleaner is active-account identity + read-only scan + explicit scope/coverage + no preselection + selected sender and actual email count + “Move N emails to Trash” + progress/cancel + recovery receipt. This is a proposed design, not a measured conversion winner.

### Gaps
- No extension installation or authenticated flow execution. Public screenshots can be staged/aspirational and may not match shipping UI. Login consent wording, paywalls, scan speed, failure/empty/cancel states, responsive layout, keyboard/screen-reader access and exact button behavior remain untested.
- No actual accessibility contrast calculation or task success study; qualitative visual opinions must not be presented as objective UX metrics.

## What evidence artifacts and synthesis caveats should the final report carry?

### Takeaway
The strongest report should show actual screenshot evidence and be candid about source contradictions. It should avoid invented star ratings for usability or asserting that every tool was tested.

### Cited Findings
- Screenshot sources and local artifacts: [Baxter cleanup](https://gmailunsubscribe.com/assets/shot2-v2-cleanup.png) → `assets/gmail-unsubscribe-cleanup.png`; [Baxter success](https://gmailunsubscribe.com/assets/shot3-v2-done.png) → `assets/gmail-unsubscribe-success.png`; [Tidy Tiger Smart Scan sender rows](https://trytidytiger.com/assets/AppScreenshotStep1Of3-Dpzh9hM2.png) → `assets/tidytiger-remove-step.png`.
- Baxter authoritative page conflict: [site](https://gmailunsubscribe.com/) vs [store](https://chromewebstore.google.com/detail/gmail-unsubscribe-bulk-em/jljicfihpdcimopabpijdhhjbmenjala), free quota and scan history.
- Tidy Tiger marketing/behavior semantic caveat: [official FAQ](https://trytidytiger.com/) says unsubscribe is filter to Trash.
- Gmail Mass Unsubscribe documents [limitations](https://github.com/betaupsx86/gmail-mass-unsubscribe): some unsubscribe endpoints reject browser-origin requests, expired links fail, transactional mail often has no unsubscribe header. Useful counterexample to overpromising “all unsubscribes work.”

### Inferences
- Prefer evidence confidence beside qualitative opinions over numerical design scores. If scoring is necessary, label as heuristic reviewer assessment based on public materials, not instrumented test.
- Publish user-count/rating snapshots with research date and cached-source caveat; where conflicting, show range or omit instead of selecting flattering value.
- Make the final appendix searchable by extension ID and include low-evidence watchlist; the core story should focus on a manageable handful.

### Gaps
- Exact current market size/adoption, revenue and conversion cannot be inferred from the store user counters.
- Security/privacy and Google verification claims are publisher representations, not an independent audit. No mailbox payloads or network traffic inspected.
