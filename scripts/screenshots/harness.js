// Renders the real popup UI outside the extension, for store/landing screenshots.
// Defines a chrome API stub BEFORE popup.js runs, then drives UI state AFTER it boots.
// NOTE: this proves how the UI looks, NOT that the extension works. Live Gmail
// verification is a separate, human-only task.

const DAY = 864e5;
const DEMO_SENDERS = [
  { name: 'LinkedIn',       email: 'messages-noreply@linkedin.com',  count: 342, latest: Date.now() - 1 * DAY,  categories: ['SOCIAL'] },
  { name: 'Medium Daily',   email: 'noreply@medium.com',             count: 216, latest: Date.now() - 2 * DAY,  categories: ['UPDATES'] },
  { name: 'Uber Receipts',  email: 'receipts@uber.com',              count: 189, latest: Date.now() - 3 * DAY,  categories: ['UPDATES'] },
  { name: 'Amazon',         email: 'shipment-tracking@amazon.com',   count: 154, latest: Date.now() - 4 * DAY,  categories: ['UPDATES', 'PROMOTIONS'] },
  { name: 'Quora Digest',   email: 'english-digest@quora.com',       count: 98,  latest: Date.now() - 5 * DAY,  categories: ['SOCIAL'] },
  { name: 'Coursera',       email: 'no-reply@coursera.org',          count: 74,  latest: Date.now() - 8 * DAY,  categories: ['PROMOTIONS'] },
  { name: 'Slack',          email: 'feedback@slack.com',             count: 61,  latest: Date.now() - 11 * DAY, categories: ['UPDATES'] },
  { name: 'Product Hunt',   email: 'hello@producthunt.com',          count: 47,  latest: Date.now() - 15 * DAY, categories: ['PROMOTIONS'] },
  { name: 'GitHub',         email: 'noreply@github.com',             count: 38,  latest: Date.now() - 21 * DAY, categories: ['FORUMS', 'UPDATES'] },
  { name: 'Notion',         email: 'team@makenotion.com',            count: 22,  latest: Date.now() - 30 * DAY, categories: ['PRIMARY'] },
];

const DEMO_TOTAL = DEMO_SENDERS.reduce((sum, s) => sum + s.count, 0); // 1241

self.chrome = {
  storage: {
    local: {
      get(key) {
        return Promise.resolve({
          inboxCleanerData: {
            senders: DEMO_SENDERS,
            scannedAt: Date.now() - 6 * 60e3,
            total: DEMO_TOTAL,
          },
        });
      },
      set() { return Promise.resolve(); },
    },
  },
  tabs: {
    query() { return Promise.resolve([{ id: 1, active: true, url: 'https://mail.google.com/mail/u/0/' }]); },
    sendMessage(tabId, payload, respond) {
      if (payload.type === 'GET_SCAN_STATE') {
        respond({ ok: true, scanState: { status: 'idle', category: 0, total: 5, error: null } });
      } else {
        respond({ ok: true });
      }
    },
  },
  runtime: {
    lastError: null,
    onMessage: { addListener() {} },
    sendMessage() { return Promise.resolve(); },
  },
};

function clickRows(n) {
  const rows = [...document.querySelectorAll('#sender-list .row')].slice(0, n);
  rows.forEach(row => row.querySelector('input[type=checkbox]').click());
}

const STATES = {
  'ranked-list': () => {},
  'search-sort': () => {
    const search = document.getElementById('search');
    search.value = 'e';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  },
  'selection': () => clickRows(3),
  'confirm': () => {
    clickRows(3);
    document.getElementById('btn-delete').click();
  },
};

const state = new URLSearchParams(location.search).get('state') || 'ranked-list';
setTimeout(() => (STATES[state] || STATES['ranked-list'])(), 400);
