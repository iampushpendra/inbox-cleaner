# Blog Generation Pipeline — Design Spec

**Date:** 2026-07-05
**Goal:** Automated pipeline that generates AEO-optimized blog posts for inbox-cleaner.vercel.app to convert GSC impressions into first clicks from Google and AI search.

---

## Context

Current state (as of 2026-07-05 GSC report):
- 3 published blogs, 40 total impressions over 7 days, 0 clicks
- Best performer: `delete-all-emails-from-one-sender-gmail.html` — 36 impressions, position 44.39
- Top queries all cluster around "delete all emails from one sender" variants — page 4-5 of Google
- Two levers to move from page 4 to page 1: more posts (topical authority) + stronger AEO signals per post

---

## Architecture

**Approach B: Script + editable prompt template**

Three files added to the repo:

```
scripts/
  blog-topics.json      ← queue of topics with status tracking
  blog_prompt.md        ← AEO prompt template (edit without touching code)
  generate_blog.py      ← runner script
```

No new dependencies beyond the `anthropic` Python package. Runs locally. Deploys manually with `npx vercel --prod`.

---

## Data Model: `blog-topics.json`

Array of topic objects. Script picks the first `pending` entry on each run.

```json
[
  {
    "slug": "how-to-bulk-delete-gmail-emails",
    "target_query": "how to bulk delete gmail emails",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  }
]
```

**Status transitions:** `pending` → `published`

The 3 existing posts are pre-marked `published` so they are never regenerated.

### Pre-seeded queue (12 topics, all derived from GSC query data and cluster gaps)

| Slug | Target Query | Status |
|------|-------------|--------|
| `delete-all-emails-from-one-sender-gmail` | how to delete all emails from one sender in gmail | published |
| `gmail-inbox-zero` | gmail inbox zero | published |
| `how-to-free-up-gmail-storage` | how to free up gmail storage | published |
| `how-to-bulk-delete-gmail-emails` | how to bulk delete gmail emails | pending |
| `gmail-delete-all-promotional-emails` | how to delete all promotional emails in gmail | pending |
| `how-to-unsubscribe-from-emails-gmail` | how to unsubscribe from emails in gmail | pending |
| `how-to-select-all-emails-gmail` | how to select all emails in gmail | pending |
| `gmail-delete-all-unread-emails` | how to delete all unread emails in gmail | pending |
| `gmail-archive-vs-delete` | gmail archive vs delete | pending |
| `gmail-filters-delete-emails-automatically` | gmail filters to delete emails automatically | pending |
| `how-to-delete-old-emails-gmail` | how to delete old emails in gmail | pending |
| `gmail-storage-full-how-to-fix` | gmail storage full how to fix | pending |
| `clean-up-gmail-inbox` | how to clean up gmail inbox fast | pending |
| `gmail-bulk-delete-by-sender` | gmail bulk delete by sender | pending |
| `how-to-delete-thousands-of-emails-gmail` | how to delete thousands of emails in gmail | pending |

**To add new topics:** append an object with `"status": "pending"` to the array.

---

## Script Flow: `generate_blog.py`

Running `python scripts/generate_blog.py`:

1. **Load queue** — reads `blog-topics.json`, finds first `status: "pending"` entry. Exits with a clear message if queue is empty.
2. **Build prompt** — reads `blog_prompt.md`, injects:
   - `{target_query}` — the search query to optimize for
   - `{slug}` — used for filename and canonical URL
   - `{existing_posts}` — list of published post slugs + their H1 titles (scraped from `docs/blog/*.html`) for accurate internal linking
   - `{today}` — ISO date for `datePublished` / `dateModified` / sitemap `<lastmod>`
3. **Call Claude API** — single call to `claude-sonnet-4-6` with streaming. Output streamed to terminal so progress is visible.
4. **Write post** — saves full HTML response to `docs/blog/{slug}.html`.
5. **Update sitemap** — parses `docs/sitemap.xml`, appends new `<url>` block with today's date and `priority: 0.8`. Writes back.
6. **Mark published** — flips topic `status` to `"published"` in `blog-topics.json`, saves file.
7. **Print summary** — output path, canonical URL, and deploy reminder.

**Environment:** `ANTHROPIC_API_KEY` env var required. No other flags or arguments.

---

## AEO Prompt Contract (`blog_prompt.md`)

The prompt instructs Claude to output a raw, complete HTML file. All 5 elements are mandatory — the prompt treats any missing element as a hard failure.

### 1. Quick-Answer Box
```html
<div class="quick-answer">
  <strong>Quick answer:</strong> [2-3 sentence direct answer starting with the exact query phrased as a statement]
</div>
```
Positioned as the first element inside `.blog-body` (after `.blog-meta`). This is the featured snippet target — Google extracts verbatim from this block.

### 2. H2 Headers as Exact Search Questions
Every major section header must be a natural-language question matching how people search. Examples:
- "How do I bulk delete Gmail emails?" ✓
- "Bulk deleting Gmail emails" ✗

### 3. HowTo JSON-LD (when post contains numbered steps)
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "...",
  "step": [
    { "@type": "HowToStep", "name": "...", "text": "..." }
  ]
}
```
Placed in `<head>` alongside the Article schema. Eligible for Google's numbered rich result.

### 4. FAQPage JSON-LD + HTML
5 Q&As at the bottom using existing `.faq-item` / `.faq-q` / `.faq-a` classes, plus a `FAQPage` schema block in `<head>`. Targets the "People Also Ask" box.

### 5. Internal Links
At least 2 `<a href="../blog/{slug}.html">` links to other published posts inside `.blog-body` prose (not just the CTA or footer), using their actual H1 titles as anchor text. Contextual placement in body copy is what counts for SEO. The prompt receives the published post list as input so links are always accurate.

### HTML Shell Contract
Every post must match the existing blog structure exactly:
- `<link rel="stylesheet" href="../style.css">` (shared styles, no inline CSS)
- `<nav id="nav">` with logo link to `/` and "Try the free tool →" CTA
- `<main><div class="blog-wrap">` containing: `.blog-eyebrow`, `.blog-h1`, `.blog-meta`, `.blog-body`
- `<div class="blog-cta">` with `<a class="blog-cta-btn">` at a natural mid-post break
- `<footer>` matching the existing footer pattern
- Article JSON-LD, canonical tag, OG tags, Inter font — all required

---

## Sitemap Update

New `<url>` block appended before `</urlset>`:

```xml
<url>
  <loc>https://inbox-cleaner.vercel.app/blog/{slug}.html</loc>
  <lastmod>{today}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

---

## Deployment (manual, after review)

```bash
# Review the generated post
open docs/blog/{slug}.html

# Deploy when satisfied
npx vercel --prod
```

---

## Out of Scope

- GitHub Actions / scheduled automation (can be added later)
- Topic auto-discovery from GSC API
- Post self-review / validation pass (Approach C)
- Image generation or OG image automation
- Analytics or click tracking per post
