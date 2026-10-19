/**
 * Shell rendering: header, footer bits and reusable empty states.
 * Feature branches plug their own widgets into the shell.
 */
import { escapeHtml, toFa } from './utils.js';

const LOGO = `
  <svg viewBox="0 0 40 40" role="img" aria-hidden="true" class="brand-mark">
    <rect x="2" y="2" width="36" height="36" rx="11" fill="var(--brand)"/>
    <path d="M13 12h7.5a8 8 0 0 1 0 16H13z" fill="#fff" opacity=".95"/>
    <circle cx="21" cy="20" r="3.2" fill="var(--brand)"/>
  </svg>`;

export function renderHeader(root, { query = '' } = {}) {
  if (!root) return;
  root.innerHTML = `
    <div class="app-header__inner">
      <a class="brand" href="./index.html" aria-label="divaar — خانه">
        ${LOGO}
        <span class="brand__text">
          <span class="brand__name">divaar</span>
          <span class="brand__tagline">بازارچهٔ آگهی</span>
        </span>
      </a>
      <div class="app-header__slot" id="search-slot"></div>
      <nav class="app-header__nav" aria-label="ناوبری اصلی">
        <a class="nav-pill is-active" href="./index.html">آگهی‌ها</a>
        <a class="nav-pill" href="#" aria-disabled="true">دسته‌بندی‌ها</a>
        <button class="btn btn--ghost" type="button" disabled>ثبت آگهی</button>
      </nav>
    </div>`;
  if (query) {
    // kept for features that hydrate the header with an initial query
    root.dataset.initialQuery = query;
  }
}

/** Generic empty state used for "no data" and "no results". */
export function emptyState({ icon = '🗂️', title, hint = '', actionLabel = '', actionAttrs = '' }) {
  return `
    <div class="empty-state" role="status">
      <div class="empty-state__icon" aria-hidden="true">${icon}</div>
      <h2 class="empty-state__title">${escapeHtml(title)}</h2>
      ${hint ? `<p class="empty-state__hint">${escapeHtml(hint)}</p>` : ''}
      ${actionLabel ? `<button class="btn btn--primary" type="button" ${actionAttrs}>${escapeHtml(actionLabel)}</button>` : ''}
    </div>`;
}

/** Small pill used to show counts in the toolbar. */
export function countBadge(count, label) {
  return `<span class="count-badge">${toFa(count)} ${escapeHtml(label)}</span>`;
}
