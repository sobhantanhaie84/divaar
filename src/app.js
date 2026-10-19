/**
 * Application bootstrap.
 *
 * `main` intentionally ships the shell only: header, toolbar slot and an empty
 * listing grid. Each feature branch (ads / search / filters) plugs a module
 * into this file, so the surface for merge conflicts stays tiny.
 */
import { store } from './state.js';
import { emptyState, renderHeader } from './ui.js';

const grid = document.querySelector('#listing-grid');
const meta = document.querySelector('#results-meta');

renderHeader(document.querySelector('#app-header'));

/**
 * The single render entry point. Features decorate `collectItems` instead of
 * re-implementing rendering, which keeps the data flow one-directional.
 */
function collectItems() {
  return [];
}

function render(state) {
  const items = collectItems(state);

  if (meta) {
    meta.textContent = items.length ? '' : '';
  }

  if (grid) {
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = items.length
      ? ''
      : emptyState({
          icon: '🧱',
          title: 'فهرست آگهی‌ها هنوز خالی است',
          hint: 'اسکلت پروژه آماده است؛ ماژول آگهی‌ها در برنچ feature/ads-list اضافه می‌شود.',
        });
  }
}

store.subscribe(render);
