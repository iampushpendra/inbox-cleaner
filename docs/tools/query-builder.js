/* Runs locally. No storage, analytics, URL state, or mailbox access. */
(function (root) {
  'use strict';
  const categories = ['primary', 'social', 'promotions', 'updates', 'forums', 'reservations', 'purchases'];
  const integer = (value, max) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= max;
  const valueOf = value => String(value == null ? '' : value).trim();
  function validDate(value, separator) {
    const escaped = separator === '/' ? '\\/' : '-';
    if (!new RegExp('^\\d{4}' + escaped + '\\d{2}' + escaped + '\\d{2}$').test(value)) return false;
    const [year, month, day] = value.split(separator).map(Number);
    if (year < 1900 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
    return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
  }
  function buildQuery(input) {
    const errors = [], parts = [];
    const sender = valueOf(input.sender), category = valueOf(input.category);
    const ageMode = valueOf(input.ageMode) || 'none';
    if (sender) {
      // Deliberately accept a simple single email address, never query syntax.
      if (!/^[a-z0-9_%+.-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(sender) || sender.includes('..') || sender.startsWith('.') || sender.includes('.@')) errors.push('Enter one simple sender email address, without spaces or search operators.');
      else parts.push('from:' + sender);
    }
    if (category) {
      if (!categories.includes(category)) errors.push('Choose a listed Gmail category.');
      else parts.push('category:' + category);
    }
    if (!['none', 'relative', 'fixed'].includes(ageMode)) errors.push('Choose an age or date mode.');
    if (ageMode === 'relative') {
      const age = valueOf(input.age), unit = valueOf(input.ageUnit);
      if (!integer(age, 9999) || !['d', 'm', 'y'].includes(unit)) errors.push('Use a whole age from 1 to 9,999 with days, months, or years.');
      else parts.push('older_than:' + Number(age) + unit);
    }
    if (ageMode === 'fixed') {
      const after = valueOf(input.after), before = valueOf(input.before);
      if (!after && !before) errors.push('Enter at least one fixed date.');
      for (const [name, value] of [['after', after], ['before', before]]) {
        if (value && !validDate(value, '-')) errors.push('Use a real ' + name + ' date from 1900 to 9999.');
        else if (value) parts.push(name + ':' + value.replaceAll('-', '/'));
      }
      if (after && before && after >= before) errors.push('The after date must be earlier than the before date.');
    }
    const size = valueOf(input.size), sizeUnit = valueOf(input.sizeUnit) || 'M';
    if (size) {
      if (!integer(size, 999999999) || !['M', 'bytes'].includes(sizeUnit)) errors.push('Use a whole size from 1 to 999,999,999 and a listed unit.');
      else parts.push('larger:' + Number(size) + (sizeUnit === 'M' ? 'M' : ''));
    }
    return { query: errors.length ? '' : parts.join(' '), errors };
  }
  function checkQuery(raw) {
    const query = valueOf(raw), errors = [], warnings = [];
    if (!query) errors.push('Add a criterion or enter a query before continuing.');
    if (query.length > 2048) errors.push('Keep the query to 2,048 characters or fewer.');
    // Reject controls and malformed UTF-16 before URI encoding, too.
    if (/[\u0000-\u001f\u007f]/.test(String(raw)) || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(query)) errors.push('Remove control characters or invalid text.');
    let quoted = false, structural = '';
    const stack = [];
    for (const character of query) {
      if (character === '"') { quoted = !quoted; continue; }
      if (quoted) continue;
      structural += character;
      if (character === '(' || character === '{') stack.push(character);
      if (character === ')' || character === '}') {
        if (stack.pop() !== (character === ')' ? '(' : '{')) errors.push('Balance the query parentheses and braces.');
      }
    }
    if (quoted) errors.push('Close the quotation marks.');
    if (stack.length) errors.push('Balance the query parentheses and braces.');
    const tokens = query.match(/(?:[^\s"{}()]+|"[^"]*"|\([^()]*\))+/g) || [];
    if (/(?:\(\s*\)|\{\s*\})/.test(structural)) errors.push('Give each query group a search criterion.');
    if (tokens.includes('""')) errors.push('Give quoted text a search term.');
    const boolean = token => token === 'AND' || token === 'OR';
    if (boolean(tokens[0]) || boolean(tokens[tokens.length - 1]) || tokens.some((token, i) => boolean(token) && boolean(tokens[i + 1]))) errors.push('Place AND or OR between search criteria.');
    const known = new Map();
    let narrowing = false, advanced = /[{}()]|\bOR\b/.test(query);
    for (const token of tokens) {
      if (['AND', 'OR'].includes(token)) { if (token === 'OR') advanced = true; continue; }
      const match = /^(-?)([a-z_]+):(.*)$/i.exec(token);
      if (!match) { if (token) narrowing = true; advanced = true; continue; }
      const [, negative, rawName, value] = match, name = rawName.toLowerCase();
      if (!value || value === '""') { errors.push('Give ' + name + ': a value.'); continue; }
      let validated = true;
      if (name === 'older_than' || name === 'newer_than') {
        const age = /^(\d+)([dmy])$/.exec(value);
        if (!age || !integer(age[1], 9999)) errors.push('Use a whole age from 1 to 9,999 followed by d, m, or y.');
      } else if (['after', 'before', 'older', 'newer'].includes(name)) {
        if (!validDate(value, '/')) errors.push('Use real dates as YYYY/MM/DD (1900–9999) for this checker.');
      } else if (['larger', 'smaller', 'size'].includes(name)) {
        const size = /^(\d+)(M?)$/.exec(value);
        if (!size || !integer(size[1], 999999999)) errors.push('Use a positive whole size, optionally followed by M, for this checker.');
      } else if (name === 'category') {
        if (!categories.includes(value)) errors.push('Use a listed Gmail category.');
      } else if (name === 'is') {
        validated = ['important', 'starred', 'unread', 'read', 'muted'].includes(value);
      } else if (name === 'in') {
        validated = ['anywhere', 'archive', 'snoozed'].includes(value);
      } else if (name !== 'from') validated = false;
      if (!validated) advanced = true;
      if (!negative && !['in', 'is'].includes(name)) narrowing = true;
      if (!known.has(name)) known.set(name, []);
      known.get(name).push({ negative: Boolean(negative), value });
    }
    // Only detect intersections when there are no groups or alternatives; never
    // claim an OR branch is contradictory just because another branch differs.
    if (!/[{}()]|\bOR\b/.test(query)) {
      for (const [name, values] of known) {
        if (values.some(a => values.some(b => a.value === b.value && a.negative !== b.negative))) errors.push('The query both includes and excludes the same ' + name + ' value.');
      }
      const positive = name => (known.get(name) || []).filter(v => !v.negative).map(v => v.value);
      const lowerDates = [...positive('after'), ...positive('newer')].filter(v => validDate(v, '/'));
      const upperDates = [...positive('before'), ...positive('older')].filter(v => validDate(v, '/'));
      if (lowerDates.some(a => upperDates.some(b => a >= b))) errors.push('The date range is empty or reversed.');
      if (new Set(positive('category')).size > 1) errors.push('Multiple categories are combined as an intersection. Choose one or review an explicit OR query in Gmail.');
      for (const [lower, upper, pattern, description] of [
        ['larger', 'smaller', /^(\d+)(M?)$/, 'size'],
        ['older_than', 'newer_than', /^(\d+)([dmy])$/, 'relative age']
      ]) {
        for (const a of positive(lower)) for (const b of positive(upper)) {
          const left = pattern.exec(a), right = pattern.exec(b);
          if (left && right && left[2] === right[2] && Number(left[1]) >= Number(right[1])) errors.push('The ' + description + ' range is empty or reversed.');
          else if (left && right && left[2] !== right[2]) advanced = true;
        }
      }
    }
    if (query && !narrowing) warnings.push('This is a broad search. Add a sender, category, age, date, or size before reviewing results.');
    if (advanced) warnings.push('This edited syntax is not fully checked. Groups, alternatives, free text, mixed units, and other operators need review in Gmail.');
    if (/\bin:anywhere\b/i.test(query)) warnings.push('in:anywhere includes Spam and Trash. Check whether that is the scope you intend.');
    warnings.push('This checker cannot predict Gmail matches or protect entire conversations. Review messages and threads in Gmail before taking any action.');
    return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
  }
  function gmailSearchUrl(query) {
    if (checkQuery(query).errors.length) throw new Error('Resolve query errors before opening Gmail.');
    return 'https://mail.google.com/mail/#search/' + encodeURIComponent(valueOf(query));
  }
  const api = { buildQuery, checkQuery, gmailSearchUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GmailQueryBuilder = api;
  if (typeof document === 'undefined') return;
  const form = document.getElementById('query-form');
  if (!form) return;
  const output = document.getElementById('query-output');
  const errorsList = document.getElementById('query-errors');
  const warningsList = document.getElementById('query-warnings');
  const summary = document.getElementById('check-summary');
  const copy = document.getElementById('copy-query');
  const open = document.getElementById('open-gmail');
  const confirm = document.getElementById('review-confirm');
  const status = document.getElementById('action-status');
  let buildErrors = [];
  function list(element, items) {
    element.replaceChildren(...items.map(message => {
      const item = document.createElement('li'); item.textContent = message; return item;
    }));
    element.hidden = items.length === 0;
  }
  function check() {
    const result = checkQuery(output.value);
    const errors = [...buildErrors, ...result.errors];
    list(errorsList, errors); list(warningsList, result.warnings);
    summary.textContent = errors.length ? 'Resolve ' + errors.length + ' issue' + (errors.length === 1 ? '' : 's') + ' before opening Gmail.' : 'Basic checks finished. Review the cautions below.';
    copy.disabled = Boolean(errors.length);
    open.disabled = Boolean(errors.length) || !confirm.checked;
    return errors.length === 0;
  }
  function ageFields() {
    const mode = form.elements.ageMode.value;
    for (const name of ['relative', 'fixed']) {
      const group = document.getElementById(name + '-fields');
      group.hidden = mode !== name;
      for (const field of group.querySelectorAll('input,select')) field.disabled = mode !== name;
    }
  }
  form.addEventListener('change', ageFields);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const result = buildQuery(Object.fromEntries(new FormData(form)));
    // Keep any manual query intact on invalid criteria, but disable actions.
    if (!result.errors.length) output.value = result.query;
    confirm.checked = false; status.textContent = '';
    buildErrors = result.errors; check(); output.focus();
  });
  output.addEventListener('input', () => { buildErrors = []; confirm.checked = false; status.textContent = ''; check(); });
  confirm.addEventListener('change', () => check());
  document.getElementById('check-query').addEventListener('click', () => check());
  copy.addEventListener('click', async () => {
    if (!check()) return;
    const snapshot = output.value;
    try {
      await navigator.clipboard.writeText(snapshot);
      status.textContent = 'Query copied. Paste it into Gmail and review the results.';
    } catch (_) {
      output.focus(); output.select();
      status.textContent = 'Copy was unavailable. The query is selected; use your device’s Copy command.';
    }
  });
  open.addEventListener('click', () => {
    if (!check() || !confirm.checked) return;
    // Destination is created only during this explicit user action.
    window.open(gmailSearchUrl(output.value), '_blank', 'noopener,noreferrer');
    status.textContent = 'Gmail search requested in a new tab. Verify the active account and results there. If no tab opened, copy the query into Gmail.';
  });
  document.getElementById('clear-tool').addEventListener('click', () => {
    form.reset(); buildErrors = []; output.value = ''; confirm.checked = false; status.textContent = '';
    ageFields(); check(); form.elements.sender.focus();
  });
  ageFields(); check();
})(typeof globalThis !== 'undefined' ? globalThis : this);
