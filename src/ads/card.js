import { categoryMeta } from './model.js';
import { escapeHtml, formatDate, formatPrice, toFa } from '../utils.js';

/**
 * One listing card. Pure string builder: no side effects, easy to snapshot.
 * Every user-controlled string passes through escapeHtml.
 */
export function renderAdCard(ad) {
  const meta = categoryMeta(ad.category);
  const isNegotiable = ad.price === 0;

  return `
    <article class="ad-card" data-id="${escapeHtml(ad.id)}">
      <a class="ad-card__link" href="#${escapeHtml(ad.id)}" aria-label="${escapeHtml(ad.title)}">
        <div class="ad-card__media tone-${meta.tone}" aria-hidden="true">
          <span class="ad-card__emoji">${meta.icon}</span>
          <span class="ad-card__category">${escapeHtml(ad.category)}</span>
        </div>
        <div class="ad-card__body">
          <h3 class="ad-card__title">${escapeHtml(ad.title)}</h3>
          <p class="ad-card__price${isNegotiable ? ' ad-card__price--free' : ''}">
            ${formatPrice(ad.price)}
          </p>
          <div class="ad-card__meta">
            <span class="ad-card__city" title="شهر">📍 ${escapeHtml(ad.city)}</span>
            <time class="ad-card__time" datetime="${escapeHtml(ad.postedAt)}">${formatDate(ad.postedAt)}</time>
          </div>
        </div>
      </a>
      <span class="ad-card__id" aria-hidden="true">${toFa(ad.id.replace(/\D/g, ''))}</span>
    </article>`;
}

/** Placeholder used while the first paint is hydrating. */
export function renderAdCardSkeleton() {
  return `
    <article class="ad-card ad-card--skeleton" aria-hidden="true">
      <div class="ad-card__media skeleton-block"></div>
      <div class="ad-card__body">
        <div class="skeleton-line" style="width: 88%"></div>
        <div class="skeleton-line" style="width: 52%"></div>
        <div class="skeleton-line skeleton-line--sm" style="width: 34%"></div>
      </div>
    </article>`;
}
