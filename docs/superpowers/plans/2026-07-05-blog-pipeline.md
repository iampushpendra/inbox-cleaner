# Blog Generation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Python script that picks the next pending topic from a queue, calls Claude API, and writes a fully AEO-optimized HTML blog post to `docs/blog/`, updating the sitemap automatically.

**Architecture:** Approach B — script + editable prompt template. Three new files in `scripts/`: `blog-topics.json` (queue), `blog_prompt.md` (editable AEO prompt), `generate_blog.py` (runner). One CSS addition to `docs/style.css`. No framework, no build step.

**Tech Stack:** Python 3.10+, `anthropic` Python SDK (pip install), `claude-sonnet-4-6` model, vanilla file I/O. Deploy target: Vercel static, manual `npx vercel --prod`.

## Global Constraints

- Working directory: `/Users/pushpendrasingh/projects/inbox-cleaner`
- All blog HTML files go to `docs/blog/{slug}.html`
- Shared styles: `../style.css` — no inline CSS ever added to blog posts
- Base URL: `https://inbox-cleaner.vercel.app`
- Model: `claude-sonnet-4-6`
- API key: `ANTHROPIC_API_KEY` environment variable — never hardcoded
- `blog-topics.json` status values: exactly `"pending"` or `"published"`
- Script run command: `python scripts/generate_blog.py` (no arguments)
- Sitemap: `docs/sitemap.xml` — append, never rewrite existing entries

---

### Task 1: Add `.quick-answer` CSS class to `docs/style.css`

**Files:**
- Modify: `docs/style.css` — add `.quick-answer` block after `.blog-meta`

**Interfaces:**
- Produces: `.quick-answer` CSS class consumed by all generated blog posts

- [ ] **Step 1: Locate the insertion point**

Open `docs/style.css`. Find line ~958 — the `.blog-meta` block:

```css
.blog-meta {
  font-size: 13px;
  color: var(--gray-400);
  margin-bottom: 36px;
  padding-bottom: 32px;
  border-bottom: 2px solid var(--dark);
}
```

- [ ] **Step 2: Add the `.quick-answer` block directly after `.blog-meta`**

```css
.quick-answer {
  background: var(--accent-light);
  border: 2px solid var(--accent);
  border-radius: 4px;
  padding: 18px 20px;
  margin-bottom: 32px;
  font-size: 16px;
  color: var(--gray-600);
  line-height: 1.7;
  box-shadow: 3px 3px 0 var(--accent);
}
.quick-answer strong {
  color: var(--dark);
  font-weight: 700;
}
```

- [ ] **Step 3: Verify visually**

Open `docs/blog/delete-all-emails-from-one-sender-gmail.html` in a browser. The existing post should look unchanged (no `.quick-answer` div in it). Then manually add a test div to confirm rendering:

```html
<!-- add temporarily to the existing post, remove after checking -->
<div class="quick-answer"><strong>Quick answer:</strong> Test box appears correctly.</div>
```

Expected: orange-tinted box with left accent border and bold "Quick answer:" label, matching the neo-brutalist style.

- [ ] **Step 4: Remove the test div and commit**

```bash
git add docs/style.css
git commit -m "style: add .quick-answer CSS class for AEO blog posts"
```

---

### Task 2: Create `scripts/blog-topics.json`

**Files:**
- Create: `scripts/blog-topics.json`

**Interfaces:**
- Produces: JSON array consumed by `generate_blog.py` → `load_queue()` and `mark_published()`

- [ ] **Step 1: Create `scripts/` directory if it doesn't exist**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Write `scripts/blog-topics.json`**

