/**
 * Domain helpers for listings.
 *
 * Keeping normalisation in one place means every downstream feature
 * (search, filters, sorting) receives the exact same shape:
 * `{ id, title, price, city, category, postedAt, postedTs }`.
 */

/** Prices above this are almost always typos in user-submitted data. */
export const MAX_REASONABLE_PRICE = 100_000_000_000;

export function normalizeAd(raw, index = 0) {
  const price = Number(raw?.price);
  return {
    id: String(raw?.id ?? `ad-${index}`),
    title: String(raw?.title ?? '').trim(),
    price: Number.isFinite(price) && price >= 0 ? Math.min(price, MAX_REASONABLE_PRICE) : 0,
    city: String(raw?.city ?? 'نامشخص').trim(),
    category: String(raw?.category ?? 'سایر').trim(),
    postedAt: String(raw?.postedAt ?? ''),
    postedTs: Date.parse(raw?.postedAt) || 0,
  };
}

/** Normalise + sort newest-first. Invalid dates sink to the bottom. */
export function normalizeAds(rawAds = []) {
  return rawAds
    .map((raw, index) => normalizeAd(raw, index))
    .sort((a, b) => b.postedTs - a.postedTs || a.id.localeCompare(b.id, 'en'));
}

/** Sorted, de-duplicated city list used by the filter UI. */
export function getCities(ads = []) {
  return [...new Set(ads.map((ad) => ad.city))].sort((a, b) => a.localeCompare(b, 'fa'));
}

/** Price range across the inventory, ignoring «توافقی» (0) listings. */
export function getPriceBounds(ads = []) {
  const prices = ads.map((ad) => ad.price).filter((price) => price > 0);
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Short category badge + emoji, shared by cards and (later) filters. */
export const CATEGORY_META = {
  موبایل: { icon: '📱', tone: 'rose' },
  لپ‌تاپ: { icon: '💻', tone: 'blue' },
  دیجیتال: { icon: '🖥️', tone: 'slate' },
  'خانه و آشپزخانه': { icon: '🛋️', tone: 'amber' },
  خودرو: { icon: '🚗', tone: 'green' },
  ورزشی: { icon: '🚴', tone: 'teal' },
  کتاب: { icon: '📚', tone: 'violet' },
  خدمات: { icon: '🛠️', tone: 'orange' },
  سایر: { icon: '📦', tone: 'slate' },
};

export function categoryMeta(category) {
  return CATEGORY_META[category] ?? CATEGORY_META['سایر'];
}
