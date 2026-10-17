# Inbox Cleaner — SEO Strategy

**Date:** 2026-06-28
**Status:** Approved
**Approach:** Single-page SEO dominance (Option A)
**Scope:** `docs/index.html`, `docs/style.css`, `docs/sitemap.xml` (new), `docs/og-image.png` (manual), off-page directory submissions and community seeding

---

## Goal

1. Rank for **"bulk delete Gmail emails"** and long-tail variants within 90 days.
2. Drive waitlist signups via organic traffic — Search Console impressions → clicks → waitlist form.

No blog, no new routes. All on-page work lands in existing `docs/` files.

---

## Section 1: On-Page Changes

### 1a. Expand FAQ (6 → 12 questions)

Add 6 new Q&A pairs to the existing `#section-faq` in `docs/index.html`. Each answer opens with a direct sentence (for featured snippet eligibility). Mirror every new Q&A in the existing FAQPage JSON-LD schema in `<head>`.

New questions to add:

| Question | Keyword targeted |
|---|---|
| How do I delete thousands of Gmail emails at once? | "delete thousands of gmail emails" |
| How do I free up Gmail storage fast? | "gmail storage full how to delete" |
| Can I delete all promotional emails in Gmail? | "delete all promotional emails gmail" |
| How do I unsubscribe from emails in Gmail? | "unsubscribe emails gmail bulk" |
| What's the fastest way to reach Gmail inbox zero? | "gmail inbox zero" |
| Does Inbox Cleaner work with Google Workspace? | "google workspace bulk delete emails" |

**Answers (to use verbatim):**

1. **How do I delete thousands of Gmail emails at once?**
   Inbox Cleaner scans your entire inbox and ranks every sender by email count. Select one or more senders and click "Move to Trash" — thousands of emails move in a single click, no paging through Gmail required.

2. **How do I free up Gmail storage fast?**
   The fastest way is to find the senders with the most emails and delete them in bulk. Connect Gmail on this page — Inbox Cleaner ranks every sender by count so you can spot the top offenders immediately and move their emails to Trash in one click.

3. **Can I delete all promotional emails in Gmail?**
   Yes. Inbox Cleaner scans your Promotions category and lists every sender ranked by count. Select all promotional senders you want to remove and click "Move to Trash" — all their emails move at once.

4. **How do I unsubscribe from emails in Gmail?**
   Unsubscribing stops future emails but leaves your inbox full of old ones. Inbox Cleaner handles the cleanup: connect Gmail, find the newsletter or brand in the ranked list, and delete all their existing emails in one click. Then unsubscribe to prevent new ones.

5. **What's the fastest way to reach Gmail inbox zero?**
   Connect Gmail on this page, sort by sender count, and delete the top offenders first. Most inboxes reach zero in under five minutes — Inbox Cleaner moves emails to Trash in bulk, so you're not clicking through 50-email pages in Gmail.

6. **Does Inbox Cleaner work with Google Workspace?**
   Yes. Inbox Cleaner works with any Gmail account, including Google Workspace (formerly G Suite) accounts. Sign in with your Workspace account the same way you would a personal Gmail.

### 1b. Comparison section

Add a new `#section-compare` between `#social-proof` and `#section-waitlist` in `docs/index.html`.

**Section heading:** "Why not just use Gmail?"

**Comparison table:**

| Feature | Gmail (built-in) | Inbox Cleaner |
|---|---|---|
| Select all emails | Max 50 per page | Entire inbox at once |
| Filter by sender | Manual search per sender | Auto-ranked list, largest first |
| Time to delete 1,000 emails | 20+ clicks, multiple pages | 1 click |
| Requires install | No | No — runs in browser |

**Styling:** matches the existing neo-brutalist system. Max-width 1100px, centered. Table with `border: 2px solid #1a1a1a`, alternating row background. The "Inbox Cleaner" column header gets `background: #f97316; color: #fff` to highlight it.

### 1c. Hero featured snippet paragraph

Add a direct-answer paragraph immediately below the `<h1>` and above the hero CTA buttons:

> "Inbox Cleaner scans your Gmail inbox, ranks every sender by email count, and lets you select multiple senders and move all their emails to Trash in one click — no Gmail app install needed."

