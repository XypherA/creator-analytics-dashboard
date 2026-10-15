// Filtering logic (pure) plus the filter form's DOM wiring.

const DAY_MS = 24 * 60 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 200;

/** Sorted, de-duplicated category names for the dropdown. */
export function getCategories(videos) {
  return [...new Set(videos.map((video) => video.category))].sort();
}

/**
 * The publish-date window for a range ('7' | '30' | '90' | 'all').
 * Ranges count back from the newest upload rather than from today: the data is
 * a snapshot, so anchoring to "now" would leave "Last 7 days" empty whenever
 * the channel hasn't posted that week. Inclusive: "Last 7 days" is the newest
 * upload's day plus the 6 before it.
 * Shared by the filter and the line chart's x-axis so both agree on the range.
 */
export function getDateWindow(videos, range) {
  const dates = videos.map((video) => video.publishedAt);
  const end = Math.max(...dates);
  const start = range === 'all' ? Math.min(...dates) : end - (Number(range) - 1) * DAY_MS;

  return { start, end };
}

/**
 * Returns the videos matching every active filter. Pure: same input, same
 * output, no DOM access, which makes it trivial to reason about and test.
 */
export function filterVideos(videos, { query, category }, dateWindow) {
  const normalizedQuery = query.trim().toLowerCase();

  return videos.filter((video) =>
    video.publishedAt >= dateWindow.start &&
    video.publishedAt <= dateWindow.end &&
    (category === 'all' || video.category === category) &&
    (normalizedQuery === '' || video.title.toLowerCase().includes(normalizedQuery))
  );
}

function debounce(callback, delayMs) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delayMs);
  };
}

/** Fills the category dropdown, keeping the static "All categories" option. */
export function renderCategoryOptions(select, categories) {
  const options = categories.map((category) => new Option(category, category));
  select.replaceChildren(select.options[0], ...options);
}

/**
 * Connects form controls to state. Controls only report changes; they never
 * re-render anything themselves.
 * @param {HTMLFormElement} form
 * @param {(patch: object) => void} onChange
 */
export function bindFilterForm(form, onChange) {
  const { query, category, range } = form.elements;
  // Debounced so the whole dashboard doesn't re-render on every keystroke.
  const onQueryInput = debounce(() => onChange({ query: query.value }), SEARCH_DEBOUNCE_MS);

  query.addEventListener('input', onQueryInput);
  category.addEventListener('change', () => onChange({ category: category.value }));
  range.addEventListener('change', () => onChange({ range: range.value }));
  // Enter in the search box would otherwise reload the page.
  form.addEventListener('submit', (event) => event.preventDefault());
}

/** Makes the controls reflect state (on load from a URL, or after a reset). */
export function syncFilterForm(form, { query, category, range }) {
  const { elements } = form;

  // Don't overwrite the search box while the user is typing in it; that would
  // fight their input (e.g. trimming a trailing space mid-word).
  if (document.activeElement !== elements.query) {
    elements.query.value = query;
  }
  elements.category.value = category;
  elements.range.value = range;
}
