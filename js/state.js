// Single source of truth for what the user is looking at. UI events call
// setState(); subscribers re-render from the new state. Nothing else in the app
// stores filter or sort values, so the screen and the URL can never disagree.

// Kept as strings because they round-trip through the URL and <select> values.
export const RANGE_OPTIONS = ['7', '30', '90', 'all'];
export const SORT_KEYS = ['title', 'publishDate', 'views', 'likes', 'engagementRate'];

export const DEFAULT_STATE = Object.freeze({
  query: '',
  category: 'all',
  range: 'all',
  sortKey: 'publishDate',
  sortDir: 'desc',
});

// Maps state keys to short, readable query-string names.
const URL_PARAMS = {
  query: 'q',
  category: 'category',
  range: 'range',
  sortKey: 'sort',
  sortDir: 'dir',
};

let state = readStateFromUrl(window.location.search);
const listeners = new Set();

/**
 * Parses a query string into a valid state object. Anything missing or
 * invalid falls back to the default, because URLs can be hand-edited.
 * @param {string} search - e.g. "?q=moon&range=30"
 */
export function readStateFromUrl(search) {
  const params = new URLSearchParams(search);
  const range = params.get(URL_PARAMS.range);
  const sortKey = params.get(URL_PARAMS.sortKey);
  const sortDir = params.get(URL_PARAMS.sortDir);

  return {
    query: params.get(URL_PARAMS.query)?.trim() ?? DEFAULT_STATE.query,
    category: params.get(URL_PARAMS.category) || DEFAULT_STATE.category,
    range: RANGE_OPTIONS.includes(range) ? range : DEFAULT_STATE.range,
    sortKey: SORT_KEYS.includes(sortKey) ? sortKey : DEFAULT_STATE.sortKey,
    sortDir: sortDir === 'asc' || sortDir === 'desc' ? sortDir : DEFAULT_STATE.sortDir,
  };
}

/**
 * Writes state into a query string. Default values are left out so a fresh
 * view has a clean URL, and unrelated params (like ?error=1) are preserved.
 */
export function writeStateToSearch(nextState, currentSearch) {
  const params = new URLSearchParams(currentSearch);

  Object.entries(URL_PARAMS).forEach(([key, param]) => {
    if (nextState[key] === DEFAULT_STATE[key]) {
      params.delete(param);
    } else {
      params.set(param, nextState[key]);
    }
  });

  const search = params.toString();
  return search ? `?${search}` : '';
}

function syncUrl(nextState) {
  const { pathname, search, hash } = window.location;
  const nextSearch = writeStateToSearch(nextState, search);

  // replaceState rather than pushState: tweaking a filter isn't navigation,
  // and one history entry per keystroke would break the Back button.
  if (nextSearch !== search) {
    window.history.replaceState(null, '', `${pathname}${nextSearch}${hash}`);
  }
}

export const getState = () => state;

/** Merges a partial update, syncs the URL and notifies subscribers. */
export function setState(patch) {
  state = { ...state, ...patch };
  syncUrl(state);
  listeners.forEach((listener) => listener(state));
}

/** Resets filters but keeps the user's chosen sort order. */
export function resetFilters() {
  const { query, category, range } = DEFAULT_STATE;
  setState({ query, category, range });
}

/** @returns {() => void} unsubscribe function */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
