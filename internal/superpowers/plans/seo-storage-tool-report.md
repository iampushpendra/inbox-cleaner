# SEO-07 storage troubleshooter

Implemented October 17, 2026.

## Delivered

- `docs/tools/gmail-storage-troubleshooter/index.html`: standalone manual storage decision tree, exact canonical URL, accessible labelled optional GB entries, configurable personal-default limit, unknown states, reset, official references and contextual guide links.
- `docs/tools/storage-troubleshooter.js`: dependency-free pure diagnosis and in-memory UI. Distinguishes entered usage at/over quota, below a stated limit and unknown; a partial breakdown can establish that known usage already reaches the limit but cannot establish headroom. Recognizes zero, rejects negative/nonfinite values and invalid quota. A largest service requires a complete breakdown and unique positive maximum.
- `docs/tools/storage-troubleshooter.css`: scoped mobile layout using existing orange/black site visual language; visible focus, skip link, status focus target, responsive columns.
- `test/storage-troubleshooter.test.js`: eight Node built-in tests for the decision branches and validation.

The script does not read account data, make network requests, use storage, or manipulate links/URLs. Form fields deliberately omit `name` attributes so browser submission without JavaScript cannot serialize entries into a URL. Controls are read by their `id` through the browser's form element collection. External destinations are fixed links, with no-referrer metadata. No telemetry, backend, login, scan or reclaimed-space estimate.

Normal Gmail Trash/recovery is separated from permanent deletion and Google One manager flows. Trash review and large-deletion meter delay advice never recommends blindly deleting more. Receiving trouble with entered headroom points back to the actual Google total and missing-mail help. Sender-count extension guidance is contextual to sender cleanup and explicitly says it does not measure bytes or immediately free quota.

## Verification

Test-first: initial eight tests failed because the diagnosis function did not exist, then passed after implementation.

- `node --test test/storage-troubleshooter.test.js`: 8/8 passing.
- `node --test test/*.test.js`: at time of run 64/65 passing. Concurrent query-builder agent's test `checks syntax, numeric and date boundaries in edited queries` failed for `subject:(hello world)`; no files outside the owned storage tool were changed to address it.
- `python3 -m unittest discover -s test -p 'test_*.py'`: 15/15 passing.

Browser screenshot, keyboard interaction, mobile layout and link-crawl verification are delegated to the integrating controller's preview pass. No claim of browser verification is made here.

## Official sources rechecked

- https://support.google.com/mail/answer/9312312?hl=en — shared quota, counted data, large-deletion meter delay (up to 48–72 hours).
- https://support.google.com/mail/answer/6374270/manage-files-in-your-google-drive-storage?hl=en — full-account sending/receiving effects, Spam/Trash counting, size-oriented cleanup.
- https://support.google.com/mail/answer/7401?hl=en — ordinary Gmail Trash up to 30 days and permanent deletion/recovery boundary.
- https://support.google.com/googleone/answer/9776477?hl=en — Google One manager Gmail/Drive permanent deletion versus Photos trash, work-account quota administrator.
- https://support.google.com/mail/answer/7015314?hl=en — missing-email troubleshooting when storage is not established as the cause.

## Limits / controller integration

The tool uses manually entered rounded GB figures, not verified account totals. Other categories, shared-plan usage and pending changes can make their sum differ from Google's live total. It cannot diagnose delivery, estimate reclaimed GB or determine what is safe to delete. Workspace account limits should be confirmed with an administrator. Default 15 GB must be replaced or cleared where it does not apply.

Controller owns manifest, homepage/navigation discovery, sitemap/build integration, version, changelog and roadmap completion. This commit intentionally does not change those shared files.
