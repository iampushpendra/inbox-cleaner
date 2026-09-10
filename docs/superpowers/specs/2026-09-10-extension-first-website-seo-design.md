# Extension-First Website & SEO Strategy — Design Spec

**Date:** 2026-09-10
**Goal:** Convert the Inbox Cleaner web property from a login-gated web app into a pure marketing landing page whose every CTA drives Chrome Web Store installs, and retarget the SEO/content strategy from "sign in to the web app" to "install the extension."

---

## Context

Two things changed underneath the website:

1. **The extension migrated off OAuth** (v3.0.0, shipped 2026-09-06). It now automates the Gmail web UI via a content script — no `chrome.identity`, no Gmail API, no network calls of any kind.
2. **The web app never worked for real users.** `docs/app.js` uses Google Identity Services with the same restricted Gmail scopes the extension just escaped, so every visitor clicking "Connect Gmail" hits Google's "unverified app" wall. It is a dead funnel, not a second product surface.

The site still sells the old story. Worse, all 15 published blog posts carry a CTA reading *"No install. Runs in your browser."* — a claim that is now factually false about the product it advertises. This is a correctness problem, not just a marketing one.

**Canonical host:** `https://inbox-cleaner.vercel.app` (per `docs/index.html:6` canonical, OG tags, and every `sitemap.xml` entry). The GitHub Pages URL in `README.md` is legacy and stays secondary.

**Store URL (single source of truth for every CTA):**
`https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep`

---

## Decisions locked in during brainstorming

| Decision | Choice | Why |
|---|---|---|
| Hero positioning | **Privacy / no-account** | The DOM-automation rewrite makes "no sign-in, nothing leaves your browser" literally true. Every competitor requires OAuth. Turns the migration into the marketing story. |
| Keyword mix | **Two tracks** — keep informational how-tos, add commercial-intent | How-tos are top-of-funnel; install-intent queries sit next to the decision. |
| Measurement | **GSC + Web Store stats only** | No third-party script on a site claiming it doesn't track you. Accepted blind spot: no per-post install attribution. |
| Screenshots | **Generated locally from real UI files with demo data** | Real screenshots would publish the owner's actual correspondents' addresses to the Web Store permanently. |
| Comparison pages | **Seeded into the existing pipeline**, not hand-written | The automation already publishes twice daily; hand-writing duplicates it. |

---

## 1. Screenshot generation

`popup.html` and `popup.css` are the real UI. Rendering them directly guarantees screenshots can never drift from the shipped interface.

**Mechanism:** a build script reads the real `popup.html`, injects a stub `chrome` API before the `popup.js` tag, and renders the result in headless Chrome (already installed locally, v152 — no new dependency, nothing added to the shipped extension).

The stub supplies:
- `chrome.storage.local.get` → returns a fixed `inboxCleanerData` payload of demo senders
- `chrome.tabs.query` / `chrome.tabs.sendMessage` → resolve as if a Gmail tab is present and idle
- `chrome.runtime.onMessage.addListener` → no-op

**Demo dataset** must exercise all three count-color bands (`chip-hi` ≥100, `chip-mid` ≥50, `chip-lo` <50) and all five category badges. Recognizable-but-generic senders (LinkedIn, Uber receipts, Medium, Amazon shipping, Quora, Coursera) with plausible counts and staggered `latest` timestamps.

**Four captured states**, matching the store's asset checklist:

| State | What's shown | How the harness produces it |
|---|---|---|
| `ranked-list` | Populated sender list, header stats | Default render |
| `search-sort` | Search box filtered, sort control visible | Stub types into `#search` and dispatches `input` |
| `selection` | 3 senders selected, action bar visible | Stub clicks 3 row checkboxes |
| `confirm` | Delete confirmation modal | Stub clicks checkboxes, then `#btn-delete` |

