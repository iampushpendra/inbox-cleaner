# SEO-04 publishing readiness gate

Implemented an executable evidence gate shared by manual publication and scheduled selection. Existing published pages remain buildable; publication and refresh commands require a reviewed record for the exact slug. Unknown and deferred slugs are rejected before writes. Content records start honestly as draft: neither existing publication nor an editorial brief proves substantive source review.

Records in `scripts/content-records.json` are keyed by slug. Readiness requires state `publish_ready`, editorial intent owner, current manifest version, HTTPS sources with claim coverage and review notes, real verification date, limitations, useful information gain, existing local related links, actual agent/human reviewer, and the authored HTML SHA-256. Complete generated AUTO regions are excluded from the hash. All other authored edits invalidate review. A build that normalizes a CTA may invalidate the hash; review the resulting substantive change before the next refresh. There is no automatic hash renewal or automatic approval.

`source_review` is a valid verification kind for documentation-only articles after a genuine substantive source review; a fixture is optional. `synthetic_fixture` and `live_mailbox` require a saved local evidence asset. An agent reviewer must identify itself as an agent. No human review or live-mailbox evidence has been invented. URL syntax and local-file existence are checked; the gate does not prove remote HTTP availability or claim accuracy.

Unattended selection chooses the first pending topic with a valid ready record, otherwise drafts the first pending topic into `internal/blog-drafts/`, outside the deployed output. The drafting prompt cannot mark a record ready. The publisher prefers a reviewed internal draft, checks readiness before copying it into deployed docs, builds discovery, and marks the queue entry published only after the build succeeds. A scheduled draft reports awaiting review instead of falsely claiming remote publication. Push remains subject to the user's standing explicit authorization requirement.

Commands:
- `python3 scripts/content_gate.py SLUG`: basic facts/structure checks only.
- `python3 scripts/content_gate.py --ready SLUG`: basic checks plus evidence readiness for docs HTML.
- `python3 scripts/publish_blog.py --select`: prints `publish SLUG`, `draft SLUG`, or `empty`.
- `python3 scripts/publish_blog.py SLUG`: full gate, then build and queue mutation.

Validation: tests first failed because readiness functions were absent, then passed after implementation. Python tests cover missing/draft/stale hash/version/future review/malformed citation/missing asset/broken local links, source-review readiness, generated-region stability, unknown publication, empty/unready queue selection, plus prior factual/link/date checks and scheduler network/dirty-tree checks. Publisher integration fixtures verify ready publication and rejection without queue/discovery changes. No dependency added.
