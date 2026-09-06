// parsing.js — pure Gmail-row parsing logic, shared between content.js
// (loaded as a plain content script) and this repo's Node tests (loaded
// via require()). Filled in by Task 2.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InboxCleanerParsing = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  return {};
});
