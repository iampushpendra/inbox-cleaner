# SEO-06 implementation report

Implemented October 17, 2026. Scope is the local query tool; controller owns release bookkeeping, generator integration, discovery links, and roadmap status.

## Delivered files

- `docs/tools/gmail-cleanup-search-builder/index.html`: one canonical, indexable tool page with metadata, semantic form/labels, skip link, local-only privacy explanation, editable query, integrated checker, copy action, explicit account-review acknowledgment and Gmail opening action, synthetic examples, scope/conversation cautions, official sources, and links to the extension/guides.
- `docs/tools/query-builder.js`: dependency-free vanilla JavaScript; pure `buildQuery`, `checkQuery`, and `gmailSearchUrl` exports for Node tests, plus page event bindings. No mailbox APIs, OAuth, selection/deletion/archiving, telemetry, storage, URL parameter inputs, or share-state URLs. Gmail destination is computed only on explicit action with a fixed HTTPS mail.google.com origin and an encoded query fragment. No network requests from JavaScript; page CSP also blocks connection requests.
- `docs/tools/query-builder.css`: responsive two-column workbench that collapses on mobile, existing ink/orange visual language, visible focus, wrapping query examples, adequate controls, reduced-motion handling, no remote fonts/assets.
- `test/query-builder.test.js`: 11 pure behavior tests covering combined criteria, relative/fixed criteria, calendar/date boundaries, numeric limits, hostile sender/enum inputs, broad/empty/contradictory checks, grouping/Boolean syntax limits, mixed-unit warnings, status/scope limits, and fixed-origin URL encoding.
- `internal/superpowers/plans/seo-query-tool-report.md`: this internal report.

## Supported contract and conservative limits

Builder: one simple sender email address; Gmail primary/social/promotions/updates/forums/reservations/purchases category; no time restriction, older-than age (1–9,999 d/m/y), or fixed after/before dates (1900–9999); larger-than message size (whole 1–999,999,999, in Gmail M notation or bytes). Relative and fixed inputs are mutually exclusive. Invalid generation emits no usable partial query. Manual query edits remain possible.

Checker: basic syntax/empty/control-character/UTF-16/2,048-character checks; known category, relative age, date, size validation; obvious same-unit range contradictions; exact include/exclude contradictions; multiple-category intersection warning/error. Groups and OR alternatives skip flat-intersection contradiction inference and receive an explicit incomplete-check warning. Other operators/free text, mixed units, and unrecognized statuses/scopes receive an incomplete-check warning. This is deliberately not a complete Gmail grammar. It does not turn relative periods into fixed dates or infer exact time-zone/boundary-day semantics.

The page always says that local parsing cannot predict Gmail matches or protect full conversations. Negative operators do not provide whole-thread safety. Default search vs in:anywhere, current account choice, Gmail search history, clipboard disclosure, and review before any later Gmail action are explicit. Tool criteria are not represented as extension filters or protections.

## Verification and evidence

- Initial red run: `node --test test/query-builder.test.js` failed because the feature module did not exist.
- First implemented run exposed the `subject:(hello world)` grouped-syntax handling failure; corrected and reran green.
- Added regressions for empty groups/quotes/dangling Boolean syntax and unchecked status/scope values; watched both added tests fail, implemented handling, reran green.
- Final targeted run: `node --test test/query-builder.test.js`: 11 tests, 11 pass, 0 fail.
- Final full suite: `node --test`: 67 tests, 67 pass, 0 fail (includes other agents' current work).
- Python suite: `python3 -m unittest discover -s test -p 'test_*.py'`: 15 tests, OK.
- `node --check docs/tools/query-builder.js`: exit 0.
- Static HTML audit with Python's HTML parser: unique IDs, all explicit label targets exist, all local links/assets exist. External page links are the canonical and two official Gmail references only.
- `git diff --check`: exit 0 before staging; staged whitespace check required before commit.
- Browser preview attempt via CUA failed before response with `transport closed before response`. No interactive browser, screenshot, clipboard-permission, real Gmail URL redirect, keyboard traversal, screen-reader announcement, or mobile viewport verification is claimed. Responsive/focus/label behavior was reviewed statically; controller should perform browser checks when the connection is available.

Official sources fetched October 17, 2026:

- https://support.google.com/mail/answer/7190?hl=en — operator syntax and the explicit negative-search conversation caveat.
- https://support.google.com/mail/answer/6593?hl=en — default Spam/Trash exclusion, search use, and search-history behavior.

No synthetic Gmail account or mailbox fixture was executed. Examples use example.com and are labeled synthetic. No empirical deletion, protected-thread, count, timing, storage, or Gmail matching promise is made.
