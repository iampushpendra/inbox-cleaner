# Editorial shortlist — 26 October 2026

Plan task T07. Status: **candidate shortlist prepared; no new article published.** Every candidate still needs a real source review and an independent editorial check before promotion. A large queue is not publication readiness.

## Scoring used

Priorities are transparent, not a fabricated numeric score:

1. observed query exposure in the preserved 2026-10-17 export;
2. a distinct reader job not already owned by a stronger page;
3. fit with the evidence-backed product scope;
4. source/asset readiness;
5. effort, including the review needed.

Unknown search volume stays unknown. Existing owner refreshes were ranked ahead of new URLs.

## Refreshed owners (this cycle)

These seven were re-reviewed against extension source 3.3.1 and now carry current records. They belong to the first editorial families:

| Family | Owner |
|---|---|
| Selection link / bulk completion | `how-to-select-all-emails-gmail` |
| Age syntax | `how-to-delete-emails-older-than-a-year-gmail` |
| Storage after deletion | `gmail-mailbox-full-cant-receive-emails` |
| Counts versus bytes | `gmail-delete-emails-by-size`, `how-to-find-biggest-emails-gmail` |
| Permissions / trust | `inbox-cleaner-setup-permissions-recovery` |
| Product comparison | `inbox-cleaner-vs-native-gmail` |

The other retained owners stay marked stale in the scorecard until re-reviewed; that is visibility, not approval.

## Next batch — maximum three

| Candidate | Observed exposure | Distinct job | Why not an existing owner | Decision |
|---|---:|---|---|---|
| `gmail-all-mail-delete-inbox-too` | 287 impressions in its archive cluster | Does deleting from All Mail remove the Inbox copy? | `gmail-archive-vs-delete` explains archive versus delete; this answers the label/all-mail confusion directly | draft and review first |
| `gmail-change-page-size-before-cleanup` | 279 impressions in its selection cluster | Change Gmail page size before a bulk review | `how-to-select-all-emails-gmail` explains selection scope, not the page-size setting | draft after source check |
| `gmail-older-than-not-working` | 84 impressions in its age cluster | Diagnose malformed `older_than` syntax | `how-to-delete-emails-older-than-a-year-gmail` teaches the working query | draft after official-source check |

Do not publish all three by default. If only one survives review, publish one.

## Review checklist before promotion

- One maintained intent owner and a real distinct job, not a synonym.
- Current official Gmail/Chrome source checked; no procedure asserted from memory.
- Any extension statement matches `scripts/product-facts.json` at manifest 3.3.1.
- Concrete information gain over the existing owner; otherwise merge into the owner.
- Correct canonical, dates, internal links and tool links; no forced FAQ or word-count padding.
- Evidence record reaches `publish_ready` only after review; a draft state is not coverage.
- Post-publication: rerun the site build, verify discovery and record the deployed revision.

## Capacity

At most three independently reviewed assets per week is a ceiling, not a quota. Four scheduled runs are drafting/review opportunities. The 130 pending topics are not a publication target.
