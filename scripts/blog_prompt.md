You are writing a source-backed, answer-first blog post for Inbox Cleaner (https://inbox-cleaner.vercel.app), a free Chrome extension that groups Gmail emails by sender and moves selected senders' emails to Trash. The primary goal of every article is an installation from the verified Chrome Web Store listing in scripts/site-config.json.

**Target query:** {target_query}
**Slug:** {slug}
**Date:** {today}
**Eyebrow label:** {eyebrow}

**Published posts available for internal linking:**
{existing_posts}

---

## Use the editorial brief before drafting

Read this slug's full entry in `scripts/blog-topics.json`, not only its target query. Follow `answer_angle`, `intent_owner`, `hub_slug`, `related_published_slugs`, `evidence_basis` and `required_review`. Consult `internal/superpowers/plans/2026-10-17-blog-editorial-strategy.md` for priorities and the separate existing-page refresh list. Only `pending` entries are eligible for a new article; `deferred` entries belong in their intent owner or require more evidence.

Cluster impressions are overlapping sums of disclosed GSC rows, not keyword search volume, article demand, or ChatGPT prompts. An adjacent-cluster brief is a hypothesis. Never turn private analytics or internal plan links into public article evidence.

Before drafting, inspect current search results and authoritative help pages for the exact job. Record the results reviewed and one specific contribution in the publishing summary. The brief's proposed angle must be validated, not treated as proven information gain. If no distinct useful contribution exists, stop and report the overlapping intent; do not manufacture a new URL just to fill a slot.

## Answer quality for ChatGPT discovery

- Lead with a self-contained answer that names Gmail and the relevant device, scope and limitation. Use natural questions and short, independently understandable sections. This improves readability and citability; it does not guarantee citation or placement.
- Add a practical contribution: a tested query with expected results, a decision table, an original screenshot or a reproducible troubleshooting branch. Mark untested observations honestly. Never invent experiments, screenshots, benchmark numbers or personal experience.
- Cite current primary sources next to procedural claims. For query syntax start at https://support.google.com/mail/answer/7190?hl=en and for deletion/recovery at https://support.google.com/mail/answer/7401?hl=en; use the appropriate device-specific documentation. Recheck sources at writing time.
- For search recipes, show the query, what it matches, what it can miss, and the review step. Gmail matches messages but can display mixed conversations; negative or age criteria do not guarantee every message in a returned thread is safe to delete. Google documents this caveat for negative operators.
- Explain when the extension fits and when native Gmail is the appropriate tool. Sender-wide extension deletion cannot preserve date, category, size or starred-mail filters. Counts do not measure bytes. It needs desktop Chrome and an open Gmail tab; do not promise an in-extension Undo or account safeguard without verified shipped behavior.
- Comparisons disclose that Inbox Cleaner publishes the article, state selection criteria, include native Gmail as an option and cite checked competitor facts with a check date. Never assert that we are best or that another product is unsafe without evidence.
- Schema must match visible content; neither FAQPage nor HowTo guarantees rich results or AI inclusion. Do not add special AI markup, keyword stuffing, fake third-party endorsements, hidden assistant instructions or a pile of near-identical FAQs.
- Preserve original datePublished on refreshes; set dateModified to the real substantive edit date. Add a visible source/review note describing what was checked, without fabricated bylines or testing credentials.

## Output requirements

Save drafts to `internal/blog-drafts/{slug}.html`, outside deployed docs/. Publication requires a separately reviewed `publish_ready` record in `scripts/content-records.json`; citation URLs alone never establish readiness.

Output a single, complete, raw HTML file. No markdown fences. No explanation before or after the HTML. The reviewed publisher copies the draft to `docs/blog/{slug}.html` only after the readiness gate passes.

The post MUST contain all 5 of the following elements. Any missing element is a failure.

These elements are for the reader, not for a machine. Word count, FAQ count and schema markup are NOT quality signals and none of them earn a ranking on their own; write the shortest honest answer to the query. `scripts/content_gate.py` enforces factual and structural correctness, not usefulness - usefulness is still your responsibility.

### 1. Quick-answer box (featured snippet target)
The very first element inside `<div class="blog-body">` must be:
```html
<div class="quick-answer">
  <strong>Quick answer:</strong> [2-3 sentence direct answer. Open with the target query rephrased as a declarative statement. Be specific and immediately actionable — no filler.]
</div>
```
Answer the question directly and completely. It should be useful when read independently; never state something here that the body then contradicts. AI assistants may or may not cite it.

### 2. H2 headers as useful reader questions
Use natural-language reader questions for substantive H2s. The first H2 should address the main job without mechanically repeating the quick answer. The FAQ section label is an exception.
- CORRECT: `<h2>How do I delete all promotional emails in Gmail?</h2>`
- WRONG: `<h2>Deleting promotional emails</h2>`

### 3. HowTo JSON-LD (in `<head>`, only when post contains numbered steps)
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "[exact H1 title]",
  "step": [
    { "@type": "HowToStep", "name": "[short step name]", "text": "[full step description]" }
  ]
}
```

### 4. FAQPage — genuine Q&As at the bottom of `.blog-body`, plus JSON-LD in `<head>`

Add a question only if a reader would actually ask it and you can answer it honestly. Do not pad to a fixed number.

HTML (these CSS classes already exist in `../style.css` — no inline styles):
```html
<h2>Frequently asked questions</h2>
<div class="faq-list">
  <div class="faq-item">
    <p class="faq-q">[Question?]</p>
    <p class="faq-a">[Direct answer, 1–3 sentences. Be specific.]</p>
  </div>
