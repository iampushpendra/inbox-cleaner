/* Manual, in-memory guidance only. This script has no account or network access. */
(function () {
  'use strict';
  function diagnose(input = {}) {
    const values = {};
    const errors = [];
    for (const key of ['gmail', 'drive', 'photos', 'quota']) {
      const raw = input[key];
      if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
        values[key] = null;
      } else if (!['number', 'string'].includes(typeof raw) || !Number.isFinite(Number(raw)) || Number(raw) < 0 || (key === 'quota' && Number(raw) === 0)) {
        errors.push(`${key === 'quota' ? 'Storage limit' : key[0].toUpperCase() + key.slice(1)} must be a finite ${key === 'quota' ? 'positive' : 'non-negative'} number in GB, or blank if unknown.`);
      } else {
        values[key] = Number(raw);
      }
    }
    if (errors.length) return { status: 'invalid', errors, total: null, dominant: null, notes: [], steps: [] };
    const services = ['gmail', 'drive', 'photos'];
    const complete = services.every(key => values[key] !== null);
    const known = services.filter(key => values[key] !== null);
    const subtotal = known.reduce((sum, key) => sum + values[key], 0);
    if (!Number.isFinite(subtotal)) return { status: 'invalid', errors: ['The entered usage total is too large. Recheck the GB figures.'], total: null, dominant: null, notes: [], steps: [] };
    const total = complete ? subtotal : null;
    const status = values.quota === null ? 'unknown' : subtotal >= values.quota ? 'full' : complete ? 'below' : 'unknown';
    const max = complete ? Math.max(...services.map(key => values[key])) : 0;
    const largest = services.filter(key => values[key] === max);
    const dominant = complete && max > 0 && largest.length === 1 ? largest[0] : null;
    const notes = [];
    if (!complete) notes.push('Blank usage is unknown, not zero. The entered subtotal cannot establish available space.');
    if (values.quota === null) notes.push('Your storage limit is unknown. Confirm it in Google; paid, family and work accounts can differ from the personal-account default.');
    if (values.quota !== null && subtotal > values.quota) notes.push('Entered usage exceeds the limit. This can be a real over-quota account; also check units, account and reporting date.');
    if (complete) notes.push('This is the sum you entered, not a live Google total. Other storage or shared-plan usage may be missing, and rounded figures may differ.');
    const steps = ['Open Google’s storage breakdown in the correct account and compare its total and limit with these figures. For a work or school account, ask your administrator about your quota.'];
    if (input.symptom === 'receive') steps.push(status === 'below' ? 'This entered breakdown does not establish that storage is causing your receiving problem. Check Google’s live meter and Gmail’s official receiving-help steps before deleting anything.' : 'A full Google account can block incoming mail; messages can be returned to senders. Confirm the live quota first. Once receiving works, ask affected senders to resend.');
    if (input.symptom === 'trash') steps.push('Mail moved to Gmail Trash still counts toward storage. Review it and recover anything needed before choosing Delete forever; do not empty it blindly.');
    if (input.symptom === 'recent') steps.push('After a large deletion, Google says the meter can take 48–72 hours to update. Avoid repeated permanent deletions based only on an unchanged meter; recheck the same account and the Trash state. If the delay persists, use Google’s help options.');
    if (dominant === 'gmail') steps.push('Gmail is the largest of the three entered services. Review large attachments with Gmail search before choosing messages to remove. Message counts alone do not measure storage.');
    else if (dominant === 'drive') steps.push('Drive is the largest of the three entered services. Review files you own in Drive’s Storage view, starting with large files; keep a verified copy of anything you need.');
    else if (dominant === 'photos') steps.push('Photos is the largest of the three entered services. Review Google Photos storage suggestions and download anything you need before removal. Check how deletion affects synced devices.');
    else steps.push('No single largest service is established. Use Google’s full breakdown rather than assuming Gmail is responsible.');
    if (status === 'below') steps.push('Your entered three-service sum is below the entered limit. Inbox clutter alone does not prove a quota problem. Verify the live total, including any other usage.');
    if (status === 'full') steps.push('The entered usage reaches the entered limit. Review unwanted items across the largest services, preserve needed data, or consider more storage. This tool cannot predict how much space cleanup will free.');
    return { status, errors, total, subtotal, dominant, notes, steps };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { diagnose };
  if (typeof document === 'undefined') return;
  const form = document.getElementById('storage-form');
  if (!form) return;
  const result = document.getElementById('storage-result');
  const titles = { invalid: 'Check your entries', unknown: 'Check the live breakdown first', full: 'Entered usage reaches the entered limit', below: 'Entered usage is below the entered limit' };
  function list(items) {
    const ul = document.createElement('ul');
    for (const text of items) { const li = document.createElement('li'); li.textContent = text; ul.append(li); }
    return ul;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = {};
    for (const name of ['gmail', 'drive', 'photos', 'quota', 'symptom']) input[name] = form.elements[name].value;
    const advice = diagnose(input);
    result.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = titles[advice.status]; result.append(heading);
    if (advice.total !== null) { const p = document.createElement('p'); p.textContent = `Entered Gmail + Drive + Photos: ${Number(advice.total.toFixed(3))} GB.`; result.append(p); }
    result.append(list(advice.status === 'invalid' ? advice.errors : advice.steps));
    if (advice.notes.length) result.append(list(advice.notes));
    result.hidden = false;
    result.focus();
  });
  form.addEventListener('reset', () => { result.hidden = true; result.replaceChildren(); });
})();
