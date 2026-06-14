// background.js — service worker

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1';
const BATCH_URL  = 'https://www.googleapis.com/batch/gmail/v1';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Auth ──────────────────────────────────────────────────────────────────────

function getToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(token);
    });
  });
}

function dropToken(token) {
  return new Promise(r => chrome.identity.removeCachedAuthToken({ token }, r));
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function gGet(token, path, params = {}) {
  const url = new URL(`${GMAIL_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) { await dropToken(token); throw Object.assign(new Error('auth'), { code: 401 }); }
  if (r.status === 403 || r.status === 429) {
    let reason = '';
    try { const j = await r.clone().json(); reason = j?.error?.errors?.[0]?.reason || ''; } catch {}
    if (reason === 'insufficientPermissions' || reason === 'forbidden') {
      throw Object.assign(new Error('Insufficient Gmail permissions.'), { code: 403 });
    }
    throw Object.assign(new Error('rate'), { code: 429 });
  }
  if (!r.ok) throw new Error(`http:${r.status}`);
  return r.json();
}

async function gPost(token, path, body) {
  const r = await fetch(`${GMAIL_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (r.status === 401) { await dropToken(token); throw Object.assign(new Error('auth'), { code: 401 }); }
  if (r.status === 403 || r.status === 429) {
    let reason = '';
    try { const j = await r.clone().json(); reason = j?.error?.errors?.[0]?.reason || ''; } catch {}
    if (reason === 'insufficientPermissions' || reason === 'forbidden') {
      throw Object.assign(new Error('Insufficient Gmail permissions. Please re-install the extension to grant delete access.'), { code: 403 });
    }
    throw Object.assign(new Error('rate'), { code: 429 });
  }
  if (!r.ok) throw new Error(`http:${r.status}`);
  return r.status === 204 ? null : r.json();
}

async function backoff(fn, tries = 8) {
  let delay = 2000;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      if ((e.code === 429 || e.message === 'rate') && i < tries - 1) {
        await sleep(delay);
        delay = Math.min(delay * 2, 60000);
      } else throw e;
    }
  }
}

// ── Multipart batch fetch ─────────────────────────────────────────────────────

function parseFrom(raw = '') {
  const m = raw.match(/"?([^"<]+?)"?\s*<([^>]+)>/);
  if (m) return [m[1].trim(), m[2].trim().toLowerCase()];
  const clean = raw.trim().toLowerCase();
  return [raw.trim(), clean];
}

function parseMultipart(text, boundary) {
  const results = [];
  for (const part of text.split(`--${boundary}`)) {
    const jStart = part.indexOf('{');
    if (jStart === -1) continue;
    let depth = 0, jEnd = -1;
    for (let i = jStart; i < part.length; i++) {
      if (part[i] === '{') depth++;
      else if (part[i] === '}' && --depth === 0) { jEnd = i; break; }
    }
    if (jEnd === -1) continue;
    try { results.push(JSON.parse(part.slice(jStart, jEnd + 1))); } catch {}
  }
  return results;
}

