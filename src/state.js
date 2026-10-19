/**
 * Minimal observable store. The whole UI is a pure function of this state,
 * which keeps filtering/searching/sorting easy to reason about (and to test).
 */

export const INITIAL_STATE = Object.freeze({
  query: '',
  city: 'all',
  minPrice: null,
  maxPrice: null,
  sort: 'newest',
});

export function createStore(initial = INITIAL_STATE) {
  let state = { ...initial };
  const listeners = new Set();

  return {
    getState() {
      return state;
    },
    /** Subscribe and receive the current state immediately. */
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    /** Shallow-merge a patch and notify subscribers. */
    set(patch) {
      state = { ...state, ...patch };
      for (const listener of listeners) listener(state);
      return state;
    },
    reset() {
      return this.set({ ...initial });
    },
  };
}

export const store = createStore();
