# Inbox Cleaner Web App UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain existing `docs/` web app with a polished neo-brutalist UI — hero + social proof + tool on one page — while keeping all Gmail API logic untouched.

**Architecture:** Single-page layout with sections always in the DOM; JS toggles visibility classes instead of full-screen swaps. The three-screen model (signin/app/deleting) maps to: hero shown/hidden, tool sub-states (signin-card vs results), and a fixed delete overlay. All Gmail API code in `app.js` is preserved as-is; only the UI shell, `show()`, `renderList()`, and filter logic change.

**Tech Stack:** Vanilla JS (ES2020), zero dependencies, zero build step, GitHub Pages (`docs/` folder).

## Global Constraints

- No new npm packages or build steps — must deploy by pushing `docs/` to GitHub
- Preserve ALL existing element IDs referenced in `app.js`: `btn-signout`, `btn-refresh`, `scan-progress`, `progress-fill`, `progress-text`, `search`, `sender-list`, `action-bar`, `action-summary`, `btn-delete`, `btn-clear`, `modal`, `modal-text`, `btn-cancel`, `btn-confirm`, `delete-text`, `delete-fill`, `header-stats`
- Remove `screen-signin`, `screen-app`, `screen-deleting` IDs (replaced by new structure)
- Design tokens: accent `#f97316`, dark `#1a1a1a`, white `#ffffff`, tint `#fff9f0`
- Shadow system: `3px 3px 0 #1a1a1a` (default), `3px 3px 0 #f97316` (selected/accent), `4px 4px 0 #f97316` (CTAs)
- Font: `Inter, -apple-system, sans-serif`
- Chrome extension files (`popup.*`, `background.js`, `manifest.json`) — do NOT touch

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `docs/index.html` | Full rewrite | Page structure, all element IDs, semantic sections |
| `docs/style.css` | Full rewrite | Neo-brutalist design system, all visual styles |
| `docs/app.js` | Targeted edits | `show()`, `renderList()`, `applyFilter()`, category filter state, event wiring |

---

### Task 1: Rewrite `docs/index.html`

**Files:**
- Modify: `docs/index.html`

**Interfaces:**
- Produces: all element IDs that `app.js` references (see Global Constraints)
- Produces: new IDs `section-hero`, `tool-signin-state`, `tool-results-state`, `nav-cta`, `nav-user` (consumed by updated `show()` in Task 3)
- Produces: class `.btn-signin` on all sign-in buttons (consumed by updated event wiring in Task 3)
- Produces: class `.filter-tab` with `data-category` attributes (consumed by filter event wiring in Task 3)

