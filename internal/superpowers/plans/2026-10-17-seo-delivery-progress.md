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
