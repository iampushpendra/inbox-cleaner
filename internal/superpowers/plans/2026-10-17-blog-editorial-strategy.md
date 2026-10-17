# Analytics-led blog priorities and ChatGPT discovery

Updated 17 October 2026 (IST). Editorial decision: improve exposed existing answers, then publish distinct troubleshooting and decision articles adjacent to demonstrated queries. ChatGPT is a priority acquisition experiment; every answer must still help a reader arriving from ordinary search.

## What changed

The queue now contains **197 topics: 47 published, 134 pending and 16 deferred**, including **64 new briefs**. Corrected the already-existing GitHub notifications article to published. All original entries and public URLs are retained. Each entry now records a cluster, editorial priority, evidence basis, distinct answer angle, intent owner, hub and published linking targets. Pending array order controls the existing first-pending publisher; numeric priority is a broad tier, not a traffic forecast. The first 20 are an explicit editorial sequence combining demonstrated search problems with a small tool/trust experiment. New selection, size, age and storage jobs generally precede lower-evidence seasonal and administrative topics.

`scripts/blog-refreshes.json` separately records **12 existing-page refreshes**. Published articles stay published; they must not be reintroduced as pending new posts. `deferred` is an editorial hold that the existing publisher already skips. Thirteen overlaps have a consolidation owner; three unsupported/low-fit ideas need evidence. There are no redirects, deleted pages or asserted cannibalization findings in this change.

## Evidence and its limits

Use the [analytics report](../../../reports/2026-10-17-analytics-intelligence.md) and original [exports](../../../research_notes/Analytics%20intelligence%202026-10-17/README.md). GSC actual full-history coverage is June 27–October 14; the export exposes 628 query rows, 1 click and 1,529 impressions versus 22 clicks and 3,552 property impressions. Hidden queries cannot be reconstructed. Page and property aggregation differ. Impressions are observed exposure, not keyword search volume.

July 19–October 16 store-property GA attributes **6 of 22 sessions and 4 of 6 install events to `chatgpt.com / ai-assistant`**. Direct leads session count at 13. ChatGPT therefore accounts for most attributed install events in this small sample, not most website clicks. Owner/test activity, referral provenance and article attribution remain unresolved. GA's reporting zone is Los Angeles; GSC/GA days cannot simply be joined. No website stream or successful-cleanup events were available in these exports.

The largest individual disclosed query is “select all conversations that match this search” (110 impressions, position 10.95), followed by “bulk email cleaner” (43, 39.67) and the missing-banner variant (39, 9.38). The broader Gmail-prefixed select-all variant adds 15 impressions. Query families and page performance support selection, sender cleanup, archive explanations, promotions, age and size recipes. A low CTR is not proof that a title caused the result.

### Cluster map

| Cluster | Disclosed query rows | Cluster impressions | Existing hub |
|---|---:|---:|---|
| Gmail Selection | 53 | 279 | `how-to-select-all-emails-gmail` |
| Sender Cleanup | 41 | 184 | `delete-all-emails-from-one-sender-gmail` |
| Gmail Search | 35 | 84 | `how-to-delete-emails-older-than-a-year-gmail` |
| Gmail Storage | 21 | 43 | `gmail-delete-emails-by-size` |
| Gmail Storage | 2 | 3 | `gmail-mailbox-full-cant-receive-emails` |
| Gmail Organization | 116 | 287 | `gmail-archive-vs-delete` |
| Promotions & Subscriptions | 81 | 188 | `gmail-delete-all-promotional-emails` |
| Cleanup Tools & Privacy | 7 | 54 | `delete-all-emails-from-one-sender-gmail` |
| Gmail Recovery | 12 | 27 | `how-to-permanently-delete-gmail-emails` |

