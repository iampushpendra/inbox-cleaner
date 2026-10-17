You are running one scheduled blog-publishing job for the Inbox Cleaner project (a free Chrome extension for Gmail cleanup at https://inbox-cleaner.vercel.app). This repo's Vercel project auto-deploys on every push to main, so a successful push is a successful publish.

Do the following, in order:

Publish exactly one new article per run. There are four scheduled runs per day; an article published earlier today does not replace this run.

1. Read scripts/blog-topics.json. Find the FIRST entry with "status": "pending". If there are none, print 'Queue empty - no pending topics, nothing to publish today.' and stop here (do not commit or push anything).

2. Read scripts/blog_prompt.md - it's the exact AEO content spec and HTML shell this project's blog posts must follow (quick-answer box, H2s phrased as search questions, HowTo JSON-LD if the post has numbered steps, a FAQ section of genuine reader questions with matching FAQPage JSON-LD, and at least 2 internal links in body prose to existing published posts). Follow it precisely - every required element is a hard requirement, not a suggestion.

2a. Before writing, read these facts about the packaged extension. They are enforced: `python3 scripts/publish_blog.py` runs scripts/content_gate.py and refuses the post with a non-zero exit if any of them appear, so a run that writes them wastes the queue entry.
- It has NO Gmail API, NO OAuth and NO network code. Never say it works "via/through the Gmail API". It reads Gmail's rendered DOM inside a Gmail tab you already have open.
- It never claims to exceed Gmail's page size, never says "no 50-per-page limit", "no per-page limit" or "no timeouts" about itself. Senders are processed in batches of up to 20 per query, each a sequential Gmail navigation.
- Selecting senders and clicking Move to Trash are two separate user actions. Do not describe it as "one click" / "one-click" / "single-click".
- It moves mail to Gmail Trash, which is recoverable for 30 days. Never claim it permanently deletes, frees storage, or reclaims a number of GB.
- Counts are exact only for the top 250 senders; longer lists show a "~". Do not say it ranks "every" sender or scans with "no practical limit".
- It requires desktop Chrome with an already-open Gmail tab. It does not work on mobile.
- Deleting by sender is sender-wide. It cannot honour `older_than:`, `category:` or `-is:starred` from a Gmail search. If your guide tells the reader to exclude or star something, say explicitly that the extension cannot carry that over.
- Never tell readers to "Connect Gmail" as the route to this product; that is a separate OAuth web app. Point at the Chrome Web Store URL in scripts/site-config.json.
- A Gmail filter tests each email as it arrives, so an age operator like `older_than:30d` can never match newly delivered mail. Do not recommend it as a standing auto-delete rule.
- Describe Gmail's own behaviour accurately even where it flatters the product: Gmail's page size is 50, and "select all conversations that match this search" extends selection beyond the page. You may cite https://support.google.com/mail/answer/7401?hl=en.

2b. Write one sentence in the post stating what it adds beyond the existing results for that query, and cite a primary source (Google's help centre) for any Gmail procedure.

3. Look at 2-3 existing files in docs/blog/*.html (e.g. docs/blog/gmail-delete-all-promotional-emails.html is a good recent reference) to match the exact HTML shell, class names, and tone already in use. Do not deviate from the shared docs/style.css class names - no inline styles.

4. Write the new post to docs/blog/{slug}.html for the pending topic's slug, using its target_query and eyebrow fields. Write for the reader: the shortest complete honest answer, with nothing padding it to a length. Use today's real date (check with `TZ=Asia/Kolkata date +%Y-%m-%d`) for datePublished/dateModified and the 'Updated Month Year' line - do not reuse a hardcoded date from an example.

5. Run `python3 scripts/content_gate.py {slug}` first. It exits non-zero and lists every problem if the post contains a disproved claim, a future or unparseable date, a broken local link, an invalid canonical or JSON-LD, or a link to an unpublished internal document. Fix everything it reports and re-run until it prints 'Gate passed'. You can also run it directly on an existing slug at any time to check your work.

6. Run `python3 scripts/publish_blog.py {slug}` from the repo root - it re-runs that same gate, then regenerates the sitemap, complete blog index, homepage guide links, related links on all articles, and extension CTAs from the article files, then flips the topic's status to "published" in scripts/blog-topics.json. Confirm it printed the gate and both confirmation lines before moving on. If it refuses to publish, the topic stays pending: fix the reported problems rather than working around the command.

7. The wrapper requires a clean tracked working tree before the run. Stage the new post and generated discovery files: `git add docs/blog/{slug}.html docs/sitemap.xml scripts/blog-topics.json docs/index.html` followed by `git add --update -- docs/blog`. This includes the regenerated blog index and related links in existing posts. Do not run `git add -A` or `git add .`. Leave unrelated files alone.

8. Commit with a message like `blog: publish {slug} (AEO daily post)` and push to main: `git push origin main`. Do not force push. Do not amend. If the push is rejected because main has moved, run `git pull --ff-only origin main` once and retry the push. If the branches have diverged or the retry fails, stop and report the error. Do not rebase, amend, or force-push.

9. Confirm that all primary install buttons point directly to the Chrome Web Store URL from scripts/site-config.json. Keep at least three contextual links to relevant published articles in the body; the generator adds five more related links and the blog hub automatically. Never promise that sitemap inclusion guarantees crawling or indexing.

10. Report a short summary: which slug was published, the target query, and how many pending topics remain in the queue after this run.

Do not hand-edit README.md, docs/index.html, docs/app.js, or docs/style.css beyond what publish_blog.py already handles - those are outside this job's scope. Do not run `vercel` or any deploy command yourself - the push to main is sufficient, Vercel's GitHub integration handles the deploy.