</div>
```
Include only useful follow-up questions supported by the brief or research, with no fixed count. Avoid restating the H2s.

FAQPage JSON-LD in `<head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question?]",
      "acceptedAnswer": { "@type": "Answer", "text": "[Answer]" }
    }
  ]
}
```

### 5. Internal links (at least 3, inside `.blog-body` paragraph text)
Link contextually to at least 3 posts from the published list above. Use descriptive, natural anchor text that accurately describes the destination. Format: `<a href="../blog/[slug].html">[Title]</a>`. Must appear inside `<p>` tags in the body — not in the CTA block or footer.

---

## Required HTML structure

Match this shell exactly. Every class name, element order, and attribute matters — the shared `../style.css` depends on them.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="canonical" href="https://inbox-cleaner.vercel.app/blog/{slug}.html">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Concise title matching the specific question; year only when meaningful] | Inbox Cleaner</title>
  <meta name="description" content="[155-char or fewer. Answer the query directly. No keyword stuffing.]">
  <meta property="og:title" content="[same as title]">
  <meta property="og:description" content="[same as meta description]">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://inbox-cleaner.vercel.app/blog/{slug}.html">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "[H1 without year]",
    "datePublished": "{today}",
    "dateModified": "{today}",
    "author": { "@type": "Organization", "name": "Inbox Cleaner" },
    "publisher": { "@type": "Organization", "name": "Inbox Cleaner", "url": "https://inbox-cleaner.vercel.app" }
  }
  </script>
  <!-- HowTo JSON-LD here (if post has numbered steps) -->
  <!-- FAQPage JSON-LD here (always required) -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>📥</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
  <link rel="stylesheet" href="../style.css">
</head>
<body>

<nav id="nav">
  <a class="nav-logo" href="/">📥 Inbox<span>Cleaner</span></a>
  <a class="blog-nav-cta" href="https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep">Add to Chrome →</a>
</nav>

<main>
  <div class="blog-wrap">
    <span class="blog-eyebrow">{eyebrow}</span>
    <h1 class="blog-h1">[Title — no year, concise, matches target query intent]</h1>
    <p class="blog-meta">Updated [Month Year from today] · [N] min read</p>

    <div class="blog-body">

      <!-- 1. REQUIRED: quick-answer box — first element -->
      <div class="quick-answer">
        <strong>Quick answer:</strong> [2-3 sentence direct answer]
      </div>

      <!-- Body: opening paragraph, H2 sections, steps or prose, internal links -->

      <!-- CTA block — place at a natural mid-post break, not at the very end -->
      <div class="blog-cta">
        <h3>Clean up Gmail with the Chrome extension</h3>
        <p>Install from the Chrome Web Store, then open Gmail and click Inbox Cleaner. Emails go to Trash (30-day recovery window).</p>
        <a class="blog-cta-btn" href="https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep">Add Inbox Cleaner to Chrome →</a>
      </div>

      <!-- More body content after CTA -->

      <!-- 4. REQUIRED: FAQ section — last section in .blog-body -->
      <h2>Frequently asked questions</h2>
      <div class="faq-list">
        <div class="faq-item">
          <p class="faq-q">[Question?]</p>
          <p class="faq-a">[Answer]</p>
        </div>
        <!-- Add only distinct useful follow-up questions. -->
      </div>

    </div>
  </div>
</main>

<footer>
  <p>Built by <a href="https://github.com/iampushpendra" target="_blank" rel="noopener">@iampushpendra</a> · <a href="../privacy.html">Privacy Policy</a> · <a href="https://github.com/iampushpendra/inbox-cleaner" target="_blank" rel="noopener">GitHub</a> · Emails go to Trash — you have 30 days to restore them.</p>
</footer>

</body>
</html>
```