This is the sentence Google pulls for a featured snippet on "how to bulk delete Gmail emails". Style it as `hero-snippet` — same font as `hero-sub` but slightly smaller, `color: #555`, no bold.

---

## Section 2: Off-Page

### 2a. Directory submissions (one-time, ~2 hrs)

Submit in this priority order. Use identical copy for all:

- **Title:** Bulk Delete Gmail Emails by Sender — Free
- **Description:** The fastest way to bulk delete Gmail emails. See every sender ranked by count, select the worst offenders, move everything to Trash in one click. Free, no install.
- **URL:** https://inbox-cleaner.vercel.app
- **Category:** Productivity / Email

| Directory | URL | Notes |
|---|---|---|
| ProductHunt | producthunt.com | Full launch post — see Section 2b |
| AlternativeTo | alternativeto.net | List under "Gmail" alternatives |
| Toolify.ai | toolify.ai | Submit as productivity tool |
| There's An AI For That | theresanaiforthat.com | Submit as email tool |
| Futurepedia | futurepedia.io | Productivity category |
| SaaSHub | saashub.com | Strong backlink, takes 1-2 days to approve |
| Launching Next | launchingnext.com | Fast approval |
| Uneed.app | uneed.app | Growing directory, newsletter exposure |

### 2b. Community seeding (ongoing, ~1 hr/week)

**One-time launch posts:**

- **Show HN** (news.ycombinator.com/submit): Title: "Show HN: Free tool to bulk delete Gmail emails by sender — runs in the browser, no install"
- **r/productivity** and **r/GMail**: same framing — lead with the problem ("Gmail has no way to delete all emails from one sender at once"), then introduce the tool.

**Weekly ongoing (1 hr/week):**
Search Reddit for threads matching these queries and post helpful answers that mention the tool naturally:
- `site:reddit.com "delete all emails from one sender gmail"`
- `site:reddit.com "gmail inbox full how to delete"`
- `site:reddit.com "gmail bulk delete"`

Write a genuine helpful answer first (explain what to do manually), then mention Inbox Cleaner as the faster alternative. Target subreddits: r/GMail, r/productivity, r/lifehacks, r/Entrepreneur, r/webdev.

---

## Section 3: Technical SEO

### 3a. Sitemap

Create `docs/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9/sitemap">
  <url>
    <loc>https://inbox-cleaner.vercel.app/</loc>
    <lastmod>2026-06-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Submit URL in Google Search Console: `https://inbox-cleaner.vercel.app/sitemap.xml`.

### 3b. OG image (manual step)

Take a 1200×630px screenshot of the tool with a populated sender list. Save as `docs/og-image.png`. Add to `<head>`:

```html
<meta property="og:image" content="https://inbox-cleaner.vercel.app/og-image.png">
```

Required for ProductHunt and SaaSHub listings to display correctly.

### 3c. Measurement

Check weekly in Google Search Console → Performance:

| Metric | Target at 90 days |
|---|---|
| Impressions for "bulk delete Gmail emails" | 1,000+/month |
| Average position for primary keyword | Position 1–10 |
| Clicks | 100+/month |
| Waitlist signups (Google Sheet) | Correlate with traffic spikes |

---

## 90-Day Timeline

| Weeks | Tasks |
|---|---|
| **1–2** | Ship on-page changes: FAQ expansion, comparison table, hero snippet paragraph, sitemap.xml, og:image meta tag |
| **2–3** | Directory submissions (all 8) |
| **3–4** | ProductHunt launch + Show HN + first Reddit post |
| **4–12** | 1 hr/week: Reddit thread search → helpful answer posts |

---

## Files Changed

```
docs/
  index.html   — hero snippet para, comparison section, 6 new FAQs, 6 new JSON-LD FAQ entries, og:image meta
  style.css    — comparison table styles, hero-snippet class
  sitemap.xml  — new file
```

**Manual (not in code):**
- `docs/og-image.png` — take screenshot, crop to 1200×630px
- Google Search Console — submit sitemap URL
- Directory submissions — 8 sites (see Section 2a)
- Community posts — ProductHunt, Show HN, Reddit (see Section 2b)

---

## Out of Scope

- Blog or new pages
- Paid advertising
- Email drip campaigns from waitlist
- Chrome extension changes
- Analytics beyond Search Console
