# 📥 Inbox Cleaner

**See who's filling your Gmail. Select senders and move all their emails to Trash in one click.**

[![Live App](https://img.shields.io/badge/Live%20App-open-blue?style=flat-square)](https://iampushpendra.github.io/inbox-cleaner/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## What it does

Most Gmail cleaners only show your Primary inbox. Inbox Cleaner scans **all 5 categories** — Primary, Social, Promotions, Updates, Forums — and shows a ranked list of who's occupying the most space:

- **Email count** per sender (color-coded: red ≥100, orange ≥50)
- **Category badges** showing which Gmail tab their mail lands in
- **Last received** — relative timestamp of most recent email
- **Checkbox selection** — pick one sender or dozens at once
- **One-click Trash** — moves everything from selected senders to Trash in seconds

Works entirely in your browser. No server. No data ever leaves your device.

---

## Try it

**[→ Open the web app](https://iampushpendra.github.io/inbox-cleaner/)** — nothing to install, works on any browser

Or load it as a Chrome extension (see [Extension setup](#chrome-extension-setup) below).

---

## How it works

```
Sign in with Google
       │
       ▼
Pass 1 — messages.list (500/page)
  Collects all message IDs across your inbox
       │
       ▼
Pass 2 — Gmail Batch API (100 msgs/request)
  Reads only: From header · Date header · Label IDs
  Never reads: subject, body, attachments, recipients
       │
       ▼
Group by sender → ranked list
       │
  [You select senders + click "Move to Trash"]
       │
       ▼
  from:<email> search → collect IDs
  → messages.trash in batches of 100
```

**OAuth scopes:**
| Scope | Purpose |
|-------|---------|
| `gmail.readonly` | List messages, read From/Date headers |
| `gmail.modify` | Move emails to Trash |

No `https://mail.google.com/` (full access) is ever requested.

---

## Privacy

- **No server** — all API calls go directly from your browser to `gmail.googleapis.com`
- **Metadata only** — only `From` and `Date` headers are read, never subject or body
- **Local cache** — scan results live in `localStorage` on your device, cleared on sign-out
- **Trash, not delete** — emails go to Gmail Trash and stay there 30 days before auto-purge; you can restore them any time

[Full privacy policy →](https://iampushpendra.github.io/inbox-cleaner/privacy.html)

---

## Chrome Extension setup

1. Clone or download this repo
2. Open `chrome://extensions` → enable **Developer mode** (top right)
3. **Load unpacked** → select the repo root folder (not `docs/`)
4. Click the 📥 icon in your Chrome toolbar

Uses `chrome.identity.getAuthToken` — no redirect URI or backend needed.

---

## Tech stack

| Layer | Detail |
|-------|--------|
| Auth (web app) | Google Identity Services `initTokenClient` — token flow, no backend |
| Auth (extension) | `chrome.identity.getAuthToken` |
| Scan | Gmail multipart batch API — 100 messages per request |
| Trash | Gmail multipart batch API — `POST /messages/{id}/trash` × 100 per request |
| Storage | `localStorage` (web) · `chrome.storage.local` (extension) |
| Framework | None — vanilla JS, zero dependencies, zero build step |

---

## Folder structure

```
inbox-cleaner/
├── docs/               ← Web app (GitHub Pages)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── privacy.html
├── background.js       ← Extension service worker
├── popup.html          ← Extension popup
├── popup.css
├── popup.js
├── manifest.json       ← Manifest V3
└── icons/
```

---

## Contributing

PRs welcome. Useful areas:

- **Virtual scrolling** for large sender lists (10k+ unique senders)
- **Undo snackbar** — surface a Restore button after trashing, valid for the session

---

## License

MIT