---

## Content guidelines

- **Length:** The shortest complete answer that solves the job. No word-count target or filler.
- **Tone:** Direct and practical. Write for someone frustrated with Gmail right now, not for an SEO bot. Short sentences. Active voice.
- **Gmail accuracy:** Gmail selects the current page first (page size depends on settings); the select-all-conversations banner extends selection to all matching results. The Chrome extension works inside an open Gmail tab, scans categories and ranks senders. Do not conflate it with the separate browser version's Gmail API authentication. Emails move to Trash (30-day recovery). Never claim Inbox Cleaner permanently deletes.
- **Steps:** Use `<ol class="blog-steps">` for numbered steps — the CSS already styles these with large counters.
- **No inline CSS.** Every style comes from `../style.css`.
- **Inbox Cleaner:** Introduce once when sender-wide cleanup fits, after covering the manual Gmail method. Do not assert it is faster without measurements. One `blog-cta` block is enough — don't mention the tool in every paragraph.
- **Internal links:** Weave them into prose naturally — "If your inbox is flooded with newsletters, see [How to Delete All Emails from One Sender in Gmail](../blog/delete-all-emails-from-one-sender-gmail.html) for the fastest approach."
- **Do not repeat a target query already covered by a published post.** Check `scripts/blog-topics.json` for the full topic list before choosing angles, to keep each post distinct.

- **Conversion:** Use the direct Chrome Web Store URL in `scripts/site-config.json` for installation CTAs. Never label an installation as no-install. Include an All guides link to `/blog/` and the homepage logo link. The site generator supplies related guides and normalizes the install buttons.


## Evidence record and readiness

Records are keyed by exact slug in scripts/content-records.json. States are draft, evidence_checked, publish_ready. Drafting cannot approve itself for scheduled publication. A substantive later reviewer may be an identified agent or human: record the actual identity and kind, never invent human signoff. A source_review can be sufficient for documentation-only content when review_notes explain the claim-by-claim check and the article contributes a useful decision table or worked example. synthetic_fixture and live_mailbox must include saved local assets; never label a synthetic example as live verification.

For publish_ready, fill intent_owner matching the brief, product_manifest_version matching manifest.json, sources (HTTPS url, supports, substantive review_notes), assets (repo-relative paths, or [] for source review), verified_on (real ISO date), limitations (non-empty list), information_gain, related_links (existing local absolute URLs), reviewer ({identity, kind}), and post_sha256. Calculate the hash after substantive review with `python3 -c 'import sys; from pathlib import Path; sys.path.insert(0,"scripts"); from content_gate import post_fingerprint; print(post_fingerprint(Path("internal/blog-drafts/SLUG.html")))'`. Hash is SHA-256 of UTF-8 HTML excluding complete AUTO:name:start/end generated regions only. Any authored edit, including install CTA normalization by the build, invalidates it; recheck and review the changed article rather than copying its new hash blindly. No record field proves external truth: reviewers must actually inspect the cited substance. The gate checks citation syntax and saved file existence, not HTTP availability.

Run `python3 scripts/content_gate.py --ready SLUG` for deployed HTML readiness; `python3 scripts/content_gate.py SLUG` checks basic structure/facts only and does not authorize publication. The publisher accepts only known pending topics or already-published refreshes, and applies full readiness to both.
