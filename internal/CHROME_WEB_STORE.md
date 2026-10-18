# Chrome Web Store listing draft and submission evidence

Reviewed October 17, 2026 against `manifest.json`, `content.js`, `popup.js`, `parsing.js` and `scripts/product-facts.json`; updated October 18, 2026 for manifest 3.2.2. This is prepared copy only: no upload, submission or live listing change was performed. Repository documentation versions can differ from the manifest.

**Listing comparison, 18 October 2026.** The public listing page was read and compared against this package. It shows version 3.2.1 with permissions `identity`, `gmail.readonly` and `gmail.modify`, and OAuth-era copy: "One click moves everything from selected senders to Trash", "nothing is ever sent anywhere except directly to Google's Gmail API", "cached locally in your browser and cleared on sign-out". Chrome renders a listing's permission block from the uploaded manifest, so the published build is the retired OAuth/Gmail-API extension, not the DOM-automation build. The copy below replaces that text; the permission block changes only when the 3.2.2 package is uploaded. Not confirmed against the Developer Dashboard, which was not accessible.

Listing: https://chromewebstore.google.com/detail/inbox-cleaner/pnlnpdidhjimchppdmojledmfakpepep

## Proposed listing copy

**Name**

```text
Inbox Cleaner — Gmail Sender Cleanup
```

**Summary** (under 132 characters)

```text
Review Gmail senders in desktop Chrome. Select unwanted senders, then confirm a move to Trash. Requires an open Gmail tab.
```

**Description**

```text
Find repeat senders in Gmail, review their mail, and choose which sender histories you no longer need. No account linking and no mailbox upload.

Inbox Cleaner runs inside an already-open Gmail tab in desktop Chrome. It discovers senders across Primary, Social, Promotions, Updates and Forums, then shows them ranked by how much mail each one has, with category badges and a last-received date.

HOW TO USE IT
• Install the extension, then open the Gmail account you want to clean in desktop Chrome.
• Start a scan and let it finish. A full scan of a large mailbox can take several minutes.
• Review the discovered senders and their broader mail history.
• Select the senders you want to clear, review the scope, then confirm Move to Trash.

WHAT IT DOES
• Scans all five Gmail categories, not just Primary.
• Ranks senders by conversation count: red for 100 or more, orange for 50 or more.
• Shows category badges and a last-received date for each sender.
• Select one sender or dozens at once.

UNDERSTAND THE SCOPE
• This is sender cleanup: a selected sender's search can include archived matching mail.
• A category badge helps discovery; it does not limit the action to that category.
• Age, size, unread and starred exclusions from a separate Gmail search do not carry over.
• Use Gmail's own reviewed searches when you need those restrictions.
• Counts describe Gmail conversations/results, may be approximate or unresolved, and are not storage measurements. Up to 250 senders are checked against Gmail result counts when resolvable.
• Selected senders are processed in batches of up to 20.
• No scan-time, deletion-size or recovered-storage guarantee is made.

PRIVACY AND RECOVERY
• The extension reads rendered sender information, dates, categories and result counts. It does not read message bodies, subject lines or attachment contents.
• Scan results are cached locally in chrome.storage.local on your device.
• There is no extension OAuth sign-in, no Gmail API client, no model API and no independent network client. The extension drives Gmail's own interface, and Gmail itself continues communicating with Google as you use it.
• Sender selection and the Move to Trash confirmation are separate steps. Nothing is removed until you confirm.
• Mail moved to Trash is normally recoverable for up to 30 days unless permanently removed sooner. The extension does not empty Trash and does not unsubscribe you, and it offers no one-click Undo guarantee.

PERMISSIONS
• storage — cache scan results on this device.
• tabs — find your open Gmail tab and communicate with its content script.
• mail.google.com host access — read rendered Gmail metadata and use Gmail's own controls for the action you confirm.

The separate optional browser app on the website uses Google OAuth and the Gmail API. It is not the extension's data path.

Privacy policy: https://inbox-cleaner.vercel.app/privacy.html
Guides: https://inbox-cleaner.vercel.app/blog/
Source: https://github.com/iampushpendra/inbox-cleaner
```

Category: Productivity. Language: English.

## Privacy tab preparation

Describe the single purpose as reviewing Gmail senders and moving user-confirmed sender mail to Gmail Trash. The permission explanations above should match the package being submitted. Sender addresses and mailbox metadata are accessed locally; “no network client” must not be presented as “no personal information is accessed.” Use the Developer Dashboard’s current definitions when deciding its disclosure fields; this file does not certify which boxes are already selected or which disclosures the published listing currently makes.

The current package declares `storage`, `tabs` and `https://mail.google.com/*`. It does not declare an OAuth identity permission or a background service worker. Recheck the actual release package rather than assuming that an existing zip matches current source.

## Evidence still required before submission

- Compare every packaged file to the intended source and inspect the manifest version and permissions. Existing versioned archives may predate copy changes; no archive is certified here.
- Confirm the installed store version and listing copy in the authenticated Developer Dashboard.
- Run a disposable-mailbox walkthrough covering discovery, estimates, sender-wide scope, archived matches, batched Trash and recovery. Repository fixtures are not a live Gmail test.
- Capture screenshots of the real installed UI, including qualified counts and the confirmation. No screenshots or testimonials have been fabricated. Suggested store screenshot sizes: 1280×800 or 640×400; verify current dashboard requirements before uploading.
- Check the privacy URL’s live reachability, store permission declarations, release approval and actual publication separately.

No submission date, review-time promise, installed behavior, benchmark, rating, user count or store-console state has been inferred from local tests.
