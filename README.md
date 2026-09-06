# 📥 Inbox Cleaner

**See who's filling your Gmail. Select senders and move all their emails to Trash in one click.**

[![Live App](https://img.shields.io/badge/Live%20App-open-blue?style=flat-square)](https://iampushpendra.github.io/inbox-cleaner/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**v3.0.0** — see [CHANGELOG.md](CHANGELOG.md) for what's new.

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

**Chrome extension** (this repo's `manifest.json`/`content.js`/`popup.js`) — no OAuth, no API, no backend:

```
Open Gmail in a tab
       │
       ▼
Content script navigates category:primary / social / promotions / updates / forums
  Scrolls each category's results to completion, reads sender + date off each row
       │
       ▼
Group by sender → ranked list (chrome.storage.local)
       │
  [You select senders + click "Move to Trash"]
       │
       ▼
  from:(a OR b OR ...) search → Gmail's own "select all matching search" + Trash
```

**Web app** (`docs/index.html` at [iampushpendra.github.io/inbox-cleaner](https://iampushpendra.github.io/inbox-cleaner/)) is a separate surface that still uses Google Identity Services + the Gmail API directly — see `docs/app.js`.

---

## Privacy

**Chrome extension:**
- **No API, no OAuth** — the content script reads sender/date directly off Gmail's own rendered page inside your browser; nothing is sent anywhere
- **Local cache** — scan results live in `chrome.storage.local` on your device
- **Trash, not delete** — emails go to Gmail Trash and stay there 30 days before auto-purge; you can restore them any time

**Web app:** all API calls go directly from your browser to `gmail.googleapis.com`; only `From`/`Date` headers are read.

[Full privacy policy →](https://iampushpendra.github.io/inbox-cleaner/privacy.html)

---

## Chrome Extension setup

1. Clone or download this repo
2. Open `chrome://extensions` → enable **Developer mode** (top right)
3. **Load unpacked** → select the repo root folder (not `docs/`)
4. Click the 📥 icon in your Chrome toolbar

No sign-in step — the extension reads whichever Gmail tab you already have open.

---

## Tech stack

| Layer | Detail |
|-------|--------|
| Auth (web app) | Google Identity Services `initTokenClient` — token flow, no backend |
| Auth (extension) | None — content script reads the page you're already signed into |
| Scan (extension) | Content-script DOM automation — Gmail's `category:` search operator + auto-scroll |
| Trash (extension) | Gmail's native "select all conversations that match this search" bulk action |
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
├── content.js          ← Extension content script (Gmail DOM automation)
├── parsing.js           ← Pure parsing/aggregation logic (shared with test/)
├── popup.html          ← Extension popup
├── popup.css
├── popup.js
├── manifest.json       ← Manifest V3
├── test/               ← Node built-in test runner (`node --test`)
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