- [ ] **Step 1: Write new `docs/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbox Cleaner — Clean your Gmail in 60 seconds</title>
  <meta name="description" content="See who's flooding your Gmail. Select senders. Move everything to Trash in one click. Free, no install, nothing leaves your browser.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>📥</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ── Nav ──────────────────────────────────────────────────────────────── -->
<nav id="nav">
  <a class="nav-logo" href="/">📥 Inbox<span>Cleaner</span></a>
  <div id="nav-cta">
    <button class="btn-signin nav-signin-btn">Connect Gmail →</button>
  </div>
  <div id="nav-user" class="hidden">
    <button id="btn-refresh" class="btn-ghost-sm">↺ Rescan</button>
    <button id="btn-signout" class="btn-ghost-sm">Sign out</button>
  </div>
</nav>

<!-- ── Hero (hidden when signed in) ─────────────────────────────────────── -->
<section id="section-hero">
  <div class="hero-inner">
    <div class="hero-eyebrow">Free · No install · Works in browser</div>
    <h1>Stop <em>drowning</em><br>in your inbox.</h1>
    <p class="hero-sub">See who's flooding your Gmail. Select the worst offenders. Move everything to Trash — in one click.</p>
    <div class="hero-actions">
      <button class="btn-signin btn-primary-hero">Connect Gmail — it's free →</button>
      <a href="#section-tool" class="btn-ghost-hero">See your inbox ↓</a>
    </div>
    <div class="hero-trust">
      <span>No data leaves your browser</span>
      <span>Only From &amp; Date headers read</span>
      <span>Open source on GitHub</span>
    </div>
  </div>
</section>

<!-- ── Social proof bar ──────────────────────────────────────────────────── -->
<div class="social-proof">
  <div class="social-proof-inner">
    <div class="stat"><div class="stat-num">5</div><div class="stat-label">Gmail categories scanned</div></div>
    <div class="stat-divider"></div>
    <div class="stat"><div class="stat-num">0</div><div class="stat-label">Servers. Zero.</div></div>
    <div class="stat-divider"></div>
    <div class="stat"><div class="stat-num">100%</div><div class="stat-label">Metadata only — never body</div></div>
    <div class="trust-list">
      <span class="trust-item">No server</span>
      <span class="trust-item">Open source</span>
      <span class="trust-item">Trash ≠ Delete (30 days to restore)</span>
    </div>
  </div>
</div>

<!-- ── Tool section ──────────────────────────────────────────────────────── -->
<section id="section-tool">

  <!-- Signed out state -->
  <div id="tool-signin-state" class="tool-inner">
    <div class="tool-signin-card">
      <div class="tool-signin-icon">📥</div>
      <h2>See your inbox, ranked</h2>
      <p>Connect Gmail to scan all 5 categories and see who's taking up the most space.</p>
      <button class="btn-signin btn-primary-tool">Connect Gmail — it's free →</button>
      <p class="tool-signin-note">Scan takes ~30 seconds for 5,000 emails</p>
    </div>
  </div>

  <!-- Results state (signed in) -->
  <div id="tool-results-state" class="tool-inner hidden">

    <!-- Tool header -->
    <div class="tool-header">
      <div>
        <h2 class="tool-title">Your inbox, <span>ranked.</span></h2>
        <p id="header-stats" class="tool-subtitle">—</p>
      </div>
    </div>

    <!-- Scan progress -->
    <div id="scan-progress" class="scan-progress hidden">
      <span class="scan-label">Scanning…</span>
      <div class="progress-track">
        <div id="progress-fill" class="progress-fill"></div>
      </div>
      <span id="progress-text" class="progress-text">Starting…</span>
    </div>

    <!-- Category filter tabs -->
    <div class="filter-tabs">
      <button class="filter-tab active" data-category="">All</button>
      <button class="filter-tab" data-category="PRIMARY">Primary</button>
      <button class="filter-tab" data-category="PROMOTIONS">Promotions</button>
      <button class="filter-tab" data-category="SOCIAL">Social</button>
      <button class="filter-tab" data-category="UPDATES">Updates</button>
      <button class="filter-tab" data-category="FORUMS">Forums</button>
    </div>

    <!-- Search -->
    <div class="controls">
      <input id="search" type="search" placeholder="Search sender name or email…" autocomplete="off">
    </div>

    <!-- Sender list -->
    <div id="sender-list" class="sender-list"></div>

  </div>
</section>

<!-- ── Delete overlay (fixed, shown during trash operation) ─────────────── -->
<div id="screen-deleting" class="delete-overlay hidden">
  <div class="delete-box">
    <div class="spinner"></div>
    <p id="delete-text" class="delete-text">Preparing…</p>
    <div class="progress-track delete-progress-track">
      <div id="delete-fill" class="progress-fill"></div>
    </div>
  </div>
</div>

<!-- ── Confirmation modal ─────────────────────────────────────────────────── -->
<div id="modal" class="modal hidden">
  <div class="modal-box">
    <h2>Move to Trash?</h2>
    <p id="modal-text"></p>
    <div class="modal-btns">
      <button id="btn-cancel" class="btn-modal-cancel">Cancel</button>
      <button id="btn-confirm" class="btn-modal-confirm">Move to Trash →</button>
    </div>
  </div>
</div>

<!-- ── Action bar (sticky bottom, shown when senders selected) ────────────── -->
<div id="action-bar" class="action-bar hidden">
  <span id="action-summary" class="action-summary"></span>
  <div class="action-btns">
    <button id="btn-clear" class="btn-action-clear">Clear</button>
    <button id="btn-delete" class="btn-action-trash">🗑 Move to Trash</button>
  </div>
</div>

<!-- ── Footer ─────────────────────────────────────────────────────────────── -->
<footer>
  <p>Built by <a href="https://github.com/iampushpendra" target="_blank" rel="noopener">@iampushpendra</a> · <a href="privacy.html">Privacy Policy</a> · <a href="https://github.com/iampushpendra/inbox-cleaner" target="_blank" rel="noopener">GitHub</a> · Emails go to Trash — you have 30 days to restore them.</p>
</footer>

<script src="https://accounts.google.com/gsi/client"></script>
<script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open `docs/index.html` directly in browser (no server needed for structure check)**

Open via `open docs/index.html` or drag into browser. Expected: page renders without errors; hero section visible; social proof bar below; tool section shows sign-in card; nav shows "Connect Gmail →". No JS errors in console (JS will error on missing element IDs until Task 3 — that's expected).

- [ ] **Step 3: Commit**

```bash
git add docs/index.html
git commit -m "feat: rewrite index.html with neo-brutalist page structure"
```

---

### Task 2: Rewrite `docs/style.css`

**Files:**
- Modify: `docs/style.css`

**Interfaces:**
- Consumes: all class names and IDs defined in Task 1's HTML
- Produces: complete visual design; all states styled (default, hover, selected, active, hidden)

- [ ] **Step 1: Write new `docs/style.css`**

```css
/* ── Reset + base ──────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --accent:       #f97316;
  --accent-light: #fff9f0;
  --dark:         #1a1a1a;
  --white:        #ffffff;
  --gray-100:     #fafafa;
  --gray-200:     #f5f5f5;
  --gray-400:     #aaaaaa;
  --gray-600:     #555555;
  --shadow:       3px 3px 0 var(--dark);
  --shadow-accent: 3px 3px 0 var(--accent);
  --shadow-cta:   4px 4px 0 var(--accent);
  --border:       2px solid var(--dark);
}

html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--white);
  color: var(--dark);
  font-size: 14px;
  line-height: 1.5;
}

.hidden { display: none !important; }

/* ── Nav ─────────────────────────────────────────────────────────────────── */
#nav {
  background: var(--dark);
  height: 56px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-logo {
  color: var(--white);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;
}
.nav-logo span { color: var(--accent); }

