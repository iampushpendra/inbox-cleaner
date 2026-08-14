You are running the daily blog-publishing job for the Inbox Cleaner project (a free Gmail bulk-delete tool at https://inbox-cleaner.vercel.app). This repo's Vercel project auto-deploys on every push to main, so a successful push is a successful publish.

Do the following, in order:

1. Read scripts/blog-topics.json. Find the FIRST entry with "status": "pending". If there are none, print 'Queue empty - no pending topics, nothing to publish today.' and stop here (do not commit or push anything).

2. Read scripts/blog_prompt.md - it's the exact AEO content spec and HTML shell this project's blog posts must follow (quick-answer box, H2s phrased as search questions, HowTo JSON-LD if the post has numbered steps, a 5-question FAQ section with matching FAQPage JSON-LD, and at least 2 internal links in body prose to existing published posts). Follow it precisely - every required element is a hard requirement, not a suggestion.

3. Look at 2-3 existing files in docs/blog/*.html (e.g. docs/blog/gmail-delete-all-promotional-emails.html is a good recent reference) to match the exact HTML shell, class names, and tone already in use. Do not deviate from the shared docs/style.css class names - no inline styles.

4. Write the new post to docs/blog/{slug}.html for the pending topic's slug, using its target_query and eyebrow fields. Word count 900-1300 in .blog-body. Use today's real date (check with `date -u +%Y-%m-%d`) for datePublished/dateModified and the 'Updated Month Year' line - do not reuse a hardcoded date from an example.

5. Run `python3 scripts/publish_blog.py {slug}` from the repo root - this appends the post to docs/sitemap.xml and flips the topic's status to "published" in scripts/blog-topics.json. Confirm it printed both confirmation lines before moving on.

6. Stage ONLY the three files this task touched: `git add docs/blog/{slug}.html docs/sitemap.xml scripts/blog-topics.json`. Do not run `git add -A` or `git add .` - if `git status` shows any other modified or untracked files, leave them alone, they are not part of this job.

7. Commit with a message like `blog: publish {slug} (AEO daily post)` and push to main: `git push origin main`. Do not force push. Do not amend. If the push is rejected because main has moved, run `git pull --rebase origin main` once and retry the push - if it still fails, stop and report the error rather than force-pushing.

8. Report a short summary: which slug was published, the target query, and how many pending topics remain in the queue after this run.

Do not touch README.md, docs/index.html, docs/app.js, or docs/style.css beyond what publish_blog.py already handles - those are outside this job's scope. Do not run `vercel` or any deploy command yourself - the push to main is sufficient, Vercel's GitHub integration handles the deploy.
