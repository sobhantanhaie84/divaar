/**
 * Filtering and sorting — pure functions over the normalised ad list.
 *
 * Kept separate from the toolbar so the behaviour can be tested without a
 * DOM and reused later by URL-based deep links (?city=…&sort=…).
 */

export const SORT_OPTIONS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price-asc', label: 'ارزان‌ترین' },
  { value: 'price-desc', label: 'گران‌ترین' },
];

const PERSIAN_DIGITS = /[\u06f0-\u06f9]/g;
const ARABIC_DIGITS = /[\u0660-\u0669]/g;

/**
 * Parse a price typed by a human: «۱۲٬۵۰۰٬۰۰۰», «12,500,000» and
 * «12500000 تومان» all mean the same thing. Returns null when the input
 * carries no digits at all (i.e. the field is empty or junk).
 */
export function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const text = String(value)
    .trim()
    .replace(PERSIAN_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٬,،_\s]/g, '')
    .replace(/[^\d]/g, '');

  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Swap reversed bounds instead of returning an empty list. */
export function normalizeRange(minPrice, maxPrice) {
  const min = minPrice ?? null;
  const max = maxPrice ?? null;
  if (min !== null && max !== null && min > max) return { minPrice: max, maxPrice: min };
  return { minPrice: min, maxPrice: max };
}

export function filterByCity(ads = [], city = 'all') {
  if (!city || city === 'all') return ads;
  return ads.filter((ad) => ad.city === city);
}

/**
 * Range filtering skips «توافقی» (price 0) listings: they have no number to
 * compare, so pretending they cost zero would be misleading.
 */
export function filterByPrice(ads = [], { minPrice = null, maxPrice = null } = {}) {
  if (minPrice === null && maxPrice === null) return ads;
  return ads.filter((ad) => {
    if (ad.price <= 0) return false;
    if (minPrice !== null && ad.price < minPrice) return false;
    if (maxPrice !== null && ad.price > maxPrice) return false;
    return true;
  });
}

/** Negotiable items always sink to the bottom, whatever the direction. */
function byPrice(ads, direction) {
  const priced = ads
    .filter((ad) => ad.price > 0)
    .sort((a, b) => direction * (a.price - b.price) || a.id.localeCompare(b.id, 'en'));
  const negotiable = ads.filter((ad) => ad.price <= 0);
  return [...priced, ...negotiable];
}

export function sortAds(ads = [], sort = 'newest') {
  switch (sort) {
    case 'price-asc':
      return byPrice(ads, 1);
    case 'price-desc':
      return byPrice(ads, -1);
    case 'newest':
    default:
      return [...ads].sort((a, b) => b.postedTs - a.postedTs || a.id.localeCompare(b.id, 'en'));
  }
}

/** The single entry point the render loop calls. */
export function applyFilters(ads = [], state = {}) {
  const range = normalizeRange(state.minPrice, state.maxPrice);
  const byCity = filterByCity(ads, state.city);
  const byRange = filterByPrice(byCity, range);
  return sortAds(byRange, state.sort);
}

/** Human-readable chips for the active filters (used by the toolbar). */
export function activeFilterChips(state = {}, formatPrice = String) {
  const chips = [];
  if (state.city && state.city !== 'all') {
    chips.push({ key: 'city', label: `شهر: ${state.city}` });
  }
  const { minPrice, maxPrice } = normalizeRange(state.minPrice, state.maxPrice);
  if (minPrice !== null && maxPrice !== null) {
    chips.push({ key: 'price', label: `قیمت: ${formatPrice(minPrice)} تا ${formatPrice(maxPrice)}` });
  } else if (minPrice !== null) {
    chips.push({ key: 'price', label: `از ${formatPrice(minPrice)}` });
  } else if (maxPrice !== null) {
    chips.push({ key: 'price', label: `تا ${formatPrice(maxPrice)}` });
  }
  return chips;
}