.nav-signin-btn {
  background: var(--accent);
  color: var(--white);
  border: 2px solid var(--accent);
  border-radius: 5px;
  font-size: 13px;
  font-weight: 700;
  padding: 7px 16px;
  cursor: pointer;
  box-shadow: 2px 2px 0 rgba(255,255,255,0.2);
  transition: transform 0.05s, box-shadow 0.05s;
}
.nav-signin-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 rgba(255,255,255,0.25); }

#nav-user { display: flex; gap: 8px; align-items: center; }

.btn-ghost-sm {
  background: transparent;
  color: var(--gray-400);
  border: 1.5px solid #444;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.btn-ghost-sm:hover { color: var(--white); border-color: #888; }

/* ── Hero ────────────────────────────────────────────────────────────────── */
#section-hero {
  border-bottom: 3px solid var(--dark);
  background: var(--white);
}

.hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 40px 72px;
}

.hero-eyebrow {
  display: inline-block;
  background: var(--accent-light);
  border: 2px solid var(--accent);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  margin-bottom: 24px;
  box-shadow: 2px 2px 0 var(--accent);
}

#section-hero h1 {
  font-size: clamp(40px, 6vw, 68px);
  font-weight: 900;
  line-height: 1.0;
  letter-spacing: -0.03em;
  color: var(--dark);
  margin-bottom: 20px;
  max-width: 700px;
}
#section-hero h1 em {
  font-style: normal;
  color: var(--accent);
  position: relative;
}

.hero-sub {
  font-size: 18px;
  color: var(--gray-600);
  margin-bottom: 36px;
  max-width: 480px;
  line-height: 1.6;
  font-weight: 400;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.btn-primary-hero {
  background: var(--dark);
  color: var(--white);
  border: var(--border);
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 28px;
  cursor: pointer;
  box-shadow: var(--shadow-cta);
  transition: transform 0.05s, box-shadow 0.05s;
  letter-spacing: 0.01em;
}
.btn-primary-hero:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--accent); }
.btn-primary-hero:active { transform: translate(0, 0); box-shadow: var(--shadow-cta); }

