# Task 1 Report: Screenshot harness

## What was created

- `scripts/screenshots/harness.js` — defines `self.chrome` stub (storage/tabs/runtime) plus `DEMO_SENDERS` demo data, and a `STATES` driver keyed by `?state=` query param, run verbatim from the brief.
- `scripts/screenshots/frame.css` — turns `html` into a 1280x800/1200x630-agnostic branded canvas (viewport units) and `body` into a bordered/shadowed card, using colors pulled from `docs/style.css` (`--accent: #f97316`, `--accent-light: #fff9f0`, `--dark: #1a1a1a`) — verified these are the site's existing palette, not invented.
- `scripts/generate_screenshots.sh` — injects `frame.css` + `harness.js` into a `sed`-generated copy of `popup.html` (`.screenshot-tmp.html`), captures 4 states at 1280x800 into `docs/img/screenshots/`, captures a 5th at 1200x630 into `docs/og-image.png`, then deletes the temp file. Made executable (`chmod +x`).
- `.gitignore` — appended `.screenshot-tmp.html`.

Before writing anything, I read `popup.html` and confirmed the two `sed` targets match exactly: line 6 `<link rel="stylesheet" href="popup.css">` and line 116 `<script src="popup.js"></script>`. I also read `popup.js` to confirm the stubbed `chrome` API shapes (`storage.local.get(key)` promise-based, `tabs.query()`/`tabs.sendMessage(tabId, payload, callback)` callback-based, `runtime.lastError`) match what `popup.js` actually calls, and read `popup.css` to confirm the demo categories (`SOCIAL`, `UPDATES`, `PROMOTIONS`, `FORUMS`, `PRIMARY`) all have defined badge classes. Everything in the brief matched the repo as found — no ambiguity required stopping before starting.

## Dimension verification

```
docs/img/screenshots/ranked-list.png:  pixelWidth: 1280  pixelHeight: 800
docs/img/screenshots/search-sort.png:  pixelWidth: 1280  pixelHeight: 800
docs/img/screenshots/selection.png:    pixelWidth: 1280  pixelHeight: 800
docs/img/screenshots/confirm.png:      pixelWidth: 1280  pixelHeight: 800
docs/og-image.png:                     pixelWidth: 1200  pixelHeight: 630
```

All five files match the required dimensions exactly.

## What each image actually depicts (visually inspected with Read)

- **ranked-list.png** — Full popup UI, framed in the orange/black card on the cream gradient background. Header reads "Inbox Cleaner · 1,241 emails · 10 senders · 6m ago". Sort is "Most emails" (active). The sender list is populated and sorted by count descending: LinkedIn (342, red chip, SOCIAL badge), Medium Daily (216, red, UPDATES), Uber Receipts (189, red, UPDATES), Amazon (154, red, UPDATES+PROMOTIONS), Quora Digest (98, orange, SOCIAL), Coursera (74, orange, PROMOTIONS, partially cut off at bottom). Count chips correctly show red for ≥100 and orange for 50–99, per `chip-hi`/`chip-mid` CSS. This is the correct populated ranked-list state.
- **search-sort.png** — Search box shows "e" typed in. However, the visible list is **identical** to ranked-list.png — same 6 senders, same order, nothing filtered out. Investigating: `popup.js`'s filter is `name.includes(q) || email.includes(q)`, and every one of the 10 `DEMO_SENDERS` emails happens to contain the letter "e" somewhere (e.g. "noreply", "receipts", "team"), so the query "e" matches all 10 senders and filters nothing. The harness code runs exactly as specified and the search input genuinely receives the typed value and dispatches the `input` event (confirmed by the visible "e" in the box) — this is not a timing bug, it's that the brief's verbatim demo data + verbatim search term never produces a reduced result set. See Concerns below.
- **selection.png** — Three rows checked (LinkedIn, Medium Daily, Uber Receipts, each with blue-highlighted row background and checked checkbox), sticky action bar visible at the bottom reading "3 senders · 747 emails" with "Clear" and "Move to Trash" buttons. Matches the required state exactly.
- **confirm.png** — Modal open on a blurred/dimmed backdrop: trash-can icon, "Move to Trash?" heading, body text "Move all mail from 3 senders to Trash — at least 747 emails, including any archived mail not shown here. Gmail auto-purges Trash after 30 days.", with "Cancel" and "Move to Trash" buttons. Matches the required state exactly.
- **og-image.png** (1200×630) — Same ranked-list state as above, correctly re-flowed/cropped to the wider 1200×630 aspect ratio by the viewport-unit-based `frame.css`. Populated list, header stats, orange/red chips all visible. This is what `docs/index.html`'s `og:image` meta tag will now actually resolve to (previously 404).