```json
[
  {
    "slug": "delete-all-emails-from-one-sender-gmail",
    "target_query": "how to delete all emails from one sender in gmail",
    "eyebrow": "Gmail Tips",
    "status": "published"
  },
  {
    "slug": "gmail-inbox-zero",
    "target_query": "gmail inbox zero",
    "eyebrow": "Gmail Tips",
    "status": "published"
  },
  {
    "slug": "how-to-free-up-gmail-storage",
    "target_query": "how to free up gmail storage",
    "eyebrow": "Gmail Tips",
    "status": "published"
  },
  {
    "slug": "how-to-bulk-delete-gmail-emails",
    "target_query": "how to bulk delete gmail emails",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "gmail-delete-all-promotional-emails",
    "target_query": "how to delete all promotional emails in gmail",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "how-to-unsubscribe-from-emails-gmail",
    "target_query": "how to unsubscribe from emails in gmail",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "how-to-select-all-emails-gmail",
    "target_query": "how to select all emails in gmail",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "gmail-delete-all-unread-emails",
    "target_query": "how to delete all unread emails in gmail",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "gmail-archive-vs-delete",
    "target_query": "gmail archive vs delete",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "gmail-filters-delete-emails-automatically",
    "target_query": "gmail filters to delete emails automatically",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "how-to-delete-old-emails-gmail",
    "target_query": "how to delete old emails in gmail",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "gmail-storage-full-how-to-fix",
    "target_query": "gmail storage full how to fix",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "clean-up-gmail-inbox",
    "target_query": "how to clean up gmail inbox fast",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "gmail-bulk-delete-by-sender",
    "target_query": "gmail bulk delete by sender",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  },
  {
    "slug": "how-to-delete-thousands-of-emails-gmail",
    "target_query": "how to delete thousands of emails in gmail",
    "eyebrow": "Gmail Tips",
    "status": "pending"
  }
]
```

- [ ] **Step 3: Verify it parses**

```bash
python3 -c "import json; t = json.load(open('scripts/blog-topics.json')); print(len(t), 'topics,', sum(1 for x in t if x['status']=='pending'), 'pending')"
```

Expected output: `15 topics, 12 pending`

- [ ] **Step 4: Commit**

```bash
git add scripts/blog-topics.json
git commit -m "feat: add blog topic queue (15 topics, 12 pending)"
```

---

### Task 3: Create `scripts/blog_prompt.md`

**Files:**
- Create: `scripts/blog_prompt.md`

**Interfaces:**
- Consumes: placeholders `{target_query}`, `{slug}`, `{eyebrow}`, `{existing_posts}`, `{today}` — substituted by `generate_blog.py` → `build_prompt()`
- Produces: filled prompt string passed to Claude API

- [ ] **Step 1: Write `scripts/blog_prompt.md`**

```markdown
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
```

- [ ] **Step 2: Verify placeholders are present**

```bash
python3 -c "
t = open('scripts/blog_prompt.md').read()
for p in ['{target_query}', '{slug}', '{eyebrow}', '{existing_posts}', '{today}']:
    assert p in t, f'Missing placeholder: {p}'
print('All 5 placeholders present')
"
```

Expected: `All 5 placeholders present`

- [ ] **Step 3: Commit**

```bash
git add scripts/blog_prompt.md
git commit -m "feat: add AEO blog prompt template"
```

---

### Task 4: Create `scripts/generate_blog.py` with unit tests

**Files:**
- Create: `scripts/generate_blog.py`
- Create: `scripts/test_generate_blog.py`

**Interfaces:**
- Consumes:
  - `scripts/blog-topics.json` — queue array (from Task 2)
  - `scripts/blog_prompt.md` — prompt template with 5 placeholders (from Task 3)
  - `docs/blog/*.html` — existing posts to extract titles for internal links
  - `docs/sitemap.xml` — sitemap to update
  - `ANTHROPIC_API_KEY` env var
- Produces:
  - `docs/blog/{slug}.html` — the generated post
  - Updated `docs/sitemap.xml`
  - Updated `scripts/blog-topics.json` with topic marked `"published"`

- [ ] **Step 1: Write the failing tests**

Create `scripts/test_generate_blog.py`:

