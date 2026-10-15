// Filtering logic (pure) plus the filter form's DOM wiring.

const DAY_MS = 24 * 60 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 200;

/**
 * The newest publish date in the data set. Date ranges are measured back from
 * here rather than from "now", because the sample data is static: anchoring to
 * today would make "Last 7 days" empty a week after deploying.
 */
export function getReferenceDate(videos) {
  return Math.max(...videos.map((video) => video.publishedAt));
}

/** Sorted, de-duplicated category names for the dropdown. */
export function getCategories(videos) {
  return [...new Set(videos.map((video) => video.category))].sort();
}

/**
 * Returns the videos matching every active filter. Pure: same input, same
 * output, no DOM access, which makes it trivial to reason about and test.
 */
export function filterVideos(videos, { query, category, range }, referenceDate) {
  const normalizedQuery = query.trim().toLowerCase();
  // Inclusive window: "Last 7 days" covers the reference day and the 6 before it.
  const earliest = referenceDate - (range - 1) * DAY_MS;

  return videos.filter((video) =>
    video.publishedAt >= earliest &&
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
  range.addEventListener('change', () => onChange({ range: Number(range.value) }));
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
  elements.range.value = String(range);
}
