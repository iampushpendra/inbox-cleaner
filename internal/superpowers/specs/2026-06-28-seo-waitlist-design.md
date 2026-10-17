# Inbox Cleaner — SEO + Waitlist

**Date:** 2026-06-28  
**Status:** Approved  
**Scope:** `docs/index.html`, `docs/style.css`, `docs/app.js` — no new routes, no build step.

---

## Goal

1. Rank for **"bulk delete Gmail emails"** on Google Search by optimizing the existing landing page with keyword-targeted copy, structured data, and a keyword-rich FAQ section.
2. Collect email addresses via a waitlist form — stored in a Google Sheet via Google Apps Script. No new server needed.

---

## Architecture

Single-page Vercel deployment. All additions land in the existing `docs/` files. No new pages or routes.

```
┌─────────────────────────────┐
│  Sticky Nav                 │  unchanged
├─────────────────────────────┤
│  Hero                       │  H1 + meta copy updated for keyword
├─────────────────────────────┤
│  Social Proof Bar           │  unchanged
├─────────────────────────────┤
│  Waitlist Strip  ← NEW      │  email input → Apps Script POST → Google Sheet
├─────────────────────────────┤
│  FAQ Section     ← NEW      │  6 Q&As, keyword-rich, JSON-LD schema
├─────────────────────────────┤
│  Tool Section               │  unchanged
├─────────────────────────────┤
│  Footer                     │  unchanged
└─────────────────────────────┘
```

---

## Section 1: SEO Changes

### Meta Tags (`docs/index.html` `<head>`)

| Tag | Value |
|-----|-------|
| `<title>` | `Bulk Delete Gmail Emails by Sender — Inbox Cleaner (Free)` |
| `meta description` | `The fastest way to bulk delete Gmail emails. See every sender ranked by count, select the worst offenders, move everything to Trash in one click. Free, no install.` |
| `og:title` | Same as title |
| `og:description` | Same as description |
| `og:url` | `https://inboxcleaner.app` (or current Vercel URL) |
| `og:image` | `https://inboxcleaner.app/og-image.png` (to be created: 1200×630px screenshot) |
| `og:type` | `website` |

### Hero Copy

- **H1:** `"The fastest way to bulk delete Gmail emails."` — replaces current "Stop drowning in your inbox."
- **Subtext:** unchanged — already describes the action clearly

### Structured Data (JSON-LD in `<head>`)

**HowTo schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to bulk delete Gmail emails by sender",
  "step": [
    { "@type": "HowToStep", "text": "Click 'Connect Gmail' to scan your inbox — no install needed." },
    { "@type": "HowToStep", "text": "See every sender ranked by email count. Select the worst offenders." },
    { "@type": "HowToStep", "text": "Click 'Move to Trash' — all selected emails move in one click." }
  ]
}
```

**FAQ schema:** mirrors the FAQ section below (6 Q&A pairs).

---

## Section 2: Waitlist Strip

### Placement

Between the social proof bar and the FAQ section. Full-width strip.

### Visual Design

Matches the neo-brutalist system:
- Background: `#fff9f0` (warm tint), `border-top` and `border-bottom: 2px solid #1a1a1a`
- Headline: `"Pro features coming soon — get early access"`
- Single row: email `<input>` + `"Join Waitlist →"` button
- Button: black bg, white text, `box-shadow: 4px 4px 0 #f97316`
- Input: `border: 2px solid #1a1a1a`, `box-shadow: 3px 3px 0 #1a1a1a`
- Privacy note below: `"Waitlist only — your email won't be used for anything else."`

### States

| State | UI |
|-------|----|
| Default | Email input + button visible |
| Loading | Button shows `"Joining…"`, disabled |
| Success | Form replaced with `"✓ You're on the list!"` in green/orange |
| Error | Inline error below input: `"Something went wrong — try again."` |

### Data Flow

```
User submits email →
  fetch POST to WAITLIST_SCRIPT_URL with { email } →
    Apps Script appends row [timestamp, email] to Google Sheet →
      Returns { success: true } →
        UI shows success state
```

`WAITLIST_SCRIPT_URL` is a `const` at the top of `docs/app.js`.

### Google Apps Script (one-time manual setup by user)

1. Create a Google Sheet named **"Inbox Cleaner Waitlist"** with columns: `Timestamp`, `Email`
2. Open **Extensions → Apps Script**, paste this script:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const email = e.parameter.email || '';
  if (!email) return output({ success: false, error: 'No email' });
  sheet.appendRow([new Date().toISOString(), email]);
  return output({ success: true });
}

function output(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy → New deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the deployment URL → paste as `WAITLIST_SCRIPT_URL` in `docs/app.js`

---

## Section 3: FAQ Section

### Placement

Between the waitlist strip and the tool section.

### Visual Design

- Max-width 1100px, centered, `padding: 64px 24px`
- Section heading: `"Common questions"` — weight 800
- Each Q&A: accordion or always-expanded (always-expanded preferred — simpler, better for SEO crawlability)
- Q: weight 700, `font-size: 18px`
- A: weight 400, `color: #555`, `font-size: 16px`
- Divider between Q&As: `border-bottom: 1px solid #e5e5e5`

### Questions & Answers

1. **How do I bulk delete Gmail emails from one sender?**  
   Connect Gmail on this page, find the sender in the ranked list, check the box, and click "Move to Trash." All their emails move in one click.

2. **Does Gmail have a built-in bulk delete option?**  
   Gmail lets you select up to 50 emails per page and delete them manually. Inbox Cleaner scans your entire inbox and moves thousands of emails in seconds — no paging required.

3. **Is Inbox Cleaner safe to use?**  
   Yes. The tool reads only From and Date headers — never email bodies. All processing happens in your browser; nothing is sent to any server. The source code is open on GitHub.

4. **Will deleted emails be gone forever?**  
   No. Emails move to Trash, where Gmail keeps them for 30 days. You can restore any email from Trash before that window closes.

5. **How long does it take to scan my inbox?**  
   About 30 seconds for 5,000 emails. Larger inboxes take proportionally longer; a progress bar shows the current status.

6. **Does this work on mobile?**  
   The web app works on mobile browsers. For the best experience, use it on desktop where you can see the full sender list.

---

## Files Changed

```
docs/
  index.html  — title, meta, og tags, JSON-LD scripts, H1 copy, waitlist strip HTML, FAQ section HTML
  style.css   — waitlist strip styles, FAQ section styles
  app.js      — WAITLIST_SCRIPT_URL const, waitlist form submit handler
```

---

## Out of Scope

- Chrome extension — untouched
- OG image creation (noted as manual step)
- Google Search Console setup / sitemap submission (manual, post-deploy)
- Email automation or drip campaigns from the waitlist
- Analytics / conversion tracking