These are reproducible, case-insensitive keyword-family matches against disclosed query text. Regex definitions: selection `select|conversations that match|50 emails`; sender `sender|bulk email cleaner`; age `older|before:|after:`; size `larger|size|attachment|large emails|biggest`; storage `storage|quota|mailbox full`; archive `archiv|all mail`; promotions `promotion|unsubscribe|newsletter`; trust `inbox cleaner|bulk email cleaner|cleanup`; recovery `trash|recover|permanently`. Families overlap and must not be added together. Broad matches are directional and may include irrelevant queries; review source rows before commissioning. Entry examples are the three highest-impression matched rows. `observed_query` means an exact target-query match exists; `observed_page` means that URL has a page-export row; `adjacent_cluster` means only related demand, with no proven query-level volume. These are Google observations, never a list of ChatGPT prompts. Internal evidence must stay outside public `docs/`.

## Refresh before scaling

Work through this existing-page list before expanding output volume; prioritize correcting product claims throughout the archive as described in SEO-01/SEO-02 of the existing SEO roadmap. The scheduled publisher remains a new-post job and does not automatically execute these refreshes. Keep its current cadence; do not interpret 134 pending topics as permission to accelerate or publish unresearched drafts.

| Order | Existing guide | Impressions / clicks | Specific improvement |
|---|---|---:|---|
| 1 | Select all emails | 1,082 / 3 | Beyond-current-page instructions, tested screenshots, missing-banner diagnostic and device distinctions. |
| 2 | Delete by size | 112 / 0 | Verified size recipes, thread review and counts-versus-bytes limitation. |
| 3 | Mailbox full / cannot receive | 97 / 0 | Immediate diagnostic route; Trash, shared quota and missed-mail caveats. |
| 4 | Find biggest emails | 116 / 1 | Size thresholds; do not invent a Gmail largest-first sort or extension storage report. |
| 5 | Older than a year | 148 / 0 | Correct rolling-age syntax and mixed-thread review. |
| 6 | Delete from one sender | 344 / 0 | Sender-wide product scope and separation from filtered native Gmail cleanup. |
| 7 | Archive versus delete | 372 / 0 | Outcome table: visibility, quota, recovery and future replies. |
| 8 | Delete promotions | 205 / 0 | Category query and receipt/mixed-sender caveats. |
| 9 | Bulk delete | 192 / 0 | General cleanup hub; link to selection troubleshooting instead of repeating it. |
| 10 | Delete unread | 151 / 1 | Unread query, mixed-conversation behavior and selection scope. |
| 11 | Delete old emails | 122 / 1 | Own general age cleanup; link to specific operator and boundary explanations. |
| 12 | Unsubscribe | 61 / 0 | Separate future delivery, existing mail and current subscription UI. |

Preserve URLs and original publication dates. Use dateModified only for substantive edits. Each refresh needs a current official source, a checked native procedure, truthful extension claims, contextual links and a content-gate pass. Do not claim screenshots or real-mail tests exist until actually created safely. Keep overlapping published sender/bulk/age guides in place while clarifying their jobs; consolidation/redirect decisions need a URL-level review.

## Next 20 new articles