async function batchHeaders(token, ids) {
  const bnd = 'ic_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const body = ids.map(id =>
    `--${bnd}\r\nContent-Type: application/http\r\n\r\n` +
    `GET /gmail/v1/users/me/messages/${id}?format=metadata` +
    `&metadataHeaders=From&metadataHeaders=Date&fields=payload%2Fheaders%2ClabelIds HTTP/1.1\r\n\r\n`
  ).join('') + `--${bnd}--`;

  const r = await fetch(BATCH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/mixed; boundary=${bnd}` },
    body
  });
  if (r.status === 429 || r.status === 403) throw Object.assign(new Error('rate'), { code: 429 });
  if (!r.ok) throw new Error(`batch:${r.status}`);

  const text = await r.text();
  const ct = r.headers.get('Content-Type') || '';
  const m = ct.match(/boundary="?([^";]+)"?/);
  return parseMultipart(text, m ? m[1] : bnd);
}

// ── Scan ──────────────────────────────────────────────────────────────────────

let scanState = { status: 'idle', total: 0, fetched: 0, error: null };

function broadcast(type, data) {
  chrome.runtime.sendMessage({ type, data }).catch(() => {});
}

async function doScan() {
  const token = await getToken();
  scanState = { status: 'listing', total: 0, fetched: 0, error: null };
  broadcast('SCAN_STATE', { ...scanState });

  // Pass 1 — collect all message IDs
  const allIds = [];
  let pageToken = null;
  do {
    const p = { maxResults: '500', fields: 'nextPageToken,messages/id' };
    if (pageToken) p.pageToken = pageToken;
    const res = await backoff(() => gGet(token, '/users/me/messages', p));
    (res.messages || []).forEach(m => allIds.push(m.id));
    pageToken = res.nextPageToken;
    scanState.total = allIds.length;
    broadcast('SCAN_STATE', { ...scanState });
    if (pageToken) await sleep(300);
  } while (pageToken);

  scanState = { status: 'scanning', total: allIds.length, fetched: 0, error: null };
  broadcast('SCAN_STATE', { ...scanState });

  // Pass 2 — batch-fetch headers (100 per batch)
  const senders = {};
  const CHUNK = 100;

  for (let i = 0; i < allIds.length; i += CHUNK) {
    const chunk = allIds.slice(i, i + CHUNK);
    const msgs = await backoff(() => batchHeaders(token, chunk));

    for (const msg of msgs) {
      if (msg.error) continue;
      const hdrs = msg.payload?.headers || [];
      const rawFrom = hdrs.find(h => h.name === 'From')?.value || '';
      const rawDate = hdrs.find(h => h.name === 'Date')?.value || '';
      const [name, email] = parseFrom(rawFrom);
      const cats = (msg.labelIds || [])
        .filter(l => l.startsWith('CATEGORY_'))
        .map(l => l.slice(9));

      if (!senders[email]) senders[email] = { name, email, count: 0, latest: 0, categories: new Set() };
      senders[email].count++;
      const ts = rawDate ? new Date(rawDate).getTime() : 0;
      if (ts > senders[email].latest) senders[email].latest = ts;
      cats.forEach(c => senders[email].categories.add(c));
    }

    scanState.fetched = Math.min(i + CHUNK, allIds.length);
    broadcast('SCAN_STATE', { ...scanState });
    await sleep(600); // stay under 250 quota units/sec (100 msgs × 5 units = 500 per batch)
  }

  const result = Object.values(senders)
    .map(s => ({ ...s, categories: [...s.categories] }))
    .sort((a, b) => b.count - a.count);

  await chrome.storage.local.set({
    inboxCleanerData: { senders: result, scannedAt: Date.now(), total: allIds.length }
  });

  scanState = { status: 'done', total: allIds.length, fetched: allIds.length, error: null };
  broadcast('SCAN_STATE', { ...scanState });
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function doDelete(emails) {
  const token = await getToken();

  for (let si = 0; si < emails.length; si++) {
    const email = emails[si];
    broadcast('DELETE_STATE', { phase: 'searching', email, si, total: emails.length });

    // Find all IDs from this sender
    const ids = [];
    let pageToken = null;
    do {
      const p = { q: `from:${email}`, maxResults: '500', fields: 'nextPageToken,messages/id' };
      if (pageToken) p.pageToken = pageToken;
      const res = await backoff(() => gGet(token, '/users/me/messages', p));
      (res.messages || []).forEach(m => ids.push(m.id));
      pageToken = res.nextPageToken;
    } while (pageToken);

    broadcast('DELETE_STATE', { phase: 'deleting', email, si, total: emails.length, count: ids.length });

    // Batch delete (max 1000 per call)
    for (let i = 0; i < ids.length; i += 1000) {
      await backoff(() => gPost(token, '/users/me/messages/batchDelete', { ids: ids.slice(i, i + 1000) }));
      if (i + 1000 < ids.length) await sleep(500);
    }

    // Remove from cache
    const stored = (await chrome.storage.local.get('inboxCleanerData')).inboxCleanerData;
    if (stored) {
      stored.senders = stored.senders.filter(s => s.email !== email);
      stored.total = Math.max(0, stored.total - ids.length);
      await chrome.storage.local.set({ inboxCleanerData: stored });
    }
  }

  broadcast('DELETE_STATE', { phase: 'done', total: emails.length });
}

// ── Message router ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg.type === 'GET_DATA') {
    chrome.storage.local.get('inboxCleanerData').then(s =>
      respond({ cache: s.inboxCleanerData || null, scanState })
    );
    return true;
  }

  if (msg.type === 'START_SCAN') {
    if (scanState.status === 'scanning' || scanState.status === 'listing') {
      respond({ ok: false, reason: 'already running' });
    } else {
      doScan().catch(e => {
        scanState = { status: 'error', total: 0, fetched: 0, error: e.message };
        broadcast('SCAN_STATE', { ...scanState });
      });
      respond({ ok: true });
    }
    return true;
  }

  if (msg.type === 'DELETE') {
    doDelete(msg.emails).catch(e =>
      broadcast('DELETE_ERROR', e.message)
    );
    respond({ ok: true });
    return true;
  }

  if (msg.type === 'CLEAR_TOKEN') {
    chrome.identity.getAuthToken({ interactive: false }, token => {
      if (token) chrome.identity.removeCachedAuthToken({ token }, () => respond({ ok: true }));
      else respond({ ok: true });
    });
    return true;
  }
});