.btn-ghost-hero {
  color: var(--dark);
  font-size: 14px;
  font-weight: 600;
  padding: 14px 20px;
  border: var(--border);
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
  display: inline-block;
}
.btn-ghost-hero:hover { background: var(--gray-200); }

.hero-trust {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.hero-trust span {
  font-size: 12px;
  color: var(--gray-400);
  font-weight: 500;
}
.hero-trust span::before { content: "✓ "; color: var(--accent); font-weight: 700; }

/* ── Social proof bar ────────────────────────────────────────────────────── */
.social-proof {
  background: var(--dark);
  border-bottom: 3px solid #000;
}

.social-proof-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 40px;
  display: flex;
  gap: 40px;
  align-items: center;
  flex-wrap: wrap;
}

.stat { text-align: center; }
.stat-num {
  font-size: 30px;
  font-weight: 900;
  color: var(--accent);
  letter-spacing: -0.02em;
  line-height: 1;
}
.stat-label {
  font-size: 11px;
  color: #888;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 4px;
}
.stat-divider { width: 2px; height: 40px; background: #333; flex-shrink: 0; }

.trust-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-left: auto;
}
.trust-item {
  font-size: 12px;
  color: #aaa;
  font-weight: 500;
}
.trust-item::before { content: "✓ "; color: var(--accent); font-weight: 700; }

/* ── Tool section ────────────────────────────────────────────────────────── */
#section-tool {
  min-height: 60vh;
}

.tool-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 64px 40px;
}

/* Signed out card */
.tool-signin-card {
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
  border: var(--border);
  border-radius: 8px;
  padding: 48px 40px;
  box-shadow: var(--shadow);
}

.tool-signin-icon { font-size: 48px; margin-bottom: 16px; }

.tool-signin-card h2 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}

.tool-signin-card p {
  color: var(--gray-600);
  margin-bottom: 24px;
  line-height: 1.6;
}

.btn-primary-tool {
  background: var(--dark);
  color: var(--white);
  border: var(--border);
  border-radius: 6px;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 28px;
  cursor: pointer;
  box-shadow: var(--shadow-cta);
  transition: transform 0.05s, box-shadow 0.05s;
  display: inline-block;
  margin-bottom: 14px;
}
.btn-primary-tool:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--accent); }

.tool-signin-note {
  font-size: 12px;
  color: var(--gray-400);
  margin-bottom: 0;
}

/* Tool header */
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.tool-title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.tool-title span { color: var(--accent); }
.tool-subtitle { font-size: 14px; color: var(--gray-400); margin-top: 4px; }

/* Scan progress */
.scan-progress {
  background: var(--accent-light);
  border: var(--border);
  border-color: var(--accent);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-accent);
}
.scan-progress.hidden { display: none; }
.scan-label { font-size: 13px; font-weight: 700; color: var(--accent); white-space: nowrap; }

.progress-track {
  flex: 1;
  height: 10px;
  background: #ffe8d0;
  border-radius: 4px;
  border: 1.5px solid var(--accent);
  overflow: hidden;
}
.delete-progress-track { width: 280px; flex: none; }
.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.3s ease;
  width: 0%;
}
.progress-text { font-size: 12px; color: var(--accent); font-weight: 700; white-space: nowrap; }

/* Category filter tabs */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-tab {
  background: var(--white);
  border: var(--border);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--dark);
  transition: transform 0.05s, box-shadow 0.05s;
  letter-spacing: 0.02em;
}
.filter-tab:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--dark); }
.filter-tab.active {
  background: var(--dark);
  color: var(--white);
  box-shadow: 2px 2px 0 var(--accent);
}
.filter-tab.active:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--accent); }

/* Search control */
.controls {
  margin-bottom: 16px;
}
#search {
  width: 100%;
  max-width: 400px;
  padding: 10px 16px;
  border: var(--border);
  border-radius: 5px;
  background: var(--white);
  color: var(--dark);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  box-shadow: 2px 2px 0 var(--dark);
  transition: box-shadow 0.1s;
}
#search:focus { box-shadow: 3px 3px 0 var(--accent); border-color: var(--accent); }

/* ── Sender list ──────────────────────────────────────────────────────────── */
.sender-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 100px; /* room for action bar */
}

