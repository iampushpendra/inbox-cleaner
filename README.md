# Inbox Cleaner — Chrome Extension

See who's filling your Gmail across every category. Select senders and delete all their emails in one click.

---

## One-time setup (takes ~5 minutes)

### 1 · Enable the Gmail API

1. Go to **console.cloud.google.com** → your project `clever-airship-439516-k1`
2. APIs & Services → Library → search **Gmail API** → **Enable**

### 2 · Create a Chrome Extension OAuth client

> You already have a Desktop app client. You need a separate one for Chrome extensions.

1. APIs & Services → **Credentials** → Create Credentials → **OAuth 2.0 Client ID**
2. Application type: **Chrome Extension**
3. Name: `Inbox Cleaner`
4. **Item ID** field: paste your extension ID (get it in step 4, then come back)
5. Click **Create** → copy the `client_id` (looks like `122732831058-xxxx.apps.googleusercontent.com`)

### 3 · Put the client_id in manifest.json

Open `manifest.json` and replace the placeholder:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
  ...
}
```

### 4 · Load the extension in Chrome

1. Open `chrome://extensions`
2. Toggle **Developer mode** ON (top right)
3. Click **Load unpacked** → select this `inbox-cleaner` folder
4. Copy the **Extension ID** shown under the extension name
5. Go back to step 2 and paste it into the OAuth client's Item ID field, then save

### 5 · Add yourself as a test user

APIs & Services → **OAuth consent screen** → **Test users** → Add your Gmail address.

### 6 · Reload the extension

In `chrome://extensions`, click the refresh icon on Inbox Cleaner. You're done.

---

## Usage

Click the 📥 icon in your toolbar.

- **First run** → click **Scan my inbox**. Chrome asks for Gmail permission — approve it.
- Scanning takes **1–3 minutes** for large inboxes. Results are cached; reopening is instant.
- **Filter** by name or email with the search bar.
- **Sort** by most emails, name A→Z, or most recent.
- **Check** one or more senders → **Delete all** → confirm.
- Click **↺** to re-scan after deleting.

---

## Privacy

- Everything runs locally in your browser.
- No data is sent anywhere except to Google's Gmail API on your behalf.
- Scans read metadata only (From + Date headers) — no email content is ever read.
- Deletes use `messages.batchDelete` which moves emails to Trash; Gmail auto-purges Trash after 30 days.

---

## Folder structure

```
inbox-cleaner/
  manifest.json       Chrome extension config
  background.js       Service worker — Gmail API + OAuth
  popup.html          Extension popup UI
  popup.css           Styles (dark-mode aware)
  popup.js            UI logic + message passing
  generate_icons.py   Script to regenerate icons (needs Pillow)
  icons/
    icon16.png
    icon48.png
    icon128.png
```
