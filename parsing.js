// parsing.js — pure Gmail-row parsing logic, shared between content.js
// (loaded as a plain content script) and this repo's Node tests (loaded
// via require()).
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

  function buildFromQueries(emails, chunkSize = 20) {
    const valid = emails.filter(e => e && e.includes('@'));
    const queries = [];
    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize);
      queries.push(`from:(${chunk.join(' OR ')})`);
    }
    return queries;
  }

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

  // Gmail's result-count indicator, e.g. "1-100 of 12,847". The separator is
  // normally an en dash but Gmail is inconsistent across locales, and large or
  // approximate result sets render as "of many" instead of a number.
  const RESULT_RANGE_RE = /([\d,]+)\s*[-\u2013\u2014]\s*([\d,]+)\s+of\s+(many|[\d,]+)/i;

  // Strips any digit grouping (Western "12,847" and Indian "1,00,000" alike).
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

  // An unparseable range means "stop" -- better to under-scan than to loop
  // forever clicking Older against a page we no longer understand.
  function hasMorePages(range) {
    if (!range) return false;
    if (range.estimated) return true;
    return range.end < range.total;
  }

  function buildSenderQuery(email) {
    return `from:(${String(email || '').trim().toLowerCase()})`;
  }

  // Phase B: swap each sender's page-sampled count for the exact All Mail total
  // read off Gmail's own result counter, keeping the sample for diagnostics.
  // A sender whose count could not be resolved keeps its sample and is flagged
  // inexact so the UI can say so rather than quietly overstating precision.
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
  };
});
