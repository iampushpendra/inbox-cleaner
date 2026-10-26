# Acquisition measurement — 26 October 2026

Plan task T05. Status: **measurement limit documented; no tracker added.** This file records the deliberate no-new-tracker decision and the smallest privacy-consistent change that would be required if the decision changes.

## Existing surfaces and what they can answer

| Surface | Existing measurement | Can answer | Cannot answer |
|---|---|---|---|
| Website | Vercel request/hosting aggregates only; no page analytics stream | Which public files/pages are requested in aggregate | Article-to-store click-through, reader intent, per-article usefulness |
| Search | Preserved GSC exports (`research_notes/Analytics intelligence 2026-10-17`) | Impressions, clicks, CTR, position for disclosed queries/pages | Store installs, successful cleanup, ChatGPT provenance |
| Chrome Web Store | Store GA listing sessions and install-filtered events in their own window | Listing sessions and attributed install events | Website landings, whether an install produced a useful cleanup |
| Product usefulness | Voluntary feedback only | A user-reported task outcome, when someone chooses to share it | Population-level success, retention or storage reclaimed |

These are separate denominators. No existing report joins a website visit to a store install or a successful cleanup.

## Decision

Do **not** add a third-party analytics or extension telemetry service for this release. Existing lawful aggregate reports plus a small voluntary feedback log are sufficient to evaluate the current decisions: whether the guides and tools are used, and whether an authorized task succeeded. Any stronger claim stays Unknown rather than inferred.

Reasons:

- The extension has no telemetry and this plan does not authorize adding it.
- A website tracker would need a consent/opt-out review, retention policy and privacy-policy update before it could be considered. Research value does not outrank that work.
- The preserved store attribution is a small sample and its ChatGPT provenance is unresolved; a new tracker would not repair that denominator.

## If an authorized implementation is later approved

Collect only:

- canonical article path (e.g. `/blog/how-to-bulk-delete-gmail-emails.html`),
- sanitized source class (`search`, `direct`, `unknown`; never the raw referrer),
- one outbound action (`store_click`).

Never collect: tool inputs, email addresses or domains, Gmail query strings, message IDs, mailbox contents, URL search parameters or fragments, raw referrers, account identity or extension activity.

Requirements before shipping:

1. A server-side or first-party aggregate endpoint with a documented retention window; no personal identifiers.
2. Consent/opt-out behavior consistent with the privacy policy; the policy must name the new collection before it starts.
3. Tests proving sender-bearing tool inputs, URL search/hash values and arbitrary referrers cannot reach the endpoint, and that the store CTA only emits the fixed action.
4. Scorecard columns with separate denominators: website landing, store click, store-reported install, voluntary task feedback. No article-to-install conversion rate without a real join.
5. Owner/test activity excluded from acquisition claims.

## Voluntary feedback protocol

Use `research_notes/Analytics intelligence 2026-10-26/voluntary-feedback-template.md`. Ask only after a user reports a result; never require an identity, mailbox example or screenshot. Record task family, native or extension path, outcome as reported, and whether the user volunteered detail. Keep raw responses private and aggregate before quoting.

## Current limits

- Website landings and store CTA clicks: Unknown.
- Activation / successful cleanup: Unknown.
- Dashboard installs/uninstalls/active users: blocked on owner export.
- ChatGPT-attributed store events: four small-sample observations with unresolved provenance; not website conversions.
- No extension telemetry, no mailbox content and no query/address collection exists or is added by this document.