.list-empty {
  text-align: center;
  color: var(--gray-400);
  padding: 64px 16px;
  font-size: 15px;
  font-weight: 500;
}

/* ── Row ─────────────────────────────────────────────────────────────────── */
.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: var(--border);
  border-radius: 6px;
  cursor: pointer;
  background: var(--white);
  box-shadow: var(--shadow);
  transition: transform 0.05s, box-shadow 0.05s;
}
.row:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--dark); }
.row.selected {
  border-color: var(--accent);
  box-shadow: var(--shadow-accent);
  background: var(--accent-light);
}
.row.selected:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--accent); }

/* Custom checkbox */
.row-check { position: relative; flex-shrink: 0; }
.row-check input { position: absolute; opacity: 0; width: 0; height: 0; }
.chk {
  display: block;
  width: 18px;
  height: 18px;
  border: var(--border);
  border-radius: 3px;
  background: var(--white);
  transition: all 0.1s;
}
.row-check input:checked ~ .chk {
  background: var(--accent);
  border-color: var(--accent);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' d='M2 6l3 3 5-5'/%3E%3C/svg%3E");
  background-size: 12px;
  background-position: center;
  background-repeat: no-repeat;
}

/* Row body */
.row-body { flex: 1; min-width: 0; }
.row-name { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-email { font-size: 12px; color: var(--gray-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
.row-date { font-size: 11px; color: var(--gray-400); font-weight: 500; }

/* Category badges */
.badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1.5px solid var(--dark);
}
.badge-PRIMARY    { background: #dbeafe; color: #1e40af; border-color: #2563eb; }
.badge-SOCIAL     { background: #dcfce7; color: #14532d; border-color: #16a34a; }
.badge-PROMOTIONS { background: #fef9c3; color: #854d0e; border-color: #d97706; }
.badge-UPDATES    { background: #f3e8ff; color: #6b21a8; border-color: #9333ea; }
.badge-FORUMS     { background: #f1f5f9; color: #475569; border-color: #94a3b8; }

/* Count chip */
.count-chip {
  flex-shrink: 0;
  min-width: 44px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
  color: var(--white);
}
.chip-hi  { background: #ef4444; }
.chip-mid { background: var(--accent); }
.chip-lo  { background: #6b7280; }

/* ── Action bar (sticky bottom) ──────────────────────────────────────────── */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 40px;
  background: var(--dark);
  border-top: var(--border);
  box-shadow: 0 -4px 0 var(--accent);
  z-index: 50;
  flex-wrap: wrap;
  gap: 12px;
}
.action-bar.hidden { display: none; }

.action-summary {
  color: var(--white);
  font-size: 14px;
  font-weight: 600;
}
.action-summary strong { color: var(--accent); }

.action-btns { display: flex; gap: 10px; }

.btn-action-clear {
  background: transparent;
  color: #aaa;
  border: 1.5px solid #444;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 18px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.btn-action-clear:hover { color: var(--white); border-color: #888; }

.btn-action-trash {
  background: var(--accent);
  color: var(--white);
  border: 2px solid var(--accent);
  border-radius: 5px;
  font-size: 14px;
  font-weight: 800;
  padding: 10px 24px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(255,255,255,0.2);
  transition: transform 0.05s, box-shadow 0.05s;
  letter-spacing: 0.02em;
}
.btn-action-trash:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 rgba(255,255,255,0.25); }

/* ── Delete overlay ──────────────────────────────────────────────────────── */
.delete-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.delete-box {
  background: var(--white);
  border: var(--border);
  border-radius: 8px;
  padding: 48px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-cta);
  max-width: 400px;
  width: 90%;
}

.delete-text { color: var(--gray-600); font-size: 14px; max-width: 300px; line-height: 1.6; }

/* Spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eee;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ── Confirmation modal ───────────────────────────────────────────────────── */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  padding: 16px;
}
.modal.hidden { display: none; }

.modal-box {
  background: var(--white);
  border: var(--border);
  border-radius: 8px;
  padding: 32px;
  max-width: 440px;
  width: 100%;
  box-shadow: var(--shadow-cta);
}
.modal-box h2 { font-size: 20px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.02em; }
.modal-box p { color: var(--gray-600); margin-bottom: 24px; line-height: 1.6; }

.modal-btns { display: flex; gap: 10px; justify-content: flex-end; }

.btn-modal-cancel {
  background: var(--white);
  color: var(--dark);
  border: var(--border);
  border-radius: 5px;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--dark);
  transition: transform 0.05s;
}
.btn-modal-cancel:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--dark); }

.btn-modal-confirm {
  background: var(--dark);
  color: var(--white);
  border: var(--border);
  border-radius: 5px;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 20px;
  cursor: pointer;
  box-shadow: var(--shadow-accent);
  transition: transform 0.05s;
}
.btn-modal-confirm:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--accent); }

/* ── Toast ───────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(16px);
  padding: 10px 20px;
  background: var(--dark);
  color: var(--white);
  border: var(--border);
  border-radius: 5px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-accent);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 300;
  pointer-events: none;
  white-space: nowrap;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.toast-error { background: #ef4444; border-color: #dc2626; box-shadow: 3px 3px 0 var(--dark); }

/* ── Footer ──────────────────────────────────────────────────────────────── */
footer {
  background: var(--gray-100);
  border-top: 3px solid var(--dark);
  padding: 28px 40px;
  text-align: center;
}
footer p { font-size: 12px; color: var(--gray-400); }
footer a { color: var(--accent); font-weight: 600; text-decoration: none; }
footer a:hover { text-decoration: underline; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 700px) {
  #nav { padding: 0 16px; }
  .hero-inner { padding: 48px 20px 40px; }
  .social-proof-inner { padding: 20px; gap: 20px; }
  .trust-list { display: none; }
  .stat-divider { display: none; }
  .tool-inner { padding: 32px 20px; }
  .action-bar { padding: 12px 16px; }
  footer { padding: 20px 16px; }
  .filter-tabs { gap: 6px; }
  .filter-tab { font-size: 11px; padding: 5px 10px; }
}
```

- [ ] **Step 2: Hard reload in browser and verify full visual appearance**

Open `docs/index.html`. Expected results (check each):
- Nav: black background, "📥 InboxCleaner" with orange "Cleaner", orange CTA button
- Hero: large bold headline with orange "drowning", eyebrow tag, two buttons with orange shadow on CTA
- Social proof bar: dark background, orange stat numbers, trust items
- Tool section: sign-in card with border and shadow
- All hover states show lift effect (open dev tools, hover over elements)
- No unstyled content visible

- [ ] **Step 3: Commit**

```bash
git add docs/style.css
git commit -m "feat: rewrite style.css with neo-brutalist design system"
```

---

### Task 3: Update `docs/app.js` UI layer

**Files:**
- Modify: `docs/app.js`

**Interfaces:**
- Consumes: IDs `section-hero`, `tool-signin-state`, `tool-results-state`, `nav-cta`, `nav-user` (from Task 1)
- Consumes: class `.btn-signin` on multiple buttons (from Task 1)
- Consumes: class `.filter-tab` with `data-category` attribute (from Task 1)
- Preserves: all Gmail API functions (`gGet`, `gPost`, `backoff`, `batchHeaders`, `batchTrash`, `startScan`, `confirmDelete`, `promptDelete`) — do NOT modify these

- [ ] **Step 1: Replace `screens` constant and `show()` function**

Find and replace this block (lines 69–74 in the original file):

```js
// REMOVE this:
const screens = { signin: 'screen-signin', app: 'screen-app', deleting: 'screen-deleting' };

function show(name) {
  Object.values(screens).forEach(id => $( id).classList.add('hidden'));
  $(screens[name]).classList.remove('hidden');
}
```

Replace with:

```js
function show(name) {
  const isSignedIn = name === 'app' || name === 'deleting';
  $('section-hero').classList.toggle('hidden', isSignedIn);
  $('tool-signin-state').classList.toggle('hidden', isSignedIn);
  $('tool-results-state').classList.toggle('hidden', !isSignedIn);
  $('screen-deleting').classList.toggle('hidden', name !== 'deleting');
  $('nav-cta').classList.toggle('hidden', isSignedIn);
  $('nav-user').classList.toggle('hidden', !isSignedIn);
}
```

- [ ] **Step 2: Add `activeCategory` state variable**

Find this line (in the UI state section, around line 66):

```js
let sortBy     = 'count';
```

Add after it:

```js
let activeCategory = '';
```

- [ ] **Step 3: Replace `applyFilter()` to support category filtering**

Find and replace the entire `applyFilter` function:

```js
// REMOVE:
function applyFilter() {
  const q = query.toLowerCase();
  filtered = q
    ? allSenders.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    : [...allSenders];
  filtered.sort((a, b) => {
    if (sortBy === 'count') return b.count - a.count;
    if (sortBy === 'name')  return a.name.localeCompare(b.name);
    if (sortBy === 'date')  return b.latest - a.latest;
    return 0;
  });
  renderList();
}
```

Replace with:

```js
function applyFilter() {
  const q = query.toLowerCase();
  filtered = allSenders.filter(s => {
    const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchesCat   = !activeCategory || s.categories.includes(activeCategory);
    return matchesQuery && matchesCat;
  });
  filtered.sort((a, b) => b.count - a.count);
  renderList();
}
```

- [ ] **Step 4: Replace `renderList()` to use new markup (remove avatar, update classes)**

Find and replace the entire `renderList` function:

```js
// REMOVE the existing renderList function and replace with:
function renderList() {
  const list = $('sender-list');
  list.innerHTML = '';
  if (!filtered.length) {
    const el = document.createElement('div');
    el.className = 'list-empty';
    el.textContent = query
      ? 'No senders match your search.'
      : activeCategory
        ? `No senders in ${activeCategory.charAt(0) + activeCategory.slice(1).toLowerCase()} category.`
        : 'No emails found. Click ↺ to rescan.';
    list.appendChild(el);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const s of filtered) {
    const isSel = selected.has(s.email);
    const row   = document.createElement('div');
    row.className = 'row' + (isSel ? ' selected' : '');
    row.dataset.email = s.email;
    const badges  = s.categories.map(c => `<span class="badge badge-${esc(c)}">${esc(c)}</span>`).join('');
    const dateStr = s.latest ? `<span class="row-date">${ago(s.latest)}</span>` : '';
    const cnt     = s.count >= 1000 ? (s.count / 1000).toFixed(1) + 'k' : s.count;
    row.innerHTML = `
      <label class="row-check" title="Select">
        <input type="checkbox" ${isSel ? 'checked' : ''}>
        <span class="chk"></span>
      </label>
      <div class="row-body">
        <div class="row-name">${esc(s.name)}</div>
        <div class="row-email">${esc(s.email)}</div>
        <div class="row-meta">${badges}${dateStr}</div>
      </div>
      <div class="count-chip ${chipClass(s.count)}">${cnt}</div>`;
    const cb = row.querySelector('input[type=checkbox]');
    cb.addEventListener('change', e => { e.stopPropagation(); toggle(s.email, cb.checked, row); });
    row.addEventListener('click', e => { if (e.target === cb) return; cb.checked = !cb.checked; toggle(s.email, cb.checked, row); });
    frag.appendChild(row);
  }
  list.appendChild(frag);
}
```

- [ ] **Step 5: Replace sign-in event listener to wire all `.btn-signin` buttons**

Find and replace:

```js
// REMOVE:
$('btn-signin').addEventListener('click', () => {
  if (!tokenClient) { toast('Google auth library still loading — try again in a second', 'error'); return; }
  pendingResolve = token => {
    pendingResolve = null;
    if (!token) { toast('Sign-in failed or cancelled', 'error'); return; }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const cache = JSON.parse(raw);
        if (cache.senders?.length) { loadCache(cache); show('app'); return; }
      } catch {}
    }
    show('app');
    startScan();
  };
  tokenClient.requestAccessToken({ prompt: 'consent' });
});
```

Replace with:

```js
function handleSignIn() {
  if (!tokenClient) { toast('Google auth library still loading — try again in a second', 'error'); return; }
  pendingResolve = token => {
    pendingResolve = null;
    if (!token) { toast('Sign-in failed or cancelled', 'error'); return; }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const cache = JSON.parse(raw);
        if (cache.senders?.length) { loadCache(cache); show('app'); return; }
      } catch {}
    }
    show('app');
    startScan();
  };
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

