# SEO roadmap delivery — 17 October 2026

Plan: `internal/superpowers/plans/2026-10-17-seo-roadmap.md`.
Base: `2263d24`. User authorizes continuing all SEO work through subagents. Existing repo is shared; each worker owns disjoint files. Controller owns integration and release metadata. User previously authorized push and publication; this continues that same SEO scope. Publish the verified finished batch with an ordinary push; never force-push.

## Delivery ledger

- Query-builder agent: SEO-06, own tool HTML/JS/CSS/tests/report. Running.
- Storage-diagnostic agent: SEO-07, own tool HTML/JS/CSS/tests/report. Running.
- Content agent: remaining seven refreshes, complete article disposition audit, homepage/privacy/prepared store copy. Running.
- Controller: generator/tool discovery, scorecard/reproducible reporting, integration, honest completion accounting.
- Next workers as slots free: publishing evidence-record enforcement; evidence/setup/comparison assets; independent final review.

## Interfaces and constraints

| Work pair | Interface | Decision |
|---|---|---|
| Tools / generator | Two canonical tool routes and four static assets | Generator owns exact allowlist, sitemap and hub discovery; workers do not edit it. |
| Content / generator | Existing article titles and generated link regions | Content does not rebuild generated regions; controller rebuilds after edits settle. |
| Publisher / content | Evidence records versus truthful article review | Records must distinguish source review from live mailbox tests; no fabricated readiness. |
| Scorecard / analytics | Existing GSC/GA exports | Date/source/denominator retained; absent website/store-dashboard inputs remain unknown. |
| Roadmap / third-party evidence | Weekly exports, later recrawl, real competitor tests | Implementation can prepare workflows, not manufacture future observations or bypass blocked dashboards. |

External dependencies remain pending explicitly: private Developer Dashboard exports, individual authenticated GSC inspection, live disposable Gmail walkthroughs, firsthand competitor tests and post-release equal-window reviews. Synthetic tests can establish local behavior but cannot be presented as proof of Gmail/competitor behavior. No real-mail mutation, external outreach, account-setting changes or silent telemetry.

- Generator integration: seven site tests passed, including new canonical tool discovery, repeat-build stability and rejection of unlisted tool files. Initial two tests failed before implementation as expected.

- SEO-06 implemented by query agent in d58ea66; 11 targeted tests, full Node 67/67 and Python 15/15 at worker completion. Controller browser verified synthetic sender+size generation, consent enables Gmail action, copy success feedback, invalid manual syntax disables actions and clears consent. No real-mail action performed.
- SEO-07 implemented by storage agent in d62c6eb; 8 targeted tests. Controller browser verified entered 1/2/13 GB against 15 GB gives Photos-first review and over-quota cautions, then reset clears inputs/results. Narrow 490px pane screenshot inspected without horizontal clipping.
- Scorecard implemented in 6752fc6 with two meaningful window/unknown tests; exported baseline reproduces 4/1307 vs 13/1847 without joining store attribution.
- Publishing evidence-record implementation delegated; discovered existing roadmap claimed record/readiness behavior that code did not enforce. Correcting implementation rather than treating checked plan text as proof.

## Completed implementation and review

- Content source review: `6b08f98`; 44 article rewrites, homepage/privacy/prepared store copy, all 12 priority refresh records and all 49 original URL dispositions. Original publication dates preserved. Additional copy fixes `41c7571` and `08afe6f` qualify recovery and correct irrelevant sender recipes.
- Evidence assets: `20e7c57` and `1164b05`; setup and native-Gmail comparison source-reviewed, new ready records independently reviewed by controller. New publications use real readiness checks, not fabricated live evidence.
- Publishing gate: `d4b0120`; independent reviewer found three real issues. Fix `13d0810`: fixed historical49 legacy set, preserve reviewed authored HTML/fingerprint, and private draft sidecars with next-draft/review selection. All three independently re-reviewed ADDRESSED. `aefecf6` additionally enforces exact canonical slug.
- Independent content review: all 49 original URLs/dates and dispositions, all 51 basic gates, local links and 12 homepage FAQ/schema pairs verified. Risky financial, filter, age, size, mobile and mixed-conversation instructions checked at source level. No material issue after scoped recovery/recipe corrections.
- Independent whole-delivery review: clean. `node --test test/*.test.js`:68 passed; Python discovery:21 passed; actual build succeeded with zero changes. No live Gmail, installed-package or competitor behavior was claimed by these checks.
- Both new articles published locally with reviewed fingerprints; subsequent builds preserve readiness. All local links resolve, no duplicate HTML ids found. Tool/example screenshots remain in private research assets.

## Scope decisions

- Use the existing shared repository with disjoint worker file ownership and scoped commits; no branch reset, history rewrite or unrelated work removal.
- The old published49 set is explicit, not dynamically extended. Historical source-review records use evidence_checked rather than pretending every existing article already met the new readiness process.
- Native Gmail is the current documented comparison baseline. A third-party firsthand comparison and full URL merge decisions remain gated on actual product trials and query/backlink evidence.
- The two pending generic permission/workflow briefs now point to their reviewed setup/comparison owners rather than creating duplicative new pages. Published URLs were not merged or redirected.
- No new website analytics, telemetry, paid services or external promotion. Current analytics gaps are represented as unknown in the scorecard. Weekly/28-day outcomes require future observations and are not checked off on release day.

- Tool demo: `2a3eaff`; real local screenshots with declared synthetic inputs rendered into a16-second1920×1080 silent MP4 (1.44MB). HyperFrames lint/layout and nine screenshot samples checked; actual encoded frames at4s/12s and384-frame duration verified. No Gmail/account footage or benchmark implication.

## Publication

Pending final ordinary push and HTTP verification. Release3.3.0; runtime manifest3.2.1. User previously authorized publishing this continuing SEO work. No store-console submission or account-setting change is included.