## Timing tuning

None was needed. The brief's values (`setTimeout` delay 400ms in `harness.js`, `--virtual-time-budget=4000` in the shell script) worked on the first run — all four states rendered populated/correct rather than showing the loading spinner or empty state. No iteration required.

## Files changed

- `scripts/screenshots/harness.js` (new)
- `scripts/screenshots/frame.css` (new)
- `scripts/generate_screenshots.sh` (new, executable)
- `.gitignore` (modified — added `.screenshot-tmp.html`)
- `docs/img/screenshots/ranked-list.png`, `search-sort.png`, `selection.png`, `confirm.png` (new, committed)
- `docs/og-image.png` (new, committed)

Commit: `0e8d51c` — "feat: generate store screenshots and OG image from the real popup UI"

## Self-review

- Five images exist at the right dimensions — confirmed via `sips` above.
- Each image visually shows the state it claims — confirmed by reading all five PNGs, with one caveat noted above (search-sort doesn't visibly filter, though the search UI itself is correctly exercised).
- `popup.html`/`popup.js`/`popup.css` are untouched — `git diff --stat -- popup.html popup.js popup.css` returns empty; `git status --short` shows no `M` against any of the three files.
- The temp file is gitignored and deleted — `.screenshot-tmp.html` added to `.gitignore`; confirmed absent from the working tree after both runs of the script (`ls` returns "No such file or directory").
- The script is executable and re-runnable — `chmod +x` applied; ran the full script twice back-to-back with identical successful output both times (idempotent: overwrites existing PNGs, cleans up its own temp file each time, no leftover state).

## Concerns

- **search-sort.png does not visually demonstrate filtering.** The harness's demo data (`DEMO_SENDERS`) and the search term (`'e'`) are both specified verbatim in the brief, and every one of the 10 demo senders' email addresses contains the letter "e", so typing "e" into search filters out zero senders — the list before and after looks identical, only the search box's contents differ. This is a data-design property of the brief's own literal code, not a bug in my implementation, a timing issue, or a mismatch between the brief and the repo — so I did not deviate from the verbatim code to fix it. If a screenshot that visibly narrows the list is wanted, the fix would be to change the search term in `harness.js`'s `STATES['search-sort']` (or one demo sender's data) to something that excludes at least a few rows — e.g. searching "amazon" or "uber" instead of "e". Flagging for the controller/task-2 consumer to decide, since `search-sort.png` isn't in Task 2's two referenced images (`ranked-list.png`, `selection.png`) but would presumably still ship in the Web Store listing's four-screenshot set.
- Per task instructions, I cannot and do not claim the extension works against live Gmail — this task only proves the popup UI renders as shown; that verification is out of scope here.

---

## Fix Report: Search-Sort Demo Term (controller finding)

**What was changed:** Line 63 in `scripts/screenshots/harness.js` — search term in `STATES['search-sort']` changed from `'e'` to `'uber'`.

**Why:** The prior search term `'e'` matched all 10 demo senders (every email address contains 'e'), producing a visually unfiltered list identical to ranked-list.png. Searching `'uber'` narrows the result to a single substantive row (Uber Receipts), unambiguously demonstrating filtering.

**Regenerated image state:** `docs/img/screenshots/search-sort.png` now displays search box containing "uber", with the filtered list showing only the Uber Receipts row (green "U" avatar, email "receipts@uber.com", UPDATES badge, red count chip 189). The list is visibly narrowed from the 6 senders shown in ranked-list.png.

**Verification:** Ran `./scripts/generate_screenshots.sh` (idempotent), regenerated all five images successfully. Visually inspected search-sort.png and ranked-list.png with Read tool to confirm filtering is now visible and other states unchanged.

**Commit:** `5efb5ae` — "fix: change search-sort demo term from 'e' to 'uber' for visible filtering"