document.querySelectorAll('.btn-signin').forEach(btn => btn.addEventListener('click', handleSignIn));
```

- [ ] **Step 6: Remove `.sort-btn` event listener block and add `.filter-tab` listener**

Find and remove this block (no longer needed — sort buttons are gone from HTML):

```js
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sortBy = btn.dataset.sort;
    applyFilter();
  });
});
```

After `$('btn-clear').addEventListener(...)` line, add:

```js
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.category;
    applyFilter();
  });
});
```

- [ ] **Step 7: Verify the full app flow in browser**

Serve locally to test OAuth (OAuth requires a proper origin — file:// won't work):

```bash
cd docs && python3 -m http.server 8080
```

Open `http://localhost:8080`. Test the full golden path:

1. **Sign out state:** Hero visible, social proof bar visible, sign-in card in tool section. Both "Connect Gmail" buttons (nav + hero + tool card) are visible.
2. **Sign in:** Click any "Connect Gmail" button → Google OAuth popup appears → After auth, hero disappears, nav switches to show "↺ Rescan" and "Sign out", tool shows results header.
3. **Scanning:** Orange progress bar with animated fill appears. Text updates as emails are scanned.
4. **Results:** Sender rows appear with borders and orange shadows. Count chips are red/orange/gray by count. Category badges are color-coded.
5. **Category filter:** Click "Promotions" tab — list filters to only promotion senders. Active tab turns black with orange shadow.
6. **Search:** Type in search box — list filters in real time.
7. **Selection:** Click a row — it gets orange border and warm tint. Action bar slides up from bottom.
8. **Action bar:** Shows count of selected senders and email count. "Move to Trash" is orange.
9. **Confirm modal:** Click "Move to Trash" → modal appears with neo-brutalist styling.
10. **Delete progress:** Confirm → delete overlay appears (dark background, white box, spinner, orange progress bar).
11. **Sign out:** Click "Sign out" in nav → hero reappears, tool shows sign-in card again.

