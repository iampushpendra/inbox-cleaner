# SEO Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing `docs/index.html` landing page with a featured-snippet paragraph, comparison table, 6 new FAQs, and a sitemap — all to improve ranking for "bulk delete Gmail emails" and long-tail variants.

**Architecture:** Single HTML/CSS page at `docs/index.html` + `docs/style.css`, no build step. Each task is a self-contained HTML/CSS addition. Deploy with `npx vercel --prod` from `/Users/pushpendrasingh/projects/inbox-cleaner`.

**Tech Stack:** Vanilla HTML, CSS custom properties, no JS changes, Vercel static hosting.

## Global Constraints

- Match the existing neo-brutalist design system: `border: 2px solid #1a1a1a`, `box-shadow: 3px 3px 0 var(--dark)`, CSS vars from `:root` in `style.css`
- No new JavaScript — all tasks are HTML/CSS only
- Preserve all existing element IDs and classes — `app.js` depends on them
- Font: Inter (already loaded via Google Fonts)
- Max-width containers: `1100px`, centered, `padding: 64px 40px` (mobile: `40px 20px`)
- Responsive breakpoint at `700px` — add mobile overrides for every new section

---

### Task 1: Hero featured snippet paragraph

**Files:**
- Modify: `docs/index.html` — add `<p class="hero-snippet">` after `<h1>` and before `.hero-actions`
- Modify: `docs/style.css` — add `.hero-snippet` class after `.hero-sub`

**Interfaces:**
- Produces: `.hero-snippet` CSS class consumed by Task 1 HTML only

- [ ] **Step 1: Add CSS class**

Open `docs/style.css`. After the `.hero-sub` block (line ~132), add:

```css
.hero-snippet {
  font-size: 15px;
  color: var(--gray-600);
  margin-bottom: 28px;
  max-width: 560px;
  line-height: 1.6;
  font-weight: 400;
}
```

- [ ] **Step 2: Add paragraph to HTML**

Open `docs/index.html`. Find this line (inside `.hero-inner`, after `<h1>`):

```html
    <p class="hero-sub">See who's flooding your Gmail. Select the worst offenders. Move everything to Trash — in one click.</p>
```

Add the new paragraph directly after it:

```html
    <p class="hero-snippet">Inbox Cleaner scans your Gmail inbox, ranks every sender by email count, and lets you select multiple senders and move all their emails to Trash in one click — no Gmail app install needed.</p>
```

- [ ] **Step 3: Verify visually**

Open `docs/index.html` in a browser (or run `npx vercel dev` and visit `localhost:3000`).
Expected: A smaller gray paragraph appears between the orange sub-heading text and the "Connect Gmail" button. It should sit cleanly without pushing the CTA too far down.

- [ ] **Step 4: Commit**

```bash
cd /Users/pushpendrasingh/projects/inbox-cleaner
git add docs/index.html docs/style.css
git commit -m "seo: add featured snippet paragraph to hero"
```

---

### Task 2: Comparison section

**Files:**
- Modify: `docs/index.html` — add `#section-compare` between `.social-proof` and `#section-waitlist`
- Modify: `docs/style.css` — add `#section-compare` styles after waitlist strip styles

**Interfaces:**
- Produces: `#section-compare` section with `.compare-table` inside

- [ ] **Step 1: Add CSS**

Open `docs/style.css`. After the `#section-waitlist` block, add:

```css
/* ── Comparison section ──────────────────────────────────────────────────── */
#section-compare {
  background: var(--white);
  border-bottom: var(--border);
}

.compare-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 64px 40px;
}

.compare-heading {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--dark);
  margin-bottom: 8px;
}

.compare-sub {
  font-size: 15px;
  color: var(--gray-600);
  margin-bottom: 36px;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  border: var(--border);
  box-shadow: var(--shadow);
}

.compare-table th,
.compare-table td {
  padding: 14px 20px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #e5e5e5;
  border-right: 1px solid #e5e5e5;
}

.compare-table th:last-child,
.compare-table td:last-child {
  border-right: none;
}

.compare-table tr:last-child td {
  border-bottom: none;
}

.compare-table thead th {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background: var(--gray-200);
  color: var(--dark);
}

.compare-table thead th.col-highlight {
  background: var(--dark);
  color: var(--white);
}

.compare-table thead th.col-highlight span {
  color: var(--accent);
}

.compare-table tbody td {
  color: var(--gray-600);
  font-weight: 400;
  line-height: 1.5;
}

.compare-table tbody td:first-child {
  font-weight: 600;
  color: var(--dark);
  background: var(--gray-100);
}

.compare-table tbody td.col-highlight {
  background: var(--accent-light);
  color: var(--dark);
  font-weight: 700;
}

.compare-table tbody tr:hover td {
  background: #fafafa;
}

.compare-table tbody tr:hover td.col-highlight {
  background: #fff3e4;
}

@media (max-width: 700px) {
  .compare-inner { padding: 40px 20px; }
  .compare-heading { font-size: 24px; }
  .compare-table th,
  .compare-table td { padding: 10px 12px; font-size: 13px; }
}
```

- [ ] **Step 2: Add HTML section**

Open `docs/index.html`. Find this comment + element:

```html
<!-- ── Waitlist strip ─────────────────────────────────────────────────────── -->
<section id="section-waitlist">
```

Insert the following **before** it (between `.social-proof` div and `#section-waitlist`):

```html
<!-- ── Comparison section ────────────────────────────────────────────────── -->
<section id="section-compare">
  <div class="compare-inner">
    <h2 class="compare-heading">Why not just use Gmail?</h2>
    <p class="compare-sub">Gmail's built-in select-all caps at 50 emails per page. Here's the difference.</p>
    <table class="compare-table">
      <thead>
        <tr>
          <th>Feature</th>
          <th>Gmail (built-in)</th>
          <th class="col-highlight"><span>Inbox Cleaner</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Select all emails</td>
          <td>Max 50 per page</td>
          <td class="col-highlight">Entire inbox at once</td>
        </tr>
        <tr>
          <td>Filter by sender</td>
          <td>Manual search per sender</td>
          <td class="col-highlight">Auto-ranked list, largest first</td>
        </tr>
        <tr>
          <td>Time to delete 1,000 emails</td>
          <td>20+ clicks, multiple pages</td>
          <td class="col-highlight">1 click</td>
        </tr>
        <tr>
          <td>Requires install</td>
          <td>No</td>
          <td class="col-highlight">No — runs in browser</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

```

- [ ] **Step 3: Verify visually**

Open in browser. Expected:
- Section appears between the dark social-proof bar and the orange waitlist strip
- Table has a dark "Inbox Cleaner" header column, warm-tinted cells in that column
- On mobile (< 700px), table is still readable — columns don't overflow

- [ ] **Step 4: Commit**

```bash
git add docs/index.html docs/style.css
git commit -m "seo: add Gmail comparison table section"
```

---

### Task 3: FAQ expansion (6 → 12 questions)

**Files:**
- Modify: `docs/index.html` — add 6 new `.faq-item` divs inside `.faq-list` and 6 new Q&A objects to FAQPage JSON-LD in `<head>`

**Interfaces:**
- No new CSS needed — existing `.faq-item`, `.faq-q`, `.faq-a` classes are reused

- [ ] **Step 1: Add 6 new FAQ items to HTML**

Open `docs/index.html`. Find the closing `</div>` of `.faq-list` (after the last existing `.faq-item` ending with "use it on desktop where you can see the full sender list."). Add these 6 items before the `</div>`:

```html
      <div class="faq-item">
        <p class="faq-q">How do I delete thousands of Gmail emails at once?</p>
        <p class="faq-a">Inbox Cleaner scans your entire inbox and ranks every sender by email count. Select one or more senders and click "Move to Trash" — thousands of emails move in a single click, no paging through Gmail required.</p>
      </div>
      <div class="faq-item">
        <p class="faq-q">How do I free up Gmail storage fast?</p>
        <p class="faq-a">The fastest way is to find the senders with the most emails and delete them in bulk. Connect Gmail on this page — Inbox Cleaner ranks every sender by count so you can spot the top offenders immediately and move their emails to Trash in one click.</p>
      </div>
      <div class="faq-item">
        <p class="faq-q">Can I delete all promotional emails in Gmail?</p>
        <p class="faq-a">Yes. Inbox Cleaner scans your Promotions category and lists every sender ranked by count. Select all promotional senders you want to remove and click "Move to Trash" — all their emails move at once.</p>
      </div>
      <div class="faq-item">
        <p class="faq-q">How do I unsubscribe from emails in Gmail?</p>
        <p class="faq-a">Unsubscribing stops future emails but leaves your inbox full of old ones. Inbox Cleaner handles the cleanup: connect Gmail, find the newsletter or brand in the ranked list, and delete all their existing emails in one click. Then unsubscribe to prevent new ones.</p>
      </div>
      <div class="faq-item">
        <p class="faq-q">What's the fastest way to reach Gmail inbox zero?</p>
        <p class="faq-a">Connect Gmail on this page, sort by sender count, and delete the top offenders first. Most inboxes reach zero in under five minutes — Inbox Cleaner moves emails to Trash in bulk, so you're not clicking through 50-email pages in Gmail.</p>
      </div>
      <div class="faq-item">
        <p class="faq-q">Does Inbox Cleaner work with Google Workspace?</p>
        <p class="faq-a">Yes. Inbox Cleaner works with any Gmail account, including Google Workspace (formerly G Suite) accounts. Sign in with your Workspace account the same way you would a personal Gmail.</p>
      </div>
```

- [ ] **Step 2: Add 6 new entries to FAQPage JSON-LD**

In `docs/index.html`, find the existing FAQPage `<script type="application/ld+json">` block in `<head>`. It ends with:

```json
      {
        "@type": "Question",
        "name": "Does this work on mobile?",
        "acceptedAnswer": { "@type": "Answer", "text": "The web app works on mobile browsers. For the best experience, use it on desktop where you can see the full sender list." }
      }
    ]
  }
```

Replace that closing section with:

```json
      {
        "@type": "Question",
        "name": "Does this work on mobile?",
        "acceptedAnswer": { "@type": "Answer", "text": "The web app works on mobile browsers. For the best experience, use it on desktop where you can see the full sender list." }
      },
      {
        "@type": "Question",
        "name": "How do I delete thousands of Gmail emails at once?",
        "acceptedAnswer": { "@type": "Answer", "text": "Inbox Cleaner scans your entire inbox and ranks every sender by email count. Select one or more senders and click 'Move to Trash' — thousands of emails move in a single click, no paging through Gmail required." }
      },
      {
        "@type": "Question",
        "name": "How do I free up Gmail storage fast?",
        "acceptedAnswer": { "@type": "Answer", "text": "The fastest way is to find the senders with the most emails and delete them in bulk. Connect Gmail on this page — Inbox Cleaner ranks every sender by count so you can spot the top offenders immediately and move their emails to Trash in one click." }
      },
      {
        "@type": "Question",
        "name": "Can I delete all promotional emails in Gmail?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Inbox Cleaner scans your Promotions category and lists every sender ranked by count. Select all promotional senders you want to remove and click 'Move to Trash' — all their emails move at once." }
      },
      {
        "@type": "Question",
        "name": "How do I unsubscribe from emails in Gmail?",
        "acceptedAnswer": { "@type": "Answer", "text": "Unsubscribing stops future emails but leaves your inbox full of old ones. Inbox Cleaner handles the cleanup: connect Gmail, find the newsletter or brand in the ranked list, and delete all their existing emails in one click. Then unsubscribe to prevent new ones." }
      },
      {
        "@type": "Question",
        "name": "What's the fastest way to reach Gmail inbox zero?",
        "acceptedAnswer": { "@type": "Answer", "text": "Connect Gmail on this page, sort by sender count, and delete the top offenders first. Most inboxes reach zero in under five minutes — Inbox Cleaner moves emails to Trash in bulk, so you're not clicking through 50-email pages in Gmail." }
      },
      {
        "@type": "Question",
        "name": "Does Inbox Cleaner work with Google Workspace?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Inbox Cleaner works with any Gmail account, including Google Workspace (formerly G Suite) accounts. Sign in with your Workspace account the same way you would a personal Gmail." }
      }
    ]
  }
```