**Framing:** the popup is ~400px wide; alone on a 1280×800 canvas it would look stranded. The harness centers it on a branded gradient canvas at exactly 1280×800 (the store's required size), so the same PNGs serve both the listing and the landing page. The canvas reuses the existing palette from `docs/style.css` rather than introducing new brand colors, so the store assets and the site match.

**Files:**
- `scripts/screenshots/harness.js` — chrome stub, demo data, per-state drivers
- `scripts/screenshots/frame.css` — branded canvas
- `scripts/generate_screenshots.sh` — inject, render, capture
- Output: `docs/img/screenshots/*.png` (committed; used by landing page and store listing)

Rendering uses `--headless --screenshot --window-size=1280,800` plus `--virtual-time-budget` so injected interactions settle before capture.

**Explicit limitation to record in the script's header comment:** these verify the UI's appearance, not that the extension functions. Live Gmail verification remains a separate, human-only task.

---

## 2. Landing page (`docs/index.html`)

Full rewrite. Same URL, so no link equity is lost; the page gains content depth, which helps rather than hurts.

**Structure:**

1. **Hero** — privacy headline, one-line subhead, primary CTA "Add to Chrome — Free" → store URL, trust line ("Works inside Gmail. No account to connect.")
2. **The problem** — you can't tell who's filling your inbox; Gmail gives you no per-sender view
3. **How it works** — 3 steps, using the generated screenshots
4. **Privacy section** — the differentiator, stated concretely (see claims discipline below)
5. **Comparison table** — capability axes only
6. **FAQ** — `<details>` elements, carrying `FAQPage` JSON-LD
7. **Closing CTA** → store URL
8. **Footer** — blog, privacy policy, GitHub

**Zero JavaScript.** FAQ uses native `<details>`; no smooth-scroll script, no analytics. A script-free page is faster and consistent with the pitch. `docs/app.js` is deleted outright (551 lines); the waitlist form (`index.html:196-202`) goes with it.

**Claims discipline — only these privacy statements, all verified against the shipped v3.0.0 code:**
- No Google sign-in, no OAuth, no API access — *verified: no `chrome.identity`, no `oauth2` block in `manifest.json`*
- Makes no network requests at all — *verified by the v3.0.0 final code review: `content.js` contains zero fetch/XHR*
- Reads only sender name/address and date from the conversation rows Gmail already rendered
- Scan results stay in `chrome.storage.local` on your device
- Moves mail to Trash (recoverable ~30 days), never permanent deletion

**Do NOT claim** the extension "cannot see" your email — the content script can read the page it runs in; the accurate and still-strong claim is that nothing is transmitted.

**Comparison table:** restricted to verifiable capability axes — requires connecting a Google account (yes/no), processes data on a remote server (yes/no), scans all 5 category tabs, price. No claims about any competitor's data-handling conduct, including Unroll.me's FTC history. Neutral axes are both safer and lower-maintenance.

---

## 3. Privacy policy (`docs/privacy.html`)

Currently describes an OAuth token flow and Gmail API calls that no longer exist. It is linked from the Web Store listing, so a stale policy is a live review risk, not just a docs problem.

Rewrite to describe the actual v3.0.0 architecture: content script reads the rendered Gmail page locally, no data transmission, `chrome.storage.local` for scan cache, Trash-not-delete, permission set (`storage`, `tabs`, `mail.google.com` host access) and what each is for.

The separate web app's OAuth disclosures are removed entirely, because the web app is being removed.

---

## 4. SEO strategy

**Track 1 — informational (existing, retargeted).** The 118 queued how-to topics stay as top-of-funnel capture. Only their CTA and the "no install" claim change. No re-prioritization of the existing queue beyond interleaving (below).

**Track 2 — install-intent (new).** Queries sitting next to the install decision, seeded into the same pipeline and interleaved near the front of the queue so they publish within days rather than after 118 how-tos:

- `best gmail cleaner extension`
- `gmail cleaner chrome extension`
- `gmail bulk delete extension`
- `free gmail cleanup tool`
- `clean email alternative`
- `unroll.me alternative`
- `mailstrom alternative`
- `clean email vs unroll me`
- **Privacy cluster (the wedge):**
  - `delete gmail emails without giving access`
  - `gmail cleaner without permissions`
  - `is it safe to give apps access to your gmail`
  - `how to revoke gmail app access`
  - `gmail extension that doesn't require login`

The privacy cluster is the strategic core: it captures people actively hesitating over OAuth, for whom "no sign-in required" is not a feature bullet but the literal answer to their query. No competitor can rank against it, because every competitor requires the thing these searchers are avoiding.

**Structured data:**
- **Add** `SoftwareApplication` to the homepage — `applicationCategory: BrowserApplication`, `operatingSystem: Chrome`, `offers.price: 0`, `downloadUrl` → store URL
- **Keep** `FAQPage` on the homepage
- **Retire** the homepage `HowTo` block — it made sense when the homepage *was* the tool; the homepage is now a product page. `HowTo` continues on blog posts, where the steps actually live.

**Internal linking:** landing → blog index; every post → landing page *and* store; Track-2 posts cross-link to each other (comparison cluster).

**Homepage title/meta** rewritten around the extension + privacy angle rather than the web app.

---

## 5. Content pipeline retarget

- **`scripts/blog_prompt.md`** — replace the `.blog-cta` template block (currently at `:137-141`): href → store URL, headline → install framing, and **delete the false "No install. Runs in your browser." line**, replacing it with the no-sign-in claim. Add an instruction to work the no-OAuth angle in naturally where a topic touches permissions or third-party access.
- **`scripts/blog-topics.json`** — add the 13 Track-2 topics. Ordering is explicit, not "roughly near the front": the 5 privacy-cluster topics occupy the next 5 pending slots (publishing within ~3 days at the twice-daily cadence), the 8 comparison/category topics occupy the 8 slots after that (~4 days more), and the remainder of the existing how-to queue shifts back unchanged. The privacy cluster goes first because it is the only segment where the product's differentiator *is* the search query.
- **`scripts/daily_publish_prompt.md`** — audit for web-app references and retarget.

Publishing cadence, `publish_blog.py`, and the launchd schedule are unchanged.

---

## 6. Blog retrofit (15 published posts)

Each post carries a `.blog-cta` block. The `<p>` and `<a>` lines are invariant across posts; the `<h3>` is topic-specific and stays. Update in every post:
- `<a href>` → store URL, link text → install framing
- `<p>` → remove "No install. Runs in your browser."

Also grep all 15 for body-copy references to signing in, connecting Gmail, or the web app, and correct them — a retargeted CTA under a paragraph promising browser-based no-install usage is still a false page.

---

## 7. Out of scope

- **Extension code** — v3.0.0 just shipped and still needs live Gmail verification; not touched here.
- **Publishing automation mechanics** — schedule, `publish_blog.py`, launchd plist unchanged.
- **`robots.txt`, GSC verification files** — unchanged.
- **The Apps Script waitlist endpoint** — orphaned when the form is removed. Collected emails remain in the owner's sheet; retiring the endpoint is the owner's call.
- **`docs/CHROME_WEB_STORE.md`'s stale "Privacy practices tab" section** — a known parked item from the v3.0.0 session. Related but separately tracked; fix before the next store submission.

---

## 8. Success criteria

Measured through Search Console and the Web Store dashboard:

1. Zero false "no install / runs in your browser" claims anywhere on the property.
2. Every CTA on every page resolves to the store listing.
3. Homepage carries valid `SoftwareApplication` + `FAQPage` structured data (Rich Results Test passes).
4. Track-2 pages published and indexed; GSC shows impressions on install-intent and privacy-cluster queries.
5. Web Store install count trending above the current baseline (1 user).
6. Landing page ships with zero JavaScript and no third-party requests.