1. **why is select all conversations that match this search not showing in gmail** — `gmail-select-all-conversations-not-showing` (adjacent_cluster). A screenshot-led decision tree separating page selection, search results, view differences and mobile limitations; do not promise a universal fix.
2. **why is gmail bulk delete not working** — `gmail-bulk-delete-not-working` (adjacent_cluster). Separate wrong selection scope, stale results and interrupted actions; verify a small disposable batch before retrying.
3. **why is older_than not working in gmail** — `gmail-older-than-not-working` (adjacent_cluster). Contrast valid underscore/colon syntax with common mistyped variants from the query export.
4. **how to use the older_than search operator in gmail** — `gmail-search-operator-older-than` (adjacent_cluster). Answer the specific job in the target query using a tested native Gmail example; distinguish it from the cluster hub before drafting.
5. **why is gmail storage still full after deleting emails** — `gmail-storage-not-updating-after-deleting` (adjacent_cluster). Distinguish Trash, other Google services and reporting delays with source-backed checks and no invented countdown.
6. **why is gmail storage still full after emptying trash** — `gmail-empty-trash-storage-still-full` (adjacent_cluster). A post-emptying diagnostic tree covering account identity, shared quota and quota display updates.
7. **how to delete emails from one sender but keep recent emails** — `gmail-delete-from-sender-keep-recent` (adjacent_cluster). Combine from and age criteria in native Gmail and explain why extension sender-wide removal cannot preserve this scope.
8. **how to delete gmail promotions older than 30 days but keep recent ones** — `gmail-delete-old-promotions-keep-recent` (adjacent_cluster). Use a manual combined query, explain thread review and explicitly reject age-based standing filters.
9. **does the sender with the most gmail emails use the most storage** — `gmail-counts-vs-storage-by-sender` (adjacent_cluster). Contrast counts with message bytes using a small worked example; explain the extension cannot report reclaimed GB.
10. **why is gmail storage full when my inbox is empty** — `gmail-inbox-empty-storage-full` (adjacent_cluster). Explain Inbox versus All Mail, Sent, Trash and shared Google storage without confusing labels with copies.
11. **what is the difference between larger smaller and size in gmail search** — `gmail-larger-smaller-size-difference` (adjacent_cluster). Provide a threshold comparison with known-size test messages; avoid promising a native largest-first sort.
12. **when should i use gmail search instead of a cleanup extension** — `gmail-cleaner-manual-search-vs-extension` (adjacent_cluster). A decision table for sender-wide work versus date, size, category and protected-mail constraints.
13. **is it safe to use gmail cleanup extensions** — `is-it-safe-to-use-gmail-cleanup-extensions` (adjacent_cluster). Answer the specific job in the target query using a tested native Gmail example; distinguish it from the cluster hub before drafting.
14. **why do gmail cleanup extensions need account access** — `gmail-cleanup-extension-permissions-explained` (adjacent_cluster). Answer the specific job in the target query using a tested native Gmail example; distinguish it from the cluster hub before drafting.
15. **can i clean gmail without giving a tool oauth access** — `gmail-cleaner-without-oauth` (adjacent_cluster). Explain native Gmail and DOM extension approaches with exact permission boundaries and no claim that lack of OAuth eliminates risk.
16. **how to bulk delete emails in gmail app on iphone** — `how-to-bulk-delete-emails-gmail-iphone` (adjacent_cluster). Answer the specific job in the target query using a tested native Gmail example; distinguish it from the cluster hub before drafting.
17. **how to bulk delete emails in gmail app on android** — `how-to-bulk-delete-emails-gmail-android` (adjacent_cluster). Answer the specific job in the target query using a tested native Gmail example; distinguish it from the cluster hub before drafting.
18. **gmail advanced search operators cheat sheet** — `gmail-advanced-search-cheat-sheet` (adjacent_cluster). Answer the specific job in the target query using a tested native Gmail example; distinguish it from the cluster hub before drafting.
19. **does deleting an email from all mail also delete it from the inbox** — `gmail-all-mail-delete-inbox-too` (adjacent_cluster). Show label membership and deletion scope using one message with multiple labels.
20. **does gmail unsubscribe remove emails already in my inbox** — `gmail-unsubscribe-vs-delete-existing-emails` (adjacent_cluster). Explain old-message retention and a separate cleanup procedure; link to the existing unsubscribe guide.

## ChatGPT discovery and conversion brief

