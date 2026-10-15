# Creator Analytics Dashboard

An analytics dashboard for **@xypherfact**, a YouTube Shorts facts channel, built with plain HTML, CSS and vanilla JavaScript: no framework, no build step.

I run a Shorts channel myself, and YouTube Studio doesn't make it easy to ask simple questions like *"which category performed best in the last 30 days?"*. This project is my take on a focused, filterable view of a channel's Shorts.

> **Note:** all numbers are generated **sample data** (`data/videos.json`), not real channel statistics. The UI labels this clearly.

**Live demo:** _coming soon_

## Features

- **KPI cards**: total views, total likes, average engagement rate and video count, with compact formatting (`1.2M`) and the exact value on hover
- **Views over time**: line chart, one point per Short on a true time axis
- **Views by category**: horizontal bar chart, sorted highest first
- **Sortable video table**: click any column header; direction is shown visually and with `aria-sort`
- **Filters**: title search, category and date range (last 7 / 30 / 90 days); KPIs, charts and table all update together
- **Shareable URLs**: filter and sort state lives in the query string, e.g. `?q=what&range=30&sort=views`
- **Loading, empty and error states**: skeleton placeholders, a "no matches" view with a reset button, and an error view with Retry (add `?error=1` to the URL to simulate a failed request)
- **Responsive and accessible**: mobile-first layout, horizontally scrollable table on small screens, semantic markup, labelled controls, keyboard support and reduced-motion support

## Tech

- HTML5, CSS3 (custom properties, Grid, BEM naming)
- Vanilla JavaScript (ES modules, `fetch` + `async`/`await`, `Intl` formatting)
- [Chart.js 4](https://www.chartjs.org/) via cdnjs (the only dependency)
- Hosted on GitHub Pages

```
index.html
css/styles.css
data/videos.json
js/
  main.js      entry point: wires modules together, owns the render loop
  state.js     single state object + URL query-string sync
  api.js       fetching and normalizing data
  filters.js   pure filter functions + filter form wiring
  kpis.js      KPI calculations and rendering
  charts.js    Chart.js setup and updates
  table.js     sorting and table rendering
  format.js    number, percent and date formatting
```

## Key front-end decisions

**One state object, one data flow.** Every interaction (typing, picking a category, clicking a column) calls `setState()`. That updates a single state object, mirrors it to the URL and triggers one `render()`, which filters the data and redraws the KPIs, charts and table. No component keeps its own copy of the filters, so the parts of the page can't fall out of sync. Filtering, sorting and KPI maths are pure functions, which keeps them easy to test and reason about.

**URL sync.** State is serialized into the query string (only non-default values, so the default URL stays clean) and read back and validated on page load. That makes any view shareable and reload-safe. It uses `history.replaceState` rather than `pushState`, so changing filters doesn't fill the Back button with one entry per keystroke. Search input is debounced for the same reason.

**UI states.** The `<main>` element has a `data-state` attribute (`loading`, `ready`, `empty` or `error`), and CSS decides what is visible for each. JavaScript flips one attribute instead of showing and hiding elements one by one. Skeletons are pure CSS shimmer placeholders shown while loading. The empty state appears when filters match nothing. The error state shows the failure reason and a Retry button that re-runs the same load function.

**Static data, relative dates.** "Last 7 days" is measured from the newest video in the data set, not from today. Otherwise the static sample data would slowly age out and the demo would show empty filters a few weeks after deployment.

**Why Chart.js.** Hand-drawing charts with canvas or SVG is possible, but tooltips, responsive resizing, axes and accessibility hooks are a lot of code that isn't the point of this project. Chart.js is small, well documented, loads from a CDN with no build step, and its update API (`chart.update()`) fits the render loop: each chart is created once and then updated in place. Chart colours are read from CSS custom properties so the theme lives in one place. If the CDN fails, the rest of the dashboard still works.

## Run locally

`fetch()` doesn't work over `file://`, so serve the folder over HTTP:

```bash
npx serve .
# or
python -m http.server 8000
```

## How it was built

This project was built with AI-assisted development using [Claude Code](https://claude.com/claude-code). I reviewed the code, tested every feature, and can explain each decision.