- [ ] **Step 8: Commit**

```bash
git add docs/app.js
git commit -m "feat: update app.js UI layer for neo-brutalist redesign

- Replace show() to work with new page structure (hero/tool sections)
- Add activeCategory state + category filter tab wiring
- Update renderList() to emit new markup (no avatar, new CSS classes)
- Wire all .btn-signin buttons via querySelectorAll
- Remove sort-btn listener (sort removed from redesign)"
```

---

### Task 4: Deploy and verify on GitHub Pages

**Files:**
- No code changes

**Interfaces:**
- Consumes: all changes from Tasks 1–3 committed to `main`

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Wait for GitHub Pages build (~60 seconds)**

Check Actions tab at `https://github.com/iampushpendra/inbox-cleaner/actions` or just wait 60s.

- [ ] **Step 3: Open live URL and verify**

Open `https://iampushpendra.github.io/inbox-cleaner/`. Verify:
- Page loads with new design (not the old blue Gmail-style UI)
- OAuth sign-in works on the live domain (it's already authorized for this origin)
- Scan completes and renders sender list correctly
- Category filters work
- Action bar appears on selection
- Trash flow completes

- [ ] **Step 4: Check mobile (375px viewport)**

Open Chrome DevTools → Toggle device toolbar → iPhone SE. Verify:
- Hero headline wraps correctly at smaller font size
- Social proof bar stacks without overflow
- Sender rows are readable and tappable
- Action bar doesn't cover list content badly (bottom padding handles this)
- Filter tabs wrap to second line gracefully

- [ ] **Step 5: Commit deploy confirmation note to dev-brain**

Update `~/dev-brain/projects/inbox-cleaner.md` — change status line and add session log entry:

```
status: "v2.0.0 — neo-brutalist redesign live on GitHub Pages"
```

```
### 2026-06-24 — UI Redesign session
- Full neo-brutalist redesign: orange accent, bold shadows, hero+social proof+tool layout
- Added category filter tabs (All/Primary/Promotions/Social/Updates/Forums)  
- Removed sort buttons (default: most emails)
- Spec + plan saved to docs/superpowers/
```
