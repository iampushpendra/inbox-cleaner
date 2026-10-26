# Package and task verification — 26 October 2026

Plan task T06. Access-gated. Package comparison is complete; live disposable-mailbox tasks were **not run** because no disposable account or mail-action authorization was provided.

## Package identity

| Surface | Version | Evidence |
|---|---|---|
| Repository source / `manifest.json` | 3.3.1 | `manifest.json` |
| Built package `inbox-cleaner-extension-3.3.1.zip` | 3.3.1 | ZIP manifest, 9 entries |
| `inbox-cleaner-extension.zip` | 3.3.1 | Identical SHA-256 to the versioned ZIP |
| Chrome Web Store (published, per webfetch 2026-10-27) | **3.2.2** (updated Oct 19 2026; 22.41 KiB) | Owner confirmed on 2026-10-26; latest released version |
| Repository archive `inbox-cleaner-extension-3.2.1.zip` | 3.2.1 | ZIP manifest; DOM build with `storage`, `tabs`, `mail.google.com` |
| Installed local package | **Unverified** | No local installed-extension inspection in this run |
| Published listing permission block | **Mismatched** | Listing shows OAuth scopes; repository 3.2.1 archive does not declare them. Dashboard access unavailable, so the cause is unresolved. |

ZIP SHA-256: `2043139a3aec587020f6c1846b424342fbab43b23af1ab7c92a34dcbc7385e42`.

Repository 3.2.1 archive SHA-256: `f0ab1cdce98bdd6b8d70e935331eda7d9d45955c1165cbad953371a0e12600aa`. It is the last published version and cannot be compared byte-for-byte with the current 3.3.1 source; the 3.3.1 package above is the prepared future release and remains unreleased.

## File-by-file comparison

Every entry in the ZIP is byte-identical to the corresponding repository file:

| File | ZIP = source |
|---|---|
| `manifest.json` | yes |
| `content.js` | yes |
| `parsing.js` | yes |
| `popup.html` | yes |
| `popup.js` | yes |
| `popup.css` | yes |
| `icons/icon16.png` | yes |
| `icons/icon48.png` | yes |
| `icons/icon128.png` | yes |

No extra or missing entries. The package is a clean build of the 3.3.1 source tree, not proof of what the store serves.

## Declared permissions and behavior

- Permissions: `storage`, `tabs`.
- Host access: `https://mail.google.com/*`.
- Architecture: DOM automation in an already-open desktop Gmail tab; no OAuth, no Gmail API client and no independent network client.
- 3.3.1 changes (from source and changelog, not a live run): follows enabled Older pagination, reads visible rows only, waits for changed result lists, preserves a complete cache on search failure, and rejects a new action while one is running.

The live store listing may still declare `identity`, `gmail.readonly` and `gmail.modify` and OAuth-era copy. Until the installed package and dashboard identity are confirmed, public copy must keep the installed-package caveat.

## Tasks not run

The following require an explicitly authorized disposable Gmail account and approved mail actions. None was authorized, so nothing was mutated:

- known-sender cleanup;
- multiple senders sharing one conversation;
- mixed old/new/starred thread;
- archived receipt retention;
- large file versus high sender count;
- multi-account/multi-tab identity;
- interrupted scan/action;
- Trash restoration.

Existing synthetic harnesses and parser tests cover local logic only; they are not live Gmail results. No demo, testimonial or timing claim may be derived from them.

## To close this task

1. Confirm the installed extension version and permissions, or export the Developer Dashboard package identity.
2. Authorize one disposable account and a written list of allowed moves/restores; never empty Trash.
3. Run the seeded task list from `scripts/seo-fixtures.json`, recording expected/observed scope, failures and unknowns.
4. Update `scripts/product-facts.json`, help copy and the prepared store submission only from those observations.