- [ ] **Step 3: Validate JSON-LD**

Open the page in Chrome → right-click → View Page Source → copy the FAQPage JSON-LD block → paste into https://validator.schema.org. Expected: 0 errors, 12 Question entities listed.

- [ ] **Step 4: Verify visually**

Open in browser. Expected:
- FAQ section now shows 12 questions, all always-expanded
- Last 6 questions are styled identically to the first 6
- No extra border-bottom on the last item (`.faq-item:last-child { border-bottom: none; }` already handles this)

- [ ] **Step 5: Commit**

```bash
git add docs/index.html
git commit -m "seo: expand FAQ from 6 to 12 questions with JSON-LD"
```

---

### Task 4: Sitemap + OG image meta tag

**Files:**
- Create: `docs/sitemap.xml`
- Modify: `docs/index.html` — add `og:image` meta tag in `<head>`

**Interfaces:**
- No cross-task dependencies

- [ ] **Step 1: Create sitemap.xml**

Create `docs/sitemap.xml` with this exact content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://inbox-cleaner.vercel.app/</loc>
    <lastmod>2026-06-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 2: Add og:image meta tag**

Open `docs/index.html`. Find this existing OG tag:

```html
  <meta property="og:url" content="https://inbox-cleaner.vercel.app">
```

Add the og:image tag directly after it:

```html
  <meta property="og:image" content="https://inbox-cleaner.vercel.app/og-image.png">
```

Note: `og-image.png` does not exist yet — this is intentional. The meta tag must be in place before the image is created. The image is a manual step (take a 1200×630px screenshot of the tool with a populated sender list, save as `docs/og-image.png`).

- [ ] **Step 3: Verify sitemap is reachable**

Deploy first (Step 5), then visit `https://inbox-cleaner.vercel.app/sitemap.xml` in a browser.
Expected: Raw XML content displayed, `<loc>` shows the correct URL.

- [ ] **Step 4: Commit**

```bash
git add docs/sitemap.xml docs/index.html
git commit -m "seo: add sitemap.xml and og:image meta tag"
```

- [ ] **Step 5: Deploy to production**

```bash
cd /Users/pushpendrasingh/projects/inbox-cleaner
npx vercel --prod
```

Expected output: `✅  Production: https://inbox-cleaner.vercel.app`

- [ ] **Step 6: Submit sitemap in Search Console**

Open [Google Search Console](https://search.google.com/search-console) → select `inbox-cleaner.vercel.app` property → Sitemaps → enter `sitemap.xml` → Submit.
Expected: Status shows "Success" within a few minutes.

---

## Manual Steps (not in code)

These require human action after the code is deployed:

1. **OG image:** Take a 1200×630px screenshot of the tool at `inbox-cleaner.vercel.app` with a sender list visible. Crop and save as `docs/og-image.png`. Then: `git add docs/og-image.png && git commit -m "seo: add og image" && npx vercel --prod`.

2. **Directory submissions:** Submit to all 8 directories from the spec (ProductHunt, AlternativeTo, Toolify, TAAFT, Futurepedia, SaaSHub, Launching Next, Uneed). Use title "Bulk Delete Gmail Emails by Sender — Free" and the meta description as the body copy.

3. **Community posts:** Post "Show HN" on news.ycombinator.com and launch posts on r/productivity and r/GMail using the framing in the spec.

4. **Weekly (1 hr/week):** Search Reddit for Gmail bulk-delete threads and post helpful answers mentioning the tool.
