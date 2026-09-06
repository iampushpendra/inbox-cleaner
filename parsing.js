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

  return {
    parseSenderFromAttrs,
    parseDateFromTitle,
    dedupeRowsByThreadId,
    buildFromQueries,
    mergeCategoryResults,
    finalizeSenders,
  };
});