1. **Be available.** Repository `docs/robots.txt` already permits all user agents, including OAI-SearchBot. Keep canonical public HTML, sitemap and internal links. Robots permission does not establish CDN access: inspect real responses and verified crawler logs if available; don't claim a completed WAF audit. OpenAI says search eligibility requires crawler/host access and placement is not guaranteed: [ChatGPT search](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt), [crawler documentation](https://developers.openai.com/api/docs/bots). Search access and model-training access are separate choices; no GPTBot policy change is needed for this work.
2. **Answer a complete job.** Start with a short standalone answer naming Gmail, platform and selection scope. Use concrete troubleshooting branches, query examples, source-backed outcome tables and actual screenshots where they add information. This is an editorial hypothesis about usefulness/citability, not a documented ranking formula.
3. **Earn a citation.** Before drafting, inspect the exact question's current results and specify one contribution. Each proposed angle below must pass that check; adjacency alone is not enough. Cite primary Google procedures next to claims, distinguish measured from estimated counts, and disclose unknowns. No fabricated tests, statistics, testimonials or comparative superiority.
4. **Keep the recommendation honest.** Explain that Inbox Cleaner uses the Gmail DOM in desktop Chrome and performs sender-wide moves to Trash. Native date/size/category/star exclusions do not transfer. Avoid storage-reclaimed promises and unsupported mobile, auto-cleanup or Undo claims. On comparisons disclose authorship and verify competitor permissions/prices when writing.
5. **Keep a clear next action.** Provide native Gmail steps first. Show the verified Web Store CTA when sender-wide cleanup fits; give mobile readers a desktop handoff. Do not tag internal links or every store CTA as ChatGPT, which would manufacture channel attribution. Do not add prompt injection, hidden assistant instructions or alleged special AI schema.
6. **Use ordinary technical quality.** Google's [AI feature guidance](https://developers.google.com/search/docs/appearance/ai-features) supports normal search fundamentals and says no special AI schema is required. Structured data should describe visible content; FAQ and HowTo markup are not citation/rich-result promises. No llms.txt or crawler-policy rewrite is necessary just to claim optimization.

The shared `scripts/blog_prompt.md` and scheduled-writing instructions now carry these requirements, remove fixed word/FAQ counts, require the full topic brief and prohibit promoting cluster impressions into exact-query demand. This changes future drafting guidance, not the existing article archive. Quality research is a prepublication requirement; it is not asserted complete for the 64 proposed topics.

## Review loop

- On the next equal 28-day comparison, report the fixed 12-page refresh cohort separately from new posts. Compare impressions, clicks, CTR and position at page/query level after recrawl, annotated with actual change dates. An update may not be crawled inside the window; report that limitation.
- Keep store listing sessions and install events by source separate from website metrics and extension activation. Recheck ChatGPT referral/source-link provenance and annotate known owner/test use before drawing channel conclusions. Do not calculate install conversion by dividing unrelated GSC and GA totals.
- For a future privacy-reviewed website measurement implementation, record article path, outbound-store clicks and sanitized acquisition source with an explicit attribution window. Exclude mailbox identity/content, full personal query strings and unnecessary raw URLs. This task does not add tracking scripts or extension telemetry.
- Sample the same 10 question families in ChatGPT search before and after substantive releases, recording date, exact prompt, search setting, cited URLs and whether our answer is accurate. Use a separate owner-test record; these checks are variable observations, not rank tracking or organic acquisition. Do not count them as customer demand.
- After two comparable review windows, move briefs up/down using actual new evidence. If adjacent topics gain no exposure, inspect crawl/index state and content distinctness before creating more variations. A missing value remains unknown; no arbitrary traffic/install target is promised.

## All 64 added briefs

Each entry below has its executable slug and linking metadata in the JSON queue. They are candidate articles, not 64 prevalidated keyword opportunities. Do not publish every variation regardless of reader value.

