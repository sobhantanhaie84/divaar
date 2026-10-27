import { store } from '../state.js';
import { debounce } from '../utils.js';

const SEARCH_ICON = `
  <svg class="search__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="11" cy="11" r="7"></circle>
    <path d="m20 20-3.2-3.2"></path>
  </svg>`;

/**
 * Search bar mounted into the header slot.
 *
 * - Keystrokes are debounced (180ms) so each character does not re-render
 *   the whole grid.
 * - `/` focuses the field from anywhere, `Esc` clears it — muscle memory
 *   borrowed from GitHub and friends.
 */
export function mountSearch(root, s = store) {
  if (!root) return null;

  root.innerHTML = `
    <div class="search" role="search">
      ${SEARCH_ICON}
      <input
        id="search-input"
        class="search__input"
        type="search"
        name="q"
        placeholder="جست‌وجو در آگهی‌ها، شهر یا دسته‌بندی…"
        aria-label="جست‌وجو در آگهی‌ها"
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="search"
      />
      <button class="search__clear" type="button" data-action="clear-search" aria-label="پاک کردن جست‌وجو" hidden>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M6 6l12 12M18 6L6 18"></path>
        </svg>
      </button>
      <kbd class="search__shortcut" aria-hidden="true">/</kbd>
    </div>`;

  const input = root.querySelector('#search-input');
  const clearButton = root.querySelector('[data-action="clear-search"]');
  // Same guard as the filter toolbar: a pending debounce must not be wiped by
  // an unrelated store write (e.g. clicking a sort button mid-typing).
  let typed = false;
  const commit = debounce((value) => {
    typed = false;
    s.set({ query: value.replace(/\s+/g, ' ').trimStart() });
  }, 180);

  function commitNow(value) {
    const next = value.replace(/\s+/g, ' ').trimStart();
    typed = false;
    clearButton.hidden = !value;
    commit.cancel();
    s.set({ query: next });
  }

  input.addEventListener('input', () => {
    clearButton.hidden = !input.value;
    typed = true;
    commit(input.value);
  });

  // Leaving the field commits immediately instead of waiting for the timer.
  input.addEventListener('change', () => commitNow(input.value));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault();
      input.value = '';
      commitNow('');
    }
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    commitNow('');
    input.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    const typing = active && /^(input|textarea|select)$/i.test(active.tagName);
    if (typing) return;
    event.preventDefault();
    input.focus();
    input.select();
  });

  // Keep the field in sync with external resets (e.g. "clear all filters").
  s.subscribe(({ query }) => {
    if (!typed && document.activeElement !== input && input.value !== query) input.value = query;
    clearButton.hidden = !query && !typed;
  });

  return { focus: () => input.focus() };
}
