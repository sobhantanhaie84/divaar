/**
 * Small, dependency-free helpers shared across the app.
 * Everything here is pure so it can be unit-tested outside the browser.
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Convert every latin digit in `value` to its Persian counterpart. */
export function toFa(value) {
  return String(value ?? '').replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * Human friendly price label.
 * - `null`/`undefined` -> «نامشخص»
 * - `0`               -> «توافقی» (negotiable listings)
 */
export function formatPrice(toman) {
  if (toman === null || toman === undefined || Number.isNaN(toman)) return 'نامشخص';
  if (toman === 0) return 'توافقی';
  const grouped = Math.round(toman)
    .toLocaleString('en-US')
    .replace(/,/g, '٬');
  return `${toFa(grouped)} تومان`;
}

/** Escape user supplied strings before they reach innerHTML. */
export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Trailing debounce; keeps the returned function's `this`/args. */
export function debounce(fn, wait = 250) {
  let timer = null;
  function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

/** Persian calendar date, e.g. «۲ آبان». */
export function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(date);
}

/** Clamp a number into [min, max]. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
