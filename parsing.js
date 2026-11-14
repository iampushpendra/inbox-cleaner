// parsing.js — pure Gmail-row and cleanup-contract logic, shared between
// content.js/popup.js (plain scripts) and this repo's Node tests (require()).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InboxCleanerParsing = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  function parseSenderFromAttrs({ emailAttr, nameAttr }) {
    const email = (emailAttr || '').trim().toLowerCase();
    const name = (nameAttr || '').trim() || email.split('@')[0] || 'Unknown';
    return { name, email };
  }

  function parseDateFromTitle(titleAttr) {
    if (!titleAttr) return 0;
    const ts = Date.parse(titleAttr);
    return Number.isNaN(ts) ? 0 : ts;
  }

  function dedupeRowsByThreadId(rows) {
    const seen = new Set();
    const result = [];
    for (const row of rows) {
      if (!row.threadId || seen.has(row.threadId)) continue;
      seen.add(row.threadId);
      result.push(row);
    }
    return result;
  }

  // ── Address normalization ───────────────────────────────────────────────────

  const ADDRESS_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

  function normalizeAddress(value) {
    const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return ADDRESS_RE.test(email) ? email : '';
  }

  function normalizeAddresses(list) {
    const seen = new Set();
    const result = [];
    for (const raw of Array.isArray(list) ? list : []) {
      const email = normalizeAddress(raw);
      if (!email || seen.has(email)) continue;
      seen.add(email);
      result.push(email);
    }
    return result;
  }

  // Chunks are disjoint because the caller list is normalized and deduped here.
  // The action total may only be summed across chunks when this holds (C-8a).
  function buildFromQueries(emails, chunkSize = 20) {
    const valid = normalizeAddresses(emails);
    const queries = [];
    for (let i = 0; i < valid.length; i += chunkSize) {
      queries.push(`from:(${valid.slice(i, i + chunkSize).join(' OR ')})`);
    }
    return queries;
  }

  // ── Cleanup policy (C-16, C-17, C-18) ───────────────────────────────────────

  function mergeCategoryResults(accumulator, category, rows) {
    for (const row of rows) {
      if (!row.email) continue;
      const key = row.email;
      if (!accumulator[key]) {
        accumulator[key] = { name: row.name, email: row.email, count: 0, latest: 0, categories: [] };
      }
      const entry = accumulator[key];
      entry.count += 1;
      if (row.dateTs > entry.latest) entry.latest = row.dateTs;
      if (!entry.categories.includes(category)) entry.categories.push(category);
    }
    return accumulator;
  }

  function finalizeSenders(accumulator) {
    return Object.values(accumulator).sort((a, b) => b.count - a.count);
  }

  const ACTIONS = {
    trash: { id: 'trash', label: 'Move to Trash', toolbarLabel: 'Delete' },
    archive: { id: 'archive', label: 'Archive', toolbarLabel: 'Archive' },
  };

  // Only a real calendar date is accepted. Gmail's `before:` takes YYYY/MM/DD.
  function normalizeDateInput(value) {
    const match = String(value || '').trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (!match) return '';
    const [, y, m, d] = match;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (date.getUTCFullYear() !== Number(y) ||
        date.getUTCMonth() !== Number(m) - 1 ||
        date.getUTCDate() !== Number(d)) return '';
    return `${y}/${m}/${d}`;
  }

  function formatDateInput(value) {
    const normalized = normalizeDateInput(value);
    if (!normalized) return '';
    const [y, m, d] = normalized.split('/');
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
  }

  function dateYearsAgo(years, now = Date.now()) {
    const date = new Date(now);
    date.setUTCFullYear(date.getUTCFullYear() - years);
    return date.toISOString().slice(0, 10);
  }

  function normalizePolicy(input = {}) {
    const protect = input.protect || {};
    return {
      action: input.action === 'archive' ? 'archive' : 'trash',
      emails: normalizeAddresses(input.emails),
      protect: {
        starred: protect.starred !== false,
        important: protect.important !== false,
        unread: protect.unread === true,
      },
      before: normalizeDateInput(input.before),
      chunkSize: 20,
    };
  }

  function policyOperators(policy) {
    const p = normalizePolicy(policy);
    const operators = [];
    // Archive is an Inbox-only action, so archived matches must not inflate it.
    if (p.action === 'archive') operators.push('in:inbox');
    // Mail already in Trash is not part of a new cleanup and must not inflate it.
    operators.push('-in:trash');
    if (p.protect.starred) operators.push('-is:starred');
    if (p.protect.important) operators.push('-is:important');
    if (p.protect.unread) operators.push('-is:unread');
    if (p.before) operators.push(`before:${p.before}`);
    return operators;
  }

  function buildPolicyQuery(policy, emails) {
    const p = normalizePolicy(policy);
    const list = normalizeAddresses(emails === undefined ? p.emails : emails);
    if (!list.length) return '';
    const operators = policyOperators(p);
    return `from:(${list.join(' OR ')})${operators.length ? ' ' + operators.join(' ') : ''}`;
  }

  // One chunk object is the single source for preview, count and action (C-18).
  function buildPolicyChunks(policy) {
    const p = normalizePolicy(policy);
    const chunks = [];
    for (let i = 0; i < p.emails.length; i += p.chunkSize) {
      const emails = p.emails.slice(i, i + p.chunkSize);
      chunks.push({ emails, query: buildPolicyQuery(p, emails) });
    }
    return chunks;
  }

  function describePolicy(policy) {
    const p = normalizePolicy(policy);
    const parts = [];
    parts.push(p.action === 'archive'
      ? 'Archive removes these conversations from Inbox; they stay searchable.'
      : 'Move to Trash; Gmail removes Trash contents after 30 days.');
    parts.push(p.action === 'archive'
      ? 'Only conversations currently in Inbox are affected.'
      : 'Archived mail is included; mail already in Trash is excluded.');
    const protections = [];
    if (p.protect.starred) protections.push('starred');
    if (p.protect.important) protections.push('important');
    if (p.protect.unread) protections.push('unread');
    if (protections.length) {
      parts.push(`Keeping conversations containing ${protections.join(', ')} mail.`);
    }
    if (p.before) parts.push(`Only mail before ${formatDateInput(p.before)}.`);
    if (p.action === 'trash') parts.push('Storage is not freed until Trash is emptied.');
    return parts;
  }

  // ── Result ranges and counts ────────────────────────────────────────────────

  const RESULT_RANGE_RE = /([\d,]+)\s*[-\u2013\u2014]\s*([\d,]+)\s+of\s+(many|[\d,]+)/i;

  function toInt(text) {
    return parseInt(String(text).replace(/[^\d]/g, ''), 10);
  }

  function parseResultRange(text) {
    if (!text) return null;
    const match = String(text).replace(/\u00a0/g, ' ').match(RESULT_RANGE_RE);
    if (!match) return null;
    const estimated = /many/i.test(match[3]);
    return {
      start: toInt(match[1]),
      end: toInt(match[2]),
      total: estimated ? null : toInt(match[3]),
      estimated,
    };
  }

  function hasMorePages(range) {
    if (!range) return false;
    if (range.estimated) return true;
    return range.end < range.total;
  }

  function buildSenderQuery(email) {
    return `from:(${normalizeAddress(email)})`;
  }

  function applyExactCounts(senders, exactCounts) {
    return senders
      .map(sender => {
        const total = exactCounts ? exactCounts[sender.email] : null;
        const exact = typeof total === 'number' && Number.isFinite(total);
        return {
          ...sender,
          count: exact ? total : sender.count,
          sampledCount: sender.count,
          exact,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  // Four confidence levels from the cleanup contract (C-9 … C-15). A count that
  // Gmail did not return for its own query stays unknown; it is never relabelled
  // exact because a number from a different scope was on screen.
  function applyCountResults(senders, results) {
    return senders
      .map(sender => {
        const result = results ? results[sender.email] : null;
        if (result && result.status === 'exact' && Number.isFinite(result.total)) {
          return { ...sender, count: result.total, sampledCount: sender.count, exact: true, confidence: 'exact' };
        }
        if (result) {
          return {
            ...sender, count: sender.count, sampledCount: sender.sampledCount ?? sender.count,
            exact: false, confidence: 'unknown',
          };
        }
        return {
          ...sender, count: sender.count, sampledCount: sender.sampledCount ?? sender.count,
          exact: false, confidence: 'sampled',
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  function confidenceOf(sender) {
    if (sender.confidence) return sender.confidence;
    return sender.exact ? 'exact' : 'sampled';
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('en-US');
  }

  function formatCount(count, confidence, unit = 'conversations') {
    if (confidence === 'exact') return `${formatNumber(count)} ${unit}`;
    if (confidence === 'unknown') return 'total unknown';
    if (confidence === 'unverified') return 'could not be verified';
    return `≈${formatNumber(count)} ${unit}`;
  }

  // The review/action summary. A per-sender sum is an upper bound, never the
  // destructive total; only a union counter may supply the total (C-7, C-12).
  function summarizeSelection({ senders = [], union = null } = {}) {
    const levels = { exact: 0, sampled: 0, unknown: 0, unverified: 0 };
    let senderSum = 0;
    for (const sender of senders) {
      levels[confidenceOf(sender)] += 1;
      senderSum += Number(sender.count) || 0;
    }
    const confidence = union && union.status ? union.status : 'unverified';
    const total = confidence === 'exact' && Number.isFinite(union.total) ? union.total : null;
    const upperBound = total === null && union && Number.isFinite(union.upperBound)
      ? union.upperBound
      : null;
    const breakdown = ['exact', 'sampled', 'unknown', 'unverified']
      .filter(level => levels[level] > 0)
      .map(level => `${levels[level]} ${level}`)
      .join(', ');
    return {
      senders: senders.length,
      senderSum,
      breakdown,
      confidence,
      total,
      upperBound,
      unit: 'conversations',
      reason: union && union.reason ? union.reason : '',
    };
  }

  function formatSelectionSummary(summary) {
    const senderWord = summary.senders === 1 ? 'sender' : 'senders';
    if (summary.total !== null) {
      return `${summary.senders} ${senderWord} · ${formatNumber(summary.total)} conversations`;
    }
    if (summary.upperBound !== null && summary.upperBound !== undefined) {
      return `${summary.senders} ${senderWord} · up to ${formatNumber(summary.upperBound)} conversations (summed across batches)`;
    }
    const reason = summary.reason ? ` (${summary.reason})` : '';
    return `${summary.senders} ${senderWord} · total unknown${reason}`;
  }

  function formatUpperBound(summary) {
    const senderWord = summary.senders === 1 ? 'sender' : 'senders';
    return `${summary.senders} ${senderWord} · up to ${formatNumber(summary.senderSum)} conversations` +
      ' (sum of sender counts; threads can match several senders)';
  }

  function reviewLines({ accountKey, policy, summary, senders }) {
    const p = normalizePolicy(policy);
    const action = ACTIONS[p.action];
    const lines = [
      `Account: ${accountKey}`,
      `Action: ${action.label}`,
      `Senders (${normalizeAddresses(senders).length}): ${normalizeAddresses(senders).join(', ')}`,
      `Scope: mail from these senders. ${describePolicy(p).join(' ')}`,
      summary.total !== null
        ? `Total: ${formatNumber(summary.total)} conversations — Gmail's count for this exact search.`
        : summary.upperBound !== null && summary.upperBound !== undefined
          ? `Total: up to ${formatNumber(summary.upperBound)} conversations — summed from Gmail's exact per-batch counts; a conversation can match more than one batch.`
          : `Total: unknown${summary.reason ? ` — ${summary.reason}` : ''}. The sender scope is still exact.`,
      summary.breakdown ? `Sender counts: ${summary.breakdown}.` : '',
    ];
    return lines.filter(Boolean);
  }

  function receiptStatus(chunks) {
    if (!chunks.length) return 'failed';
    const attempted = chunks.filter(chunk => chunk.outcome !== 'not-attempted');
    if (!attempted.length) return 'cancelled';
    if (attempted.some(chunk => chunk.outcome === 'unknown')) {
      return attempted.some(chunk => chunk.outcome === 'verified') ? 'partial' : 'unknown';
    }
    if (attempted.some(chunk => chunk.outcome === 'failed')) {
      return attempted.some(chunk => chunk.outcome === 'verified') ? 'partial' : 'failed';
    }
    return attempted.length === chunks.length ? 'completed' : 'partial';
  }

  function receiptLines(receipt) {
    const action = ACTIONS[receipt.action] || ACTIONS.trash;
    const chunks = receipt.chunks || [];
    const verified = chunks.filter(chunk => chunk.outcome === 'verified').length;
    const unknown = chunks.filter(chunk => chunk.outcome === 'unknown').length;
    const failed = chunks.filter(chunk => chunk.outcome === 'failed').length;
    const skipped = chunks.filter(chunk => chunk.outcome === 'not-attempted').length;
    const lines = [];
    if (receipt.status === 'completed') {
      lines.push(receipt.total !== null && receipt.total !== undefined
        ? `${action.label === 'Archive' ? 'Archived' : 'Moved to Trash'} ${formatNumber(receipt.total)} conversations.`
        : `${action.label === 'Archive' ? 'Archived' : 'Moved to Trash'} mail from ${verified} batch${verified === 1 ? '' : 'es'}.`);
    } else if (receipt.status === 'partial') {
      lines.push(`Partly completed: ${verified} batch${verified === 1 ? '' : 'es'} verified` +
        `${unknown ? `, ${unknown} unknown` : ''}${failed ? `, ${failed} failed` : ''}.`);
    } else if (receipt.status === 'cancelled') {
      lines.push(`Stopped: ${verified} batch${verified === 1 ? '' : 'es'} verified before stopping.`);
    } else if (receipt.status === 'unknown') {
      lines.push('No batch could be verified. Some mail may have moved; review Trash before retrying.');
    } else {
      lines.push('Cleanup failed before Gmail confirmed an outcome.');
    }
    if (skipped) lines.push(`${skipped} batch${skipped === 1 ? '' : 'es'} not attempted.`);
    lines.push(`Account: ${receipt.accountKey}. Action: ${action.label}.`);
    if (receipt.total === null || receipt.total === undefined) {
      lines.push('Gmail did not give an exact total, so no moved-conversation total is claimed.');
    }
    lines.push(action.id === 'trash'
      ? 'Gmail removes Trash contents after 30 days; storage is not freed until then.'
      : 'Archived mail stays searchable and does not free storage.');
    return lines;
  }

  // ── Account identity ───────────────────────────────────────────────────────

  const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

  function extractAddresses(texts) {
    const found = new Set();
    for (const text of Array.isArray(texts) ? texts : []) {
      const matches = String(text || '').match(EMAIL_RE) || [];
      for (const match of matches) {
        const email = normalizeAddress(match);
        if (email) found.add(email);
      }
    }
    return [...found];
  }

  function uIndexFromPath(pathname) {
    const match = String(pathname || '').match(/\/mail\/u\/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function chooseIdentity({ texts, pathname, documentId, source }) {
    const accounts = extractAddresses(texts);
    return {
      accountKey: accounts.length === 1 ? accounts[0] : null,
      ambiguous: accounts.length > 1,
      uIndex: uIndexFromPath(pathname),
      source: accounts.length === 1 ? (source || 'avatar') : 'unknown',
      documentId,
    };
  }

  function buildGmailSearchUrl(uIndex, query) {
    const index = Number.isInteger(uIndex) ? uIndex : 0;
    return `https://mail.google.com/mail/u/${index}/#search/${encodeURIComponent(query || '')}`;
  }

  function buildGmailTrashUrl(uIndex) {
    const index = Number.isInteger(uIndex) ? uIndex : 0;
    return `https://mail.google.com/mail/u/${index}/#trash`;
  }

  // ── Local storage containers ───────────────────────────────────────────────

  function migrateContainer(raw) {
    if (raw && raw.version === 2 && raw.accounts && typeof raw.accounts === 'object') {
      return { version: 2, accounts: raw.accounts, legacyUnbound: raw.legacyUnbound || null };
    }
    if (raw && Array.isArray(raw.senders)) {
      return {
        version: 2,
        accounts: {},
        legacyUnbound: {
          ...raw,
          accountKey: null,
          viewOnly: true,
          reason: 'legacy-unbound',
          unit: 'conversations',
        },
      };
    }
    return { version: 2, accounts: {}, legacyUnbound: null };
  }

  function accountSnapshot(container, accountKey) {
    const box = migrateContainer(container);
    return accountKey && box.accounts[accountKey] ? box.accounts[accountKey] : null;
  }

  function putAccountSnapshot(container, accountKey, snapshot) {
    const box = migrateContainer(container);
    box.accounts = { ...box.accounts, [accountKey]: snapshot };
    return box;
  }

  // Only a complete, bound, non-view-only snapshot may be acted on (C-20–C-23).
  function isActionableSnapshot(snapshot, accountKey) {
    return Boolean(
      snapshot &&
      accountKey &&
      snapshot.accountKey === accountKey &&
      snapshot.viewOnly !== true &&
      snapshot.partial !== true &&
      !snapshot.legacyUnbound &&
      Number.isFinite(snapshot.scannedAt) &&
      snapshot.unit === 'conversations' &&
      typeof snapshot.discoveryScope === 'string' &&
      snapshot.discoveryScope.length > 0 &&
      Array.isArray(snapshot.senders)
    );
  }

  function appendHistory(history, entry, limit = 20) {
    const box = history && history.version === 1 && Array.isArray(history.entries)
      ? history
      : { version: 1, entries: [] };
    return { version: 1, entries: [entry, ...box.entries].slice(0, limit) };
  }

  return {
    parseSenderFromAttrs,
    parseDateFromTitle,
    dedupeRowsByThreadId,
    buildFromQueries,
    mergeCategoryResults,
    finalizeSenders,
    parseResultRange,
    hasMorePages,
    buildSenderQuery,
    applyExactCounts,

    normalizeAddress,
    normalizeAddresses,
    ACTIONS,
    normalizeDateInput,
    formatDateInput,
    dateYearsAgo,
    normalizePolicy,
    policyOperators,
    buildPolicyQuery,
    buildPolicyChunks,
    describePolicy,
    applyCountResults,
    confidenceOf,
    formatNumber,
    formatCount,
    summarizeSelection,
    formatSelectionSummary,
    formatUpperBound,
    reviewLines,
    receiptStatus,
    receiptLines,
    extractAddresses,
    uIndexFromPath,
    chooseIdentity,
    buildGmailSearchUrl,
    buildGmailTrashUrl,
    migrateContainer,
    accountSnapshot,
    putAccountSnapshot,
    isActionableSnapshot,
    appendHistory,
  };
});