```python
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from generate_blog import load_queue, build_prompt, update_sitemap, mark_published


class TestLoadQueue(unittest.TestCase):
    def test_returns_first_pending(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([
                {"slug": "a", "target_query": "q1", "eyebrow": "Gmail Tips", "status": "published"},
                {"slug": "b", "target_query": "q2", "eyebrow": "Gmail Tips", "status": "pending"},
                {"slug": "c", "target_query": "q3", "eyebrow": "Gmail Tips", "status": "pending"},
            ], f)
            path = Path(f.name)
        result = load_queue(path)
        self.assertEqual(result["slug"], "b")

    def test_returns_none_when_no_pending(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([
                {"slug": "a", "target_query": "q1", "eyebrow": "Gmail Tips", "status": "published"},
            ], f)
            path = Path(f.name)
        result = load_queue(path)
        self.assertIsNone(result)

    def test_returns_none_when_empty(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([], f)
            path = Path(f.name)
        result = load_queue(path)
        self.assertIsNone(result)


class TestBuildPrompt(unittest.TestCase):
    def setUp(self):
        self.template = (
            "Query: {target_query}\n"
            "Slug: {slug}\n"
            "Eyebrow: {eyebrow}\n"
            "Posts: {existing_posts}\n"
            "Date: {today}"
        )
        self.topic = {
            "slug": "test-slug",
            "target_query": "how to test gmail",
            "eyebrow": "Gmail Tips",
            "status": "pending",
        }
        self.posts = [
            {"slug": "post-a", "title": "Post A Title"},
            {"slug": "post-b", "title": "Post B Title"},
        ]

    def test_substitutes_all_placeholders(self):
        result = build_prompt(self.template, self.topic, self.posts, "2026-07-05")
        self.assertIn("how to test gmail", result)
        self.assertIn("test-slug", result)
        self.assertIn("Gmail Tips", result)
        self.assertIn("2026-07-05", result)
        self.assertIn("post-a.html", result)
        self.assertIn("Post A Title", result)

    def test_no_unreplaced_placeholders(self):
        result = build_prompt(self.template, self.topic, self.posts, "2026-07-05")
        self.assertNotIn("{target_query}", result)
        self.assertNotIn("{slug}", result)
        self.assertNotIn("{eyebrow}", result)
        self.assertNotIn("{existing_posts}", result)
        self.assertNotIn("{today}", result)

    def test_existing_posts_formatted_as_list(self):
        result = build_prompt(self.template, self.topic, self.posts, "2026-07-05")
        self.assertIn("- post-a.html", result)
        self.assertIn("- post-b.html", result)


class TestUpdateSitemap(unittest.TestCase):
    def setUp(self):
        self.initial_sitemap = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            '  <url>\n'
            '    <loc>https://inbox-cleaner.vercel.app/</loc>\n'
            '    <lastmod>2026-06-28</lastmod>\n'
            '  </url>\n'
            '</urlset>'
        )

    def test_appends_new_url_before_urlset_close(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".xml", delete=False) as f:
            f.write(self.initial_sitemap)
            path = Path(f.name)
        update_sitemap(path, "new-post", "2026-07-05")
        content = path.read_text()
        self.assertIn("https://inbox-cleaner.vercel.app/blog/new-post.html", content)
        self.assertIn("<lastmod>2026-07-05</lastmod>", content)
        self.assertIn("<priority>0.8</priority>", content)
        self.assertTrue(content.strip().endswith("</urlset>"))

    def test_preserves_existing_entries(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".xml", delete=False) as f:
            f.write(self.initial_sitemap)
            path = Path(f.name)
        update_sitemap(path, "new-post", "2026-07-05")
        content = path.read_text()
        self.assertIn("https://inbox-cleaner.vercel.app/</loc>", content)


class TestMarkPublished(unittest.TestCase):
    def test_flips_status_to_published(self):
        topics = [
            {"slug": "a", "target_query": "q1", "eyebrow": "Gmail Tips", "status": "published"},
            {"slug": "b", "target_query": "q2", "eyebrow": "Gmail Tips", "status": "pending"},
        ]
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(topics, f)
            path = Path(f.name)
        mark_published(path, "b")
        result = json.loads(path.read_text())
        self.assertEqual(result[1]["status"], "published")

    def test_does_not_modify_other_topics(self):
        topics = [
            {"slug": "a", "target_query": "q1", "eyebrow": "Gmail Tips", "status": "pending"},
            {"slug": "b", "target_query": "q2", "eyebrow": "Gmail Tips", "status": "pending"},
        ]
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(topics, f)
            path = Path(f.name)
        mark_published(path, "b")
        result = json.loads(path.read_text())
        self.assertEqual(result[0]["status"], "pending")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests — verify they all fail (ImportError expected)**

```bash
cd /Users/pushpendrasingh/projects/inbox-cleaner
python3 scripts/test_generate_blog.py 2>&1 | head -5
```

Expected: `ModuleNotFoundError: No module named 'generate_blog'`

- [ ] **Step 3: Install the anthropic package**

```bash
pip3 install anthropic
```

Expected: `Successfully installed anthropic-...`

- [ ] **Step 4: Write `scripts/generate_blog.py`**

```python
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

