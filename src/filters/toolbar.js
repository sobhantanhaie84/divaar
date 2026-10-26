import { store } from '../state.js';
import { debounce, escapeHtml, formatPrice, toFa } from '../utils.js';
import { SORT_OPTIONS, activeFilterChips, normalizeRange, parseNumber } from './query.js';

/**
 * Filter + sort toolbar, mounted under the header.
 *
 * The toolbar never holds state of its own: it writes to the store and
 * re-syncs from it, which is what makes «حذف فیلترها» work everywhere at
 * once (including the empty-state reset button).
 */
export function mountToolbar(root, s = store, { cities = [] } = {}) {
  if (!root) return null;

  root.innerHTML = `
    <div class="field field--inline">
      <label class="field__label" for="filter-city">شهر</label>
      <select id="filter-city" class="input select">
        <option value="all">همهٔ شهرها</option>
        ${cities.map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`).join('')}
      </select>
    </div>

    <div class="field field--range">
      <span class="field__label" id="price-label">محدودهٔ قیمت (تومان)</span>
      <div class="range" role="group" aria-labelledby="price-label">
        <input id="filter-min" class="input range__input" inputmode="numeric"
               placeholder="از" aria-label="حداقل قیمت" autocomplete="off">
        <span class="range__dash" aria-hidden="true">—</span>
        <input id="filter-max" class="input range__input" inputmode="numeric"
               placeholder="تا" aria-label="حداکثر قیمت" autocomplete="off">
      </div>
    </div>

    <div class="field field--sort">
      <span class="field__label" id="sort-label">مرتب‌سازی</span>
      <div class="segmented" role="group" aria-labelledby="sort-label">
        ${SORT_OPTIONS.map(
          (option) => `
          <button class="segmented__btn" type="button" data-sort="${option.value}" aria-pressed="false">
            ${option.label}
          </button>`,
        ).join('')}
      </div>
    </div>

    <div class="toolbar__tail">
      <span class="count-badge" id="filter-count" hidden></span>
      <button class="btn btn--ghost btn--sm" type="button" data-action="clear-filters" hidden>
        حذف فیلترها
      </button>
    </div>

    <div class="chips" id="filter-chips" aria-live="polite"></div>
  `;

  const citySelect = root.querySelector('#filter-city');
  const minInput = root.querySelector('#filter-min');
  const maxInput = root.querySelector('#filter-max');
  const sortButtons = [...root.querySelectorAll('[data-sort]')];
  const chips = root.querySelector('#filter-chips');
  const countBadge = root.querySelector('#filter-count');
  const clearButton = root.querySelector('[data-action="clear-filters"]');

  const commitPrice = debounce(() => {
    const minPrice = parseNumber(minInput.value);
    const maxPrice = parseNumber(maxInput.value);
    s.set({ minPrice, maxPrice });
  }, 300);

  citySelect.addEventListener('change', () => s.set({ city: citySelect.value }));

  for (const input of [minInput, maxInput]) {
    input.addEventListener('input', () => {
      // keep only digits/separators so the field never accepts letters
      input.value = input.value.replace(/[^\d\u06f0-\u06f9\u0660-\u0669٬,، ]/g, '');
      commitPrice();
    });
    input.addEventListener('blur', () => {
      const value = parseNumber(input.value);
      if (value !== null) input.value = toFa(value.toLocaleString('en-US').replace(/,/g, '٬'));
    });
  }

  for (const button of sortButtons) {
    button.addEventListener('click', () => s.set({ sort: button.dataset.sort }));
  }

  clearButton.addEventListener('click', () => s.reset());

  chips.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-chip]');
    if (!remove) return;
    const key = remove.dataset.chip;
    if (key === 'city') s.set({ city: 'all' });
    if (key === 'price') s.set({ minPrice: null, maxPrice: null });
  });

  s.subscribe((state) => {
    citySelect.value = state.city || 'all';

    const activeMin = document.activeElement === minInput;
    const activeMax = document.activeElement === maxInput;
    if (!activeMin) minInput.value = state.minPrice === null ? '' : toFa(state.minPrice.toLocaleString('en-US').replace(/,/g, '٬'));
    if (!activeMax) maxInput.value = state.maxPrice === null ? '' : toFa(state.maxPrice.toLocaleString('en-US').replace(/,/g, '٬'));

    for (const button of sortButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.sort === state.sort));
    }

    const chipsList = activeFilterChips(
      { ...state, ...normalizeRange(state.minPrice, state.maxPrice) },
      formatPrice,
    );

    chips.innerHTML = chipsList
      .map(
        (chip) =>
          `<button class="chip" type="button" data-chip="${chip.key}">
             <span>${escapeHtml(chip.label)}</span>
             <span class="chip__x" aria-hidden="true">✕</span>
           </button>`,
      )
      .join('');

    countBadge.hidden = chipsList.length === 0;
    countBadge.textContent = `${toFa(chipsList.length)} فیلتر فعال`;
    clearButton.hidden = chipsList.length === 0;
    root.classList.toggle('has-active-filters', chipsList.length > 0);
  });

  return { reset: () => s.reset() };
}
