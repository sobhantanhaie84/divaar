/**
 * Application bootstrap.
 *
 * `main` intentionally ships the shell only: header, toolbar slot and an empty
 * listing grid. Each feature branch (ads / search / filters) plugs a module
 * into this file, so the surface for merge conflicts stays tiny.
 */
import { store } from './state.js';
import { emptyState, renderHeader } from './ui.js';
import { ads } from './data/ads.js';
import { normalizeAds } from './ads/model.js';
import { renderAds, renderNoResults, renderSkeleton } from './ads/list.js';
import { mountSearch } from './search/bar.js';
import { searchAds } from './search/match.js';
import { toFa } from './utils.js';

const grid = document.querySelector('#listing-grid');
const meta = document.querySelector('#results-meta');

renderHeader(document.querySelector('#app-header'));
mountSearch(document.querySelector('#search-slot'), store);

const inventory = normalizeAds(ads);

/**
 * The single render entry point. Features decorate `collectItems` instead of
 * re-implementing rendering, which keeps the data flow one-directional.
 */
function collectItems(state) {
  return searchAds(inventory, state.query);
}

function render(state) {
  const items = collectItems(state);

  if (meta) {
    meta.textContent = state.query
      ? `${toFa(items.length)} نتیجه برای «${state.query}» در ${toFa(inventory.length)} آگهی`
      : `${toFa(items.length)} آگهی از ${toFa(inventory.length)} آگهی موجود`;
  }

  if (!grid) return;

  if (!items.length) {
    if (state.query) {
      renderNoResults(grid, () => store.reset());
      return;
    }
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = emptyState({
      icon: '🧱',
      title: 'فهرست آگهی‌ها هنوز خالی است',
      hint: 'اسکلت پروژه آماده است؛ داده‌ها به‌زودی بارگذاری می‌شوند.',
    });
    return;
  }

  renderAds(grid, items, { query: state.query });
}

// Empty-result panel ships a reset button; one delegated listener handles it.
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action="reset-filters"]');
  if (trigger) store.reset();
});

// First paint: skeleton now, real cards on the next frame.
if (grid) renderSkeleton(grid, 6);
store.subscribe(render);
requestAnimationFrame(() => store.set({}));
