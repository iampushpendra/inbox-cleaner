# Inbox Cleaner — Web App UI Redesign

**Date:** 2026-06-24  
**Status:** Approved  
**Scope:** Full redesign of `docs/` (GitHub Pages web app). Chrome extension untouched.

---

## Goal

Release Inbox Cleaner as a polished, visually distinctive web app. The current `docs/` UI is functional but plain. This redesign makes it shareable, memorable, and "best-in-class" feeling — without adding any new backend or dependencies.

---

## Design Direction

**Style:** Neo-brutalist — strong 2px black borders, offset box-shadows, bold typography, high contrast.

**Color palette:**
- Accent: `#f97316` (burnt orange)
- Base dark: `#1a1a1a`
- Base light: `#ffffff`
- Tint: `#fff9f0` (warm off-white for hover states and highlights)

**Typography:** System `Inter` → `-apple-system` fallback. Weights: 400 (body), 600 (UI), 700 (labels/buttons), 800–900 (headings).

**Shadow system:** `3px 3px 0 #1a1a1a` (default), `3px 3px 0 #f97316` (accent/selected), `4px 4px 0 #f97316` (CTAs).

**Stack:** Vanilla JS, zero dependencies, zero build step. Redesign touches only `docs/index.html`, `docs/style.css`, `docs/app.js`. The Gmail API logic in `app.js` is preserved; only the UI shell changes.

---

## Page Structure

Single page. All sections live at the root URL. The tool is visible without navigating away.

```
┌─────────────────────────────┐
│  Sticky Nav                 │  logo + CTA
├─────────────────────────────┤
│  Hero                       │  headline, subtext, CTA, trust notes
├─────────────────────────────┤
│  Social Proof Bar           │  dark bg, 3 stats + 4 trust items
├─────────────────────────────┤
│  Tool Section               │  filters, sender list, action bar
├─────────────────────────────┤
│  Footer                     │  attribution, privacy, GitHub
└─────────────────────────────┘
```

---

## Section Specs

### 1. Sticky Nav
- Background: `#1a1a1a`, height 56px, `border-bottom: 2px solid #000`
- Left: logo `📥 InboxCleaner` — "Cleaner" in orange
- Right: "Connect Gmail →" button (orange, shown when signed out) OR user email + sign-out (when signed in)
- Stays fixed on scroll; z-index above everything

### 2. Hero
- Max-width 1100px, centered, padding 80px top/bottom
- Eyebrow tag: `FREE · NO INSTALL · WORKS IN BROWSER` — orange border, orange text, warm tint background, `box-shadow: 2px 2px 0 #f97316`
- H1: `"Stop drowning in your inbox."` — 64px, weight 900, `letter-spacing: -0.03em`. "drowning" in orange italic.
- Subtext: 18px, `#555`, max-width 480px — "See who's flooding your Gmail. Select the worst offenders. Move everything to Trash — in one click."
- Primary CTA: `"Connect Gmail — it's free →"` — black bg, white text, `box-shadow: 4px 4px 0 #f97316`
- Secondary CTA: `"See your inbox ↓"` — ghost button, smooth-scrolls to the tool section anchor (`#tool`)
- Trust notes below CTA: `✓ No data leaves your browser` · `✓ Only From & Date headers read` · `✓ Open source on GitHub`
- When signed in: hero collapses / hides (user is in the tool)

### 3. Social Proof Bar
- Full-width, `background: #1a1a1a`, `border-bottom: 3px solid #000`
- 3 stats: **5 Gmail categories scanned** · **Metadata only — never body** · **0 servers**
  - Stat numbers in orange, labels in `#888`, dividers between stats
  - All three are always-true feature facts, not usage counters (app is newly launched)
- Trust items (right-aligned): `✓ No server` · `✓ Metadata only` · `✓ Open source` · `✓ Trash ≠ Delete (reversible)`

### 4. Tool Section
Max-width 1100px, centered, padding 64px top/bottom.

**States:**

**A. Signed out**
- Centered sign-in card with the "Connect Gmail" button
- Brief one-liner: "Scan takes ~30 seconds for 5,000 emails"

**B. Scanning**
- Header: sender count so far + total (e.g. "312 senders found")
- Orange progress bar with border, animated fill, `1,924 / 2,841` label
- `box-shadow: 3px 3px 0 #f97316`

**C. Results (main state)**
- **Tool header:** `"Your inbox, ranked."` with subtitle showing totals (e.g. "2,841 emails from 312 senders")
- **Utility buttons** (top right): Rescan · Sign out — ghost style
- **Category filter tabs:** All · Primary · Promotions · Social · Updates · Forums — active tab is black+white+orange shadow
- **Sender rows:**
  - Border: `2px solid #1a1a1a`, shadow: `3px 3px 0 #1a1a1a`
  - Selected state: orange border + tint background + `3px 3px 0 #f97316`
  - Checkbox (left) → Sender name → Category badge → Count pill (red ≥100, orange ≥50, gray <50) → Last received
  - Hover: subtle lift effect (`transform: translate(-1px, -1px)`, shadow grows)
- **Action bar** (`position: sticky; bottom: 0` — sticks to viewport bottom as user scrolls through long sender lists):
  - Black background, `box-shadow: 4px 4px 0 #f97316`
  - Left: "3 senders selected · 1,548 emails will move to Trash"
  - Right: "🗑 Move to Trash" — orange button
  - Hidden (`display: none`) when nothing selected; slides in when first sender is checked

**D. Trashing**
- Progress indicator replaces action bar
- Shows current sender being processed + count remaining

### 5. Footer
- `background: #fafafa`, `border-top: 3px solid #1a1a1a`
- Single line: Built by [@iampushpendra](link) · Privacy Policy · GitHub · "Emails go to Trash — you have 30 days to restore them."

---

## App Logic Changes

The existing `app.js` Gmail API code is preserved as-is. UI changes only:

| Current | New |
|---------|-----|
| Inline styles in JS | All styles moved to `style.css` via CSS classes |
| Monolithic render functions | Same logic, new HTML structure |
| No loading states | Scanning progress bar added |
| No category filter UI | Filter tab bar added (already filtered in logic, just needs UI) |
| Basic checkbox | Styled neo-brutalist checkbox |
| Simple delete button | Sticky action bar with count summary |

The signed-in/signed-out state drives whether the hero is visible. When signed in, hero section gets `display: none`.

---

## Files Changed

```
docs/
  index.html    — full rewrite (new semantic structure)
  style.css     — full rewrite (neo-brutalist design system)
  app.js        — UI render functions updated to emit new markup; API logic untouched
```

`docs/privacy.html` — optional light restyle to match, low priority.

---

## Out of Scope

- Chrome extension (`popup.html`, `popup.css`, `popup.js`) — untouched
- New Gmail API features (unsubscribe, label filter, etc.)
- Animation/transitions beyond hover micro-interactions
- Dark mode
- Virtual scrolling (noted in README as future work)
