import { formatDate, formatInteger, formatPercent } from './format.js';

// How to read the sortable value for each column key.
const SORT_ACCESSORS = {
  title: (video) => video.title,
  publishDate: (video) => video.publishedAt,
  views: (video) => video.views,
  likes: (video) => video.likes,
  engagementRate: (video) => video.engagementRate,
};

const ARIA_SORT = { asc: 'ascending', desc: 'descending' };

function compareValues(a, b) {
  return typeof a === 'string' ? a.localeCompare(b) : a - b;
}

/** Returns a sorted copy; the input array is never mutated. */
export function sortVideos(videos, sortKey, sortDir) {
  const accessor = SORT_ACCESSORS[sortKey];
  const direction = sortDir === 'asc' ? 1 : -1;

  return [...videos].sort((a, b) => direction * compareValues(accessor(a), accessor(b)));
}

/**
 * Clicking the active column flips its direction. A new column starts with
 * the most useful order: A→Z for text, biggest/newest first for numbers.
 */
export function getNextSort({ sortKey, sortDir }, clickedKey) {
  if (clickedKey === sortKey) {
    return { sortKey, sortDir: sortDir === 'asc' ? 'desc' : 'asc' };
  }

  return { sortKey: clickedKey, sortDir: clickedKey === 'title' ? 'asc' : 'desc' };
}

/** One delegated listener on <thead> instead of one per header button. */
export function bindTableSort(table, onSort) {
  table.tHead.addEventListener('click', (event) => {
    const button = event.target.closest('[data-sort-key]');

    if (button) {
      onSort(button.dataset.sortKey);
    }
  });
}

/** aria-sort goes on the sorted column only; CSS draws the arrow from it. */
function updateSortIndicators(table, { sortKey, sortDir }) {
  table.tHead.querySelectorAll('[data-sort-key]').forEach((button) => {
    const heading = button.closest('th');

    if (button.dataset.sortKey === sortKey) {
      heading.setAttribute('aria-sort', ARIA_SORT[sortDir]);
    } else {
      heading.removeAttribute('aria-sort');
    }
  });
}

function createCell(text, modifier) {
  const cell = document.createElement('td');
  cell.className = modifier ? `table__cell table__cell--${modifier}` : 'table__cell';
  cell.textContent = text;
  return cell;
}

// The title is a row header so screen readers announce it with each value.
function createTitleCell(video) {
  const cell = document.createElement('th');
  const title = document.createElement('span');
  const category = document.createElement('span');

  cell.scope = 'row';
  cell.className = 'table__cell table__cell--title';
  title.className = 'table__video-title';
  title.textContent = video.title;
  category.className = 'table__category';
  category.textContent = video.category;
  cell.append(title, category);
  return cell;
}

// Built with textContent rather than innerHTML so titles can never inject markup.
function createRow(video) {
  const row = document.createElement('tr');
  row.className = 'table__row';
  row.append(
    createTitleCell(video),
    createCell(formatDate(video.publishedAt)),
    createCell(formatInteger(video.views), 'numeric'),
    createCell(formatInteger(video.likes), 'numeric'),
    createCell(formatPercent(video.engagementRate), 'numeric')
  );
  return row;
}

/** Renders already-sorted videos and refreshes the header indicators. */
export function renderTable(table, videos, sort) {
  updateSortIndicators(table, sort);
  table.tBodies[0].replaceChildren(...videos.map(createRow));
}
