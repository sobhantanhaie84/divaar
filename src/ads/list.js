import { renderAdCard, renderAdCardSkeleton } from './card.js';
import { emptyState } from '../ui.js';

/**
 * Grid renderer. Returns the number of rendered cards so the caller can
 * decide whether to show the "no results" state.
 */
export function renderAds(grid, ads, options = {}) {
  if (!grid) return 0;
  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = ads.map((ad) => renderAdCard(ad, options)).join('');
  return ads.length;
}

/** First-paint placeholder; keeps layout stable while data hydrates. */
export function renderSkeleton(grid, count = 6) {
  if (!grid) return;
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = Array.from({ length: count }, renderAdCardSkeleton).join('');
}

/** Shared "nothing matched" panel, reused by search and filter features. */
export function renderNoResults(grid, onReset) {
  if (!grid) return;
  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = emptyState({
    icon: '🔍',
    title: 'آگهی‌ای با این مشخصات پیدا نشد',
    hint: 'عبارت جست‌وجو یا فیلترهای اعمال‌شده را تغییر دهید.',
    actionLabel: onReset ? 'پاک کردن همهٔ فیلترها' : '',
    actionAttrs: 'data-action="reset-filters"',
  });
}