| Cluster | New query / title brief | Distinct contribution |
|---|---|---|
| selection | why is select all conversations that match this search not showing in gmail | A screenshot-led decision tree separating page selection, search results, view differences and mobile limitations; do not promise a universal fix. |
| selection | why is gmail bulk delete not working | Separate wrong selection scope, stale results and interrupted actions; verify a small disposable batch before retrying. |
| age | why is older_than not working in gmail | Contrast valid underscore/colon syntax with common mistyped variants from the query export. |
| storage | why is gmail storage still full after deleting emails | Distinguish Trash, other Google services and reporting delays with source-backed checks and no invented countdown. |
| storage | why is gmail storage still full after emptying trash | A post-emptying diagnostic tree covering account identity, shared quota and quota display updates. |
| sender | how to delete emails from one sender but keep recent emails | Combine from and age criteria in native Gmail and explain why extension sender-wide removal cannot preserve this scope. |
| age | how to delete gmail promotions older than 30 days but keep recent ones | Use a manual combined query, explain thread review and explicitly reject age-based standing filters. |
| size | does the sender with the most gmail emails use the most storage | Contrast counts with message bytes using a small worked example; explain the extension cannot report reclaimed GB. |
| storage | why is gmail storage full when my inbox is empty | Explain Inbox versus All Mail, Sent, Trash and shared Google storage without confusing labels with copies. |
| size | what is the difference between larger smaller and size in gmail search | Provide a threshold comparison with known-size test messages; avoid promising a native largest-first sort. |
| trust | when should i use gmail search instead of a cleanup extension | A decision table for sender-wide work versus date, size, category and protected-mail constraints. |
| trust | can i clean gmail without giving a tool oauth access | Explain native Gmail and DOM extension approaches with exact permission boundaries and no claim that lack of OAuth eliminates risk. |
| archive | does deleting an email from all mail also delete it from the inbox | Show label membership and deletion scope using one message with multiple labels. |
| promotions | does gmail unsubscribe remove emails already in my inbox | Explain old-message retention and a separate cleanup procedure; link to the existing unsubscribe guide. |
| selection | why is select all greyed out in gmail | Diagnose disabled controls separately from a missing all-results banner; record the exact view and tested browser. |
| selection | why does gmail show a different number of selected emails | Explain messages versus conversations with a mixed-thread example and an explicit selection scope. |
| selection | can i use gmail desktop site on my phone to select all conversations | Test browser desktop mode separately from native apps; state observed limits and give a real desktop handoff. |
| selection | how to select gmail search results with keyboard shortcuts | Explain enabled shortcut prerequisites and current-page versus all-results scope with a reproducible keyboard sequence. |
| selection | why do deleted gmail search results keep coming back | Separate Trash-inclusive searches, new arrivals and incomplete deletion with checks the reader can repeat. |
| selection | how to change gmail page size before cleaning up emails | Show the tested setting and explain why changing page size does not select every matching conversation. |
| age | what is the difference between older_than and before in gmail | Compare rolling age and fixed calendar boundaries with concrete dated examples and a repeatable verification step. |
| age | how to delete old unread gmail emails without deleting recent unread mail | Combine unread and rolling age and inspect thread scope; keep the generic unread guide as the hub. |
| age | how to delete old gmail emails with attachments but keep recent files | Combine age and attachment criteria, save required files first and explain whole-message deletion. |
| age | why does gmail date search show unexpected emails | Check syntax, date boundaries and conversation matching; label timezone behavior as tested or unverified. |
| age | does deleting an old gmail conversation delete recent replies too | Use a mixed-age conversation fixture to show where search matches and deletion scope diverge. |
| age | how to delete old sent emails in gmail | Explain sent-mail scope, age matching and the consequence for retained correspondence. |
| size | why does larger search return no results in gmail | Troubleshoot syntax, units and mailbox scope before suggesting any cleanup tool. |
| size | how to find large gmail emails without attachments | Explain that message size includes more than downloadable files; show exclusion syntax and inspect inline media. |
| size | how to save gmail attachments before deleting the email | A download-and-verify checklist with an explicit distinction between local files and cloud-linked files. |
| size | can i delete an attachment in gmail but keep the email | Answer native limitations directly and describe supported alternatives without inventing an attachment-removal feature. |
| size | how to find large attachments in sent gmail emails | Combine Sent scope and size thresholds and explain what deleting the sent copy affects. |
| size | do google drive links in gmail count as email attachments for storage | Contrast attached files and linked Drive files and route the reader to the correct storage surface. |
| storage | why does archiving emails not fix gmail storage full | Answer the quota misconception and route to the existing archive guide rather than duplicate its general comparison. |
| storage | will missed emails arrive after i free up gmail storage | Explain what to verify and when to ask the sender to resend; avoid promising automatic redelivery. |
| storage | do spam and trash count toward gmail storage | A folder-to-quota reference with sourced retention and permanent-deletion consequences. |
| storage | why does gmail show storage full for a different google account | An account identity checklist before buying storage or deleting mail; do not imply extension multi-account safeguards are shipped. |
| storage | should i delete gmail emails or google photos to free storage | A quota-based decision workflow that avoids irrelevant email deletion when Photos or Drive dominates. |
| sender | how to delete gmail emails from a company domain | Compare an address match with domain matching using safe example domains; inspect false positives before selecting. |
| sender | how to delete emails from a sender without deleting emails sent to them | Contrast from and to searches with a mixed conversation example and thread review. |
| sender | how to clean gmail when one company uses several email addresses | Build a verified address list and OR query; distinguish names, addresses and domains. |
| sender | how to find which senders send the most emails in gmail | Distinguish sender counts from bytes and disclose sampled versus exact counts; demonstrate on a disposable mailbox. |
| sender | how to delete marketing emails from a sender but keep receipts | Separate marketing and transaction subjects; show reviewable native queries and why sender-wide cleanup is unsuitable. |
| sender | does blocking a sender delete their old emails in gmail | Separate future-mail blocking from existing-mail cleanup using a before-and-after workflow. |
| sender | what is the difference between unsubscribe block and delete in gmail | Give an action-by-outcome matrix covering old mail, future delivery and recovery without conflating the controls. |
| archive | does deleting a gmail label delete its emails | A label-removal versus message-deletion example with observable outcomes. |
| archive | why do archived gmail emails come back to the inbox | Explain replies and conversation behavior; distinguish archiving from muting or future-mail rules. |
| archive | how to find archived gmail emails that have no label | Test current supported archive and label searches and explain the limits of each result set. |
| archive | what happens when i remove the inbox label in gmail | Clarify a specific UI action and trace the message through All Mail without duplicating the broad archive comparison. |
| archive | what is the difference between mute and archive in gmail | Compare future replies and visibility with a small thread experiment and link to the archive hub. |
| archive | does gmail cleanup delete snoozed emails | Review Snoozed scope and sender-wide deletion risks with a controlled thread example. |
| archive | what is the difference between important and starred emails before gmail cleanup | Show the two markers and query caveats; neither is a guaranteed protection from sender-wide deletion. |
| promotions | why is manage subscriptions missing in gmail | Verify current availability and interface differences against official help; give a manual fallback without made-up rollout dates. |
| promotions | why am i still receiving emails after unsubscribing in gmail | Separate processing delays, multiple lists and different addresses; do not promise instant cessation. |
| promotions | should i click unsubscribe on suspicious spam emails | Distinguish legitimate mailing lists from suspicious senders and source Google reporting guidance. |
| promotions | how to clean promotional emails when the promotions tab is missing | Explain category settings versus category searches and avoid treating the missing tab as proof of no promotions. |
| promotions | how to delete gmail promotions without losing order confirmations | Review mixed-content senders and threads; native query controls rather than an unsafe sender-wide recommendation. |
| promotions | how to find a mailing list in gmail using the list search operator | Give verified list identifier examples and distinguish a mailing list from a sender display name. |
| promotions | should i use gmail filters or manage subscriptions for newsletters | Compare future delivery outcomes and ongoing maintenance; no claims of unattended age cleanup. |
| trust | can a gmail cleanup extension read my email content | Separate requested permissions, source-observed behavior and verified package behavior; never infer privacy from marketing. |
| trust | what should i check before choosing a free gmail cleaner | A buyer checklist covering limits, recovery, permissions and support, with current sourced prices only if actually verified. |
| trust | which google account does a gmail cleanup extension use | Distinguish browser profile, Gmail tab and mailbox identity; document tested behavior and known limitations. |
| trust | why is my gmail cleanup scan taking so long | Explain pagination and per-sender counting with measured fixture results only; no invented speed benchmarks. |
| trust | why does a gmail cleaner show approximate sender counts | Explain the tilde and top-250 exact-count boundary; distinguish estimates from verified cleanup outcomes. |
| trust | can i use a gmail chrome cleanup extension on iphone or android | State desktop Chrome requirements and link to native mobile guides without suggesting unsupported extension installs. |