BLOG_DIR = Path(__file__).parent.parent / "docs" / "blog"
SITEMAP_PATH = Path(__file__).parent.parent / "docs" / "sitemap.xml"
TOPICS_PATH = Path(__file__).parent / "blog-topics.json"
PROMPT_PATH = Path(__file__).parent / "blog_prompt.md"
BASE_URL = "https://inbox-cleaner.vercel.app"


def load_queue(topics_path: Path) -> dict | None:
    topics = json.loads(topics_path.read_text())
    for topic in topics:
        if topic["status"] == "pending":
            return topic
    return None


def get_published_posts(blog_dir: Path) -> list[dict]:
    posts = []
    for html_file in sorted(blog_dir.glob("*.html")):
        content = html_file.read_text()
        match = re.search(r'<h1[^>]*class="blog-h1"[^>]*>(.*?)</h1>', content, re.DOTALL)
        if match:
            title = re.sub(r"<[^>]+>", "", match.group(1)).strip()
            posts.append({"slug": html_file.stem, "title": title})
    return posts


def build_prompt(template: str, topic: dict, existing_posts: list[dict], today: str) -> str:
    existing_posts_text = "\n".join(
        f'- {p["slug"]}.html — "{p["title"]}"' for p in existing_posts
    )
    return (
        template
        .replace("{target_query}", topic["target_query"])
        .replace("{slug}", topic["slug"])
        .replace("{eyebrow}", topic.get("eyebrow", "Gmail Tips"))
        .replace("{existing_posts}", existing_posts_text)
        .replace("{today}", today)
    )


def update_sitemap(sitemap_path: Path, slug: str, today: str) -> None:
    content = sitemap_path.read_text()
    new_url = (
        f"  <url>\n"
        f"    <loc>{BASE_URL}/blog/{slug}.html</loc>\n"
        f"    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>0.8</priority>\n"
        f"  </url>\n"
    )
    content = content.replace("</urlset>", new_url + "</urlset>")
    sitemap_path.write_text(content)


def mark_published(topics_path: Path, slug: str) -> None:
    topics = json.loads(topics_path.read_text())
    for topic in topics:
        if topic["slug"] == slug:
            topic["status"] = "published"
            break
    topics_path.write_text(json.dumps(topics, indent=2) + "\n")


