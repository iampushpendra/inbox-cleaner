# SEO audit — inbox-cleaner.vercel.app (2026-10-18)

Toolkit: `seo-audit` (Haniubub/seo-toolkit, local CLI, no API keys). 56/56 sitemap URLs
fetched. Business type: Chrome extension / publisher (Chrome Web Store product + blog +
local tools). Not a local business, not e-commerce.

## Health score

| Category | Weight | Score | Source |
|---|---|---|---|
| Technical SEO | 22% | 99 | `./seo technical` |
| On-page SEO | 20% | 97 | `./seo page` |
| Content quality | 23% | 85 | `./seo content` (info density 0.47, repetition 12) |
| Schema | 10% | 98 | `./seo schema` (score ignores HowTo/FAQ validity) |
| Performance (lab) | 10% | 99 | `./seo visual` — load 885 ms, DOM-ready 373 ms |
| AI readiness | 10% | ~60 | no `llms.txt` (404); robots.txt open to AI crawlers |
| Images | 5% | 100 | no `<img>` on home or blog — N/A, see finding 2 |
| **Overall** | |**~92** | weighted |

Measured: 0 broken URLs, 0 redirect hops, 0 canonical mismatches, 0 thin pages
(min word count well above 300), valid `urlset` sitemap, clean robots.txt, HTTPS.

## Findings

### 1. [High] Every blog post and the blog index ship no `og:image`
- **Observation:** 53 of 56 pages return no `og:image`. Only `/` has one
  (`docs/index.html:14` → `/og-image.png`). Confirmed in source: no `og:image`
  template exists in `scripts/publish_blog.py`, `scripts/build_site.mjs` or any
  `docs/blog/*.html`.
- **Dependency:** a per-post social image. None exists — the blog has zero images,
  so this needs a decision (one shared brand card vs. per-post hero), not just a
  meta tag.
- **Failure signal:** every share of a blog URL renders as a bare text link with no
  preview card on LinkedIn, Slack, X, iMessage.
- **Early indicator:** preview validator shows an image card for any `/blog/*.html` URL.

### 2. [High] `twitter:card` missing site-wide (56/56)
- **Observation:** no page declares a Twitter card. `og:title/og:description/og:image`
  exist on `/`, so the only gap is the card type tag.
- **Dependency:** none — same template edit as finding 1.
- **Failure signal:** X/Twitter falls back to a no-image OG scrape.
- **Early indicator:** one `<meta name="twitter:card" content="summary_large_image">`
  per template, plus `twitter:title`/`twitter:description` on the blog template.

### 3. [Medium] Homepage ships deprecated `HowTo` and withdrawn `FAQPage` schema
- **Observation:** homepage JSON-LD contains `HowTo`, `HowToStep`, `FAQPage`,
  `Question`, `Answer`. Google deprecated HowTo rich results (Sept 2023) and withdrew
  FAQ rich results for all sites (7 May 2026).
- **Dependency:** the visible FAQ/HowTo content stays; only the markup changes.
- **Failure signal:** schema reports stay clean but produce no rich result — zero
  return on markup that must be maintained on every content change.
- **Early indicator:** Rich Results Test shows "no detected item" for both types while
  `Organization`/`WebApplication` remain valid. Note the toolkit's own
  "add LocalBusiness" recommendation is wrong here — this is not a local business.

### 4. [Medium] Six titles exceed ~60 characters
- **Observation:** `/tools/gmail-storage-troubleshooter/` (64),
  `/blog/inbox-cleaner-setup-permissions-recovery.html` (67),
  `/blog/inbox-cleaner-vs-native-gmail.html` (66),
  `/blog/gmail-mailbox-full-cant-receive-emails.html` (75),
  `/blog/how-to-select-all-emails-gmail.html` (66), search-builder tool (64).
- **Dependency:** title templates per page type, not the blog post body.
- **Failure signal:** SERP truncation with `…`; weaker CTR than the query intent.
- **Early indicator:** all titles ≤ 60 chars while keeping the primary keyword first.

### 5. [Medium] No JSON-LD on `/privacy.html` and the search-builder tool
- **Observation:** 3 of 56 pages have no structured data. Homepage and all 52 blog
  posts have `Article`/`Organization` or `FAQPage` blocks.
- **Dependency:** the tool pages' JSON-LD build step — `scripts/build_site.mjs`
  registers reviewed local tools via a manifest, so this is a manifest gap.
- **Failure signal:** tool pages are ineligible for sitelinks/software rich results.
- **Early indicator:** both pages emit valid `SoftwareApplication`/`WebPage` JSON-LD.

### 6. [Low] No `llms.txt` (404)
- **Observation:** `robots.txt` allows all user-agents (GPTBot, ClaudeBot, PerplexityBot
  included — no explicit disallow). `/llms.txt` returns 404.
- **Dependency:** `llms.txt` is an unofficial convention with no confirmed Google or
  OpenAI consumption guarantee — treat as optional, not a ranking lever.
- **Failure signal:** none measurable today.
- **Early indicator:** n/a unless AI citation tracking is added.

### 7. [Low] Two unlabelled inputs on the homepage
- **Observation:** `agent_ux_check.py` scores 92/100; 2 inputs have no `<label for>` and
  no ARIA label. Real buttons/anchors throughout (0 `div onclick` widgets), 10
  semantic landmarks, 552-node a11y tree.
- **Dependency:** the homepage markup only.
- **Failure signal:** screen-reader users get unnamed fields; no ranking impact.
- **Early indicator:** `./seo run agent_ux_check.py https://inbox-cleaner.vercel.app`
  reports 0 unlabelled inputs.

## Not measured

- **No field data.** No Google API key → no CrUX/PSI/GSC. All performance numbers are
  lab estimates from one headless run; INP was not measured at all.
- **No SERP/backlink data.** DataForSEO, Ahrefs, Moz and Bing extensions are installed
  but unconfigured; `nlp_analyze.py` and `lcp_subparts.py` exited on missing keys.
  Keyword/ranking claims in this report are therefore absent by design.
- **Drift baseline not captured.** `drift_*` scripts need Python ≥3.10 and a
  3.10-compatible `pylibs` (the pinned wheels are built for the system 3.9.6).

## Suggested order

1. og:image + twitter:card on the blog template (findings 1–2, one template edit each).
2. Drop HowTo/FAQPage markup from the homepage (finding 3).
3. Trim the six long titles (finding 4).
4. Add tool-page JSON-LD via the tool manifest (finding 5).

Not started: any of the above. Say which and I will implement.