You are writing an AEO-optimized blog post for Inbox Cleaner (https://inbox-cleaner.vercel.app), a free browser tool that bulk-deletes Gmail emails by sender in one click — no Gmail app install required.

**Target query:** {target_query}
**Slug:** {slug}
**Date:** {today}
**Eyebrow label:** {eyebrow}

**Published posts available for internal linking:**
{existing_posts}

---

## Output requirements

Output a single, complete, raw HTML file. No markdown fences. No explanation before or after the HTML. The file must be ready to save directly as `docs/blog/{slug}.html`.

The post MUST contain all 5 of the following elements. Any missing element is a failure:

### 1. Quick-answer box (featured snippet target)
The very first element inside `<div class="blog-body">` must be:
```html
<div class="quick-answer">
  <strong>Quick answer:</strong> [2-3 sentence direct answer. Open with the target query rephrased as a declarative statement. Be specific and immediately actionable — no filler.]
</div>
```
Google extracts this verbatim for featured snippets and AI overviews. Make it count.

### 2. H2 headers as exact search questions
Every `<h2>` must be a natural-language question people actually type. The first H2 must restate the target query as a question.
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

### 4. FAQPage — 5 Q&As at the bottom of `.blog-body`, plus JSON-LD in `<head>`

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
5 items total. Questions must be real variants people search, not restatements of the H2s.

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

### 5. Internal links (at least 2, inside `.blog-body` paragraph text)
Link contextually to at least 2 posts from the published list above. Use their exact titles as anchor text. Format: `<a href="../blog/[slug].html">[Title]</a>`. Must appear inside `<p>` tags in the body — not in the CTA block or footer.

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
  <title>[Concise title with year (2026)] | Inbox Cleaner</title>
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
  <a class="blog-nav-cta" href="/">Try the free tool →</a>
</nav>

<main>
  <div class="blog-wrap">
    <span class="blog-eyebrow">{eyebrow}</span>
    <h1 class="blog-h1">[Title — no year, concise, matches target query intent]</h1>
    <p class="blog-meta">Updated [Month] 2026 · [N] min read</p>

    <div class="blog-body">

      <!-- 1. REQUIRED: quick-answer box — first element -->
      <div class="quick-answer">
        <strong>Quick answer:</strong> [2-3 sentence direct answer]
      </div>

      <!-- Body: opening paragraph, H2 sections, steps or prose, internal links -->

      <!-- CTA block — place at a natural mid-post break, not at the very end -->
      <div class="blog-cta">
        <h3>Delete Gmail emails in bulk — free</h3>
        <p>No install. Runs in your browser. Emails go to Trash (30-day recovery window).</p>
        <a class="blog-cta-btn" href="https://inbox-cleaner.vercel.app">Open Inbox Cleaner →</a>
      </div>

      <!-- More body content after CTA -->

      <!-- 4. REQUIRED: FAQ section — last section in .blog-body -->
      <h2>Frequently asked questions</h2>
      <div class="faq-list">
        <div class="faq-item">
          <p class="faq-q">[Question?]</p>
          <p class="faq-a">[Answer]</p>
        </div>
        <!-- 4 more faq-item divs -->
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

- **Length:** 900–1300 words in `.blog-body`. Authoritative, not padded.
- **Tone:** Direct and practical. Write for someone frustrated with Gmail right now, not for an SEO bot. Short sentences. Active voice.
- **Gmail accuracy:** Gmail's built-in select-all caps at 50 emails per page. The "select all conversations" banner extends it but times out on large batches. Inbox Cleaner scans the entire inbox via Gmail API and ranks by sender count. Emails move to Trash (30-day recovery). Never claim Inbox Cleaner permanently deletes.
- **Steps:** Use `<ol class="blog-steps">` for numbered steps — the CSS already styles these with large counters.
- **No inline CSS.** Every style comes from `../style.css`.
- **Inbox Cleaner:** Introduce once as the faster alternative after covering the manual Gmail method. One `blog-cta` block is enough — don't mention the tool in every paragraph.
- **Internal links:** Weave them into prose naturally — "If your inbox is flooded with newsletters, see [How to Delete All Emails from One Sender in Gmail](../blog/delete-all-emails-from-one-sender-gmail.html) for the fastest approach."
- **Do not repeat a target query already covered by a published post.** Check `scripts/blog-topics.json` for the full topic list before choosing angles, to keep each post distinct.
