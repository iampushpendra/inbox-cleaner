You are running the Inbox Cleaner editorial job. Read BLOG_JOB_ACTION and BLOG_JOB_SLUG from the environment; the wrapper selects the first pending article with a valid publish_ready evidence record, otherwise the first pending topic without an existing draft. If every pending topic has a draft awaiting review, the wrapper stops quietly. Never pick a different slug.

If BLOG_JOB_ACTION=draft:
1. Read the full selected topic brief, scripts/blog_prompt.md, scripts/content-records.json, manifest.json and current official primary sources. Validate the distinct reader contribution. If the intent overlaps an existing guide without useful information gain, report the overlap and stop.
2. Save the article ONLY to internal/blog-drafts/{slug}.html. Never place an unreviewed draft in docs/, the deployed output directory. Preserve any existing draft unless improving it meaningfully.
3. Save this slug's draft evidence ONLY to `internal/blog-drafts/{slug}.evidence.json`, with actual sources and review notes, limitations, information_gain, related_links, manifest version, and assets if present. Do not edit tracked scripts/content-records.json during drafting. That file is updated only during a separate reviewed promotion. Keep state=draft until a substantive source review is performed. You may record state=evidence_checked and the actual agent reviewer after such a review, but this scheduled drafting run MUST NOT set publish_ready. Do not invent human approval, mailbox testing or screenshots. Documentation-only work can be verified through source review; live mailbox testing is not required when no live behavior is claimed.
4. Report that the draft awaits readiness review. Do not publish, commit or push in draft mode.

If BLOG_JOB_ACTION=publish:
1. Read the selected pending topic and its evidence record. Run python3 scripts/publish_blog.py {slug}. The publisher independently enforces readiness, sources, current manifest version and exact authored-post fingerprint. If rejected, report the blockers and stop; never change the record to make a rejected article pass.
2. Run the site checks. Stage only the selected post, scripts/blog-topics.json, scripts/content-records.json and generated discovery changes in docs/index.html, docs/sitemap.xml and docs/blog. Commit with a descriptive message.
3. A push needs explicit user authorization under the standing Git rules. This scheduled job does not itself grant new push authorization. If authorization is absent, report the local commit awaiting push and stop.
4. Report the slug, target query, pending count, actual verification_kind, sources reviewed, distinct information gain and limitations. Make no ranking or AI citation guarantees.

Existing published refreshes belong in scripts/blog-refreshes.json and are never new-post work. Never run deploy commands, force-push, amend, rebase, or stage unrelated changes.
