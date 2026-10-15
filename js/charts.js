import { formatCompact, formatDate, formatInteger, formatShortDate } from './format.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Chart instances are created once and then updated. Re-creating them on
// every filter change would leak listeners and replay the intro animation.
const charts = {
  views: null,
  category: null,
};

/** Reads a CSS custom property so the canvas charts follow the CSS theme. */
function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getTheme() {
  return {
    series: readToken('--chart-series'),
    fill: readToken('--chart-fill'),
    grid: readToken('--chart-grid'),
    text: readToken('--chart-text'),
    surface: readToken('--color-surface'),
  };
}

// --- Pure data shaping --------------------------------------------------------

/** One point per Short, oldest first, keeping the title for the tooltip. */
export function getViewsSeries(videos) {
  return videos
    .map((video) => ({ x: video.publishedAt, y: video.views, title: video.title }))
    .sort((a, b) => a.x - b.x);
}

/** Total views per category, highest first. */
export function getViewsByCategory(videos) {
  const totals = new Map();

  videos.forEach((video) => {
    totals.set(video.category, (totals.get(video.category) ?? 0) + video.views);
  });

  return [...totals]
    .map(([category, views]) => ({ category, views }))
    .sort((a, b) => b.views - a.views);
}

/** Tick spacing that keeps date labels readable for the visible span. */
function getTickStep({ start, end }) {
  const spanDays = (end - start) / DAY_MS;

  if (spanDays <= 7) return DAY_MS;
  if (spanDays <= 31) return 7 * DAY_MS;
  if (spanDays <= 90) return 14 * DAY_MS;
  return 28 * DAY_MS;
}

// --- Chart creation -----------------------------------------------------------

function applyGlobalDefaults(theme) {
  Chart.defaults.color = theme.text;
  Chart.defaults.borderColor = theme.grid;
  Chart.defaults.font.family = readToken('--font-sans');
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.display = false;
}

function createViewsChart(canvas, theme) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Views',
        data: [],
        borderColor: theme.series,
        backgroundColor: theme.fill,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: theme.series,
        pointBorderColor: theme.surface,
        pointBorderWidth: 2,
        // Points on the first or last day sit on the chart edge; don't cut them in half.
        clip: false,
      }],
    },
    options: {
      // x values are timestamps; animating them from 0 (1970) would fly points
      // in from far off-screen, so only the y value animates.
      animations: { x: { duration: 0 } },
      layout: { padding: { right: 8 } },
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            title: ([item]) => item.raw.title,
            label: (item) => `${formatInteger(item.parsed.y)} views · ${formatDate(item.parsed.x)}`,
          },
        },
      },
      scales: {
        // A linear axis of timestamps keeps real time spacing between uploads
        // without pulling in a date-adapter library for Chart.js's time scale.
        x: {
          type: 'linear',
          grid: { display: false },
          ticks: {
            callback: (value) => formatShortDate(value),
            includeBounds: false,
            maxRotation: 0,
            autoSkipPadding: 16,
          },
        },
        y: {
          beginAtZero: true,
          // Headroom so the most-viewed point never sits on the top edge.
          grace: '5%',
          ticks: { callback: (value) => formatCompact(value) },
        },
      },
    },
  });
}

function createCategoryChart(canvas, theme) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Views',
        data: [],
        backgroundColor: theme.series,
        borderRadius: 4,
        maxBarThickness: 28,
      }],
    },
    options: {
      // Horizontal bars leave room for category names on narrow screens.
      indexAxis: 'y',
      plugins: {
        tooltip: {
          callbacks: { label: (item) => `${formatInteger(item.parsed.x)} views` },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { callback: (value) => formatCompact(value) },
        },
        y: { grid: { display: false } },
      },
    },
  });
}

/** Replaces the canvases with a message if the CDN script failed to load. */
function renderUnavailable(canvases) {
  canvases.forEach((canvas) => {
    const message = document.createElement('p');
    message.className = 'panel__fallback';
    message.textContent = 'Charts are unavailable right now. The table below has the same data.';
    canvas.replaceWith(message);
  });
}

// --- Updates ------------------------------------------------------------------

function updateViewsChart(chart, videos, dateWindow) {
  const points = getViewsSeries(videos);
  const peak = points.reduce((best, point) => (point.y > best.y ? point : best));

  chart.data.datasets[0].data = points;
  Object.assign(chart.options.scales.x, {
    min: dateWindow.start,
    max: dateWindow.end,
  });
  chart.options.scales.x.ticks.stepSize = getTickStep(dateWindow);
  chart.update();

  // Canvas content is invisible to screen readers, so describe the takeaway.
  chart.canvas.setAttribute(
    'aria-label',
    `Line chart of views for ${points.length} Shorts. Most viewed: "${peak.title}" with ${formatCompact(peak.y)} views.`
  );
}

function updateCategoryChart(chart, videos) {
  const rows = getViewsByCategory(videos);

  chart.data.labels = rows.map((row) => row.category);
  chart.data.datasets[0].data = rows.map((row) => row.views);
  chart.update();

  chart.canvas.setAttribute(
    'aria-label',
    `Bar chart of total views by category. ${rows
      .map((row) => `${row.category}: ${formatCompact(row.views)}`)
      .join(', ')}.`
  );
}

/**
 * Renders both charts for the given videos (assumed non-empty).
 * @param {{ videos: object[], dateWindow: {start: number, end: number},
 *   viewsCanvas: HTMLCanvasElement, categoryCanvas: HTMLCanvasElement }} options
 */
export function renderCharts({ videos, dateWindow, viewsCanvas, categoryCanvas }) {
  if (typeof window.Chart !== 'function') {
    renderUnavailable([viewsCanvas, categoryCanvas].filter((canvas) => canvas.isConnected));
    return;
  }

  if (!charts.views) {
    const theme = getTheme();
    applyGlobalDefaults(theme);
    charts.views = createViewsChart(viewsCanvas, theme);
    charts.category = createCategoryChart(categoryCanvas, theme);
  }

  updateViewsChart(charts.views, videos, dateWindow);
  updateCategoryChart(charts.category, videos);
}