def main() -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set.")
        sys.exit(1)

    topic = load_queue(TOPICS_PATH)
    if topic is None:
        print("Queue is empty — no pending topics.")
        print("Add more entries with \"status\": \"pending\" to scripts/blog-topics.json.")
        sys.exit(0)

    today = date.today().isoformat()
    existing_posts = get_published_posts(BLOG_DIR)
    prompt_template = PROMPT_PATH.read_text()
    prompt = build_prompt(prompt_template, topic, existing_posts, today)

    print(f"Generating: {topic['slug']}")
    print(f"Target query: {topic['target_query']}")
    print(f"{'─' * 60}")

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    html_parts: list[str] = []

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=8096,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            html_parts.append(text)

    print(f"\n{'─' * 60}")

    html = "".join(html_parts).strip()
    out_path = BLOG_DIR / f"{topic['slug']}.html"
    out_path.write_text(html)

    update_sitemap(SITEMAP_PATH, topic["slug"], today)
    mark_published(TOPICS_PATH, topic["slug"])

    print(f"\n✓  Written:          {out_path}")
    print(f"✓  Sitemap updated:  docs/sitemap.xml")
    print(f"✓  Topic published:  {topic['slug']}")
    print(f"\n   Canonical URL:   {BASE_URL}/blog/{topic['slug']}.html")
    print(f"\n   Review the post: open {out_path}")
    print(f"   Deploy when ready: npx vercel --prod")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Run the unit tests — verify they all pass**

```bash
python3 scripts/test_generate_blog.py -v
```

Expected output (all PASS):
```
test_does_not_modify_other_topics ... ok
test_flips_status_to_published ... ok
test_appends_new_url_before_urlset_close ... ok
test_preserves_existing_entries ... ok
test_no_unreplaced_placeholders ... ok
test_substitutes_all_placeholders ... ok
test_existing_posts_formatted_as_list ... ok
test_returns_first_pending ... ok
test_returns_none_when_empty ... ok
test_returns_none_when_no_pending ... ok

Ran 10 tests in 0.XXXs

OK
```

- [ ] **Step 6: Run a live end-to-end test**

Make sure `ANTHROPIC_API_KEY` is set, then:

```bash
python3 scripts/generate_blog.py
```

Expected: streaming HTML output to terminal, then:
```
✓  Written:          docs/blog/how-to-bulk-delete-gmail-emails.html
✓  Sitemap updated:  docs/sitemap.xml
✓  Topic published:  how-to-bulk-delete-gmail-emails
```

- [ ] **Step 7: Verify the generated post**

```bash
# Check it opened correctly in a browser
open docs/blog/how-to-bulk-delete-gmail-emails.html
```

Manually verify:
- Quick-answer box appears at top of `.blog-body` (orange-tinted box)
- H2 headers are phrased as questions
- FAQ section appears at the bottom with 5 items
- At least 2 internal links to other posts visible in body prose
- No inline CSS (view source → no `style=` attributes)

```bash
# Check sitemap was updated
grep "how-to-bulk-delete" docs/sitemap.xml
```

Expected: one `<url>` block for the new post.

```bash
# Check topic was marked published
python3 -c "
import json
t = json.load(open('scripts/blog-topics.json'))
for x in t:
    if x['slug'] == 'how-to-bulk-delete-gmail-emails':
        print(x['status'])
"
```

Expected: `published`

- [ ] **Step 8: Commit**

```bash
git add scripts/generate_blog.py scripts/test_generate_blog.py docs/blog/how-to-bulk-delete-gmail-emails.html docs/sitemap.xml scripts/blog-topics.json
git commit -m "feat: add blog generation pipeline + generate first post"
```

---

## Usage going forward

Generate next post:
```bash
python3 scripts/generate_blog.py
```

Add a new topic to the queue:
```bash
# Append to scripts/blog-topics.json:
{
  "slug": "your-new-slug",
  "target_query": "the exact search query to target",
  "eyebrow": "Gmail Tips",
  "status": "pending"
}
```

Tune the AEO prompt:
```bash
# Edit scripts/blog_prompt.md directly — no code changes needed
```

Deploy after reviewing:
```bash
npx vercel --prod
```
