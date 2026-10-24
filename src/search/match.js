/**
 * Query matching for Persian text.
 *
 * Persian sellers type the same word in different ways: «آیفون» / «ایفون»,
 * «کتاب» / «كتاب», with or without ZWNJ. Folding both sides before comparing
 * makes the search bar forgiving without pulling in a full-text engine.
 */
import { escapeHtml } from '../utils.js';

const CHAR_VARIANTS = {
  ا: 'اآأإ',
  ی: 'یي',
  ک: 'کك',
  ه: 'هةۀ',
  و: 'وؤ',
};

const CHAR_MAP = {
  ي: 'ی',
  ك: 'ک',
  ة: 'ه',
  ۀ: 'ه',
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ؤ: 'و',
  ئ: 'ی',
};

/** Lowercase, drop diacritics/ZWNJ, fold Arabic letter forms to Persian. */
export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\u200b-\u200f\u2028\u2029]/g, ' ')
    .replace(/[\u064b-\u0652\u0670]/g, '') // harakat & superscript alef
    .replace(/[يكةۀأإآؤئ]/g, (ch) => CHAR_MAP[ch] ?? ch)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a raw query into folded tokens; empty query -> []. */
export function tokenize(query) {
  const normalized = normalizeText(query);
  return normalized ? normalized.split(' ') : [];
}

const HAYSTACK_FIELDS = ['title', 'city', 'category'];

/** Build the folded haystack once per ad (cheap, but cached for reuse). */
function haystackOf(ad) {
  if (ad.__haystack) return ad.__haystack;
  const haystack = normalizeText(HAYSTACK_FIELDS.map((field) => ad[field] ?? '').join(' '));
  Object.defineProperty(ad, '__haystack', { value: haystack, enumerable: false });
  return haystack;
}

/** Every token must appear somewhere in the ad (AND semantics). */
export function matchesQuery(ad, query) {
  const tokens = tokenize(query);
  if (!tokens.length) return true;
  const haystack = haystackOf(ad);
  return tokens.every((token) => haystack.includes(token));
}

export function searchAds(ads = [], query = '') {
  if (!tokenize(query).length) return ads;
  return ads.filter((ad) => matchesQuery(ad, query));
}

function tokenPattern(token) {
  return [...token]
    .map((char) => {
      const variants = CHAR_VARIANTS[char];
      if (variants) return `[${variants}]`;
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
}

/**
 * Escape `text` and wrap matching tokens in <mark>. Input is HTML-escaped
 * first, so a query can never inject markup through the highlight path.
 */
export function highlight(text, query) {
  let html = escapeHtml(text);
  const tokens = tokenize(query).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    if (token.length < 2) continue; // single letters would light up half the page
    const pattern = new RegExp(tokenPattern(token), 'gi');
    html = html.replace(pattern, (match) => `<mark class="search-mark">${match}</mark>`);
  }
  return html;
}
