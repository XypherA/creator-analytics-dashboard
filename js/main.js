// Entry point. Wires modules together and owns the one data flow:
//   UI event -> setState() -> render(state) -> filter -> KPIs, charts, table

import { fetchVideos } from './api.js';
import { renderCharts } from './charts.js';
import {
  bindFilterForm,
  filterVideos,
  getCategories,
  getDateWindow,
  getReferenceDate,
  renderCategoryOptions,
  syncFilterForm,
} from './filters.js';
import { formatDate } from './format.js';
import { computeKpis, renderKpis } from './kpis.js';
import { getState, resetFilters, setState, subscribe } from './state.js';
import { bindTableSort, getNextSort, renderTable, sortVideos } from './table.js';

const elements = {
  dashboard: document.querySelector('.dashboard'),
  form: document.getElementById('filters-form'),
  fieldset: document.getElementById('filters-fieldset'),
  summary: document.getElementById('results-summary'),
  kpis: document.getElementById('kpis'),
  viewsCanvas: document.getElementById('views-chart'),
  categoryCanvas: document.getElementById('category-chart'),
  table: document.getElementById('videos-table'),
  errorMessage: document.getElementById('error-message'),
};

// ?error=1 fails only the first attempt, so the Retry button can be demoed
// recovering instead of failing forever.
let simulateNextError = new URLSearchParams(window.location.search).get('error') === '1';

// Loaded data. Kept outside state because it never changes after loading;
// state only describes how the user is viewing it.
let videos = [];
let referenceDate = 0;

/** Switches between loading | ready | empty | error. CSS does the rest. */
function setViewState(viewState) {
  elements.dashboard.dataset.state = viewState;
  elements.dashboard.setAttribute('aria-busy', String(viewState === 'loading'));
  // Filtering before data arrives would flash the empty state.
  elements.fieldset.disabled = viewState === 'loading' || viewState === 'error';
}

function renderSummary(matchCount) {
  elements.summary.textContent =
    `Showing ${matchCount} of ${videos.length} videos · data as of ${formatDate(referenceDate)}`;
}

function render(state) {
  const dateWindow = getDateWindow(referenceDate, state.range);
  const filtered = filterVideos(videos, state, dateWindow);

  syncFilterForm(elements.form, state);
  renderSummary(filtered.length);

  if (filtered.length === 0) {
    setViewState('empty');
    return;
  }

  // Show the content first so Chart.js measures visible, correctly sized canvases.
  setViewState('ready');
  renderKpis(elements.kpis, computeKpis(filtered));
  renderCharts({
    videos: filtered,
    dateWindow,
    range: state.range,
    viewsCanvas: elements.viewsCanvas,
    categoryCanvas: elements.categoryCanvas,
  });
  renderTable(elements.table, sortVideos(filtered, state.sortKey, state.sortDir), state);
}

async function loadDashboard() {
  setViewState('loading');

  try {
    const simulateError = simulateNextError;
    simulateNextError = false;

    videos = await fetchVideos({ simulateError });
    referenceDate = getReferenceDate(videos);

    const categories = getCategories(videos);
    renderCategoryOptions(elements.form.elements.category, categories);

    const { category } = getState();
    // A shared link may name a category that doesn't exist; fall back to all.
    if (category !== 'all' && !categories.includes(category)) {
      setState({ category: 'all' });
    } else {
      render(getState());
    }
  } catch (error) {
    elements.errorMessage.textContent = `${error.message} Check your connection and try again.`;
    setViewState('error');
  }
}

// Buttons that appear in several places (Reset twice, Retry) share one
// delegated handler keyed by data-action.
const ACTIONS = {
  reset: resetFilters,
  retry: loadDashboard,
};

function handleActionClick(event) {
  const button = event.target.closest('[data-action]');

  if (button) {
    ACTIONS[button.dataset.action]();
  }
}

function init() {
  // Show the URL's filters straight away, even while data is still loading.
  syncFilterForm(elements.form, getState());
  subscribe(render);
  bindFilterForm(elements.form, setState);
  bindTableSort(elements.table, (sortKey) => setState(getNextSort(getState(), sortKey)));
  document.addEventListener('click', handleActionClick);
  loadDashboard();
}

init();
