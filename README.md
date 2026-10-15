# Creator Analytics Dashboard

An analytics dashboard for **@xypherfact**, my YouTube Shorts channel, built with plain HTML, CSS and vanilla JavaScript: no framework, no build step.

My channel makes "what if [character] woke up in [ancient era]" Shorts, and YouTube Studio doesn't make it easy to ask simple questions like *"which setting performs best?"* or *"how did last month's uploads do?"*. This project gives me a focused, filterable view of my own Shorts.

> **Data:** a real snapshot of the channel's 52 public Shorts (taken Oct 16, 2026), pulled through vidIQ from the YouTube Data API and YouTube Analytics. It is a snapshot, not live. See [Data](#data) below.

**Live demo:** https://xyphera.github.io/creator-analytics-dashboard/

## Features

- **KPI cards**: total views, total likes, average engagement rate and video count, with compact formatting (`1.2M`) and the exact value on hover
- **Views over time**: line chart, one point per Short on a true time axis
- **Views by setting**: horizontal bar chart (Ancient Rome, Babylon, Feudal Japan and so on), sorted highest first
- **Sortable table**: click any column header; direction is shown visually and with `aria-sort`; titles link to the Short on YouTube
- **Filters**: title search, setting and date range (last 7 / 30 / 90 days or all uploads); KPIs, charts and table all update together
- **Shareable URLs**: filter and sort state lives in the query string, e.g. `?q=iron%20man&range=90&sort=views`
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

## Data

`data/videos.json` holds one entry per public Short:

| Field | Source |
|---|---|
| `views`, `likes`, `comments`, title, publish date, duration | YouTube Data API (public counts) |
| `shares` | YouTube Analytics (owner-only metric) |
| `category` | Derived: the setting named in the title (e.g. "...in Ancient Rome"). Titles with no historical setting are grouped as "Modern & other". |

The file also records its source and snapshot date, and the header badge and footer are rendered from those fields, so the "real data" label always matches the data actually loaded.

**Why a snapshot instead of live data?** GitHub Pages only serves static files. Calling YouTube Analytics needs OAuth credentials, which must never ship in browser JavaScript. Making it live would need a small backend, or a scheduled GitHub Action that refreshes `videos.json` with a stored secret. Because only `api.js` knows where data comes from, that change wouldn't touch the rest of the app.

## Key front-end decisions

**One state object, one data flow.** Every interaction (typing, picking a category, clicking a column) calls `setState()`. That updates a single state object, mirrors it to the URL and triggers one `render()`, which filters the data and redraws the KPIs, charts and table. No component keeps its own copy of the filters, so the parts of the page can't fall out of sync. Filtering, sorting and KPI maths are pure functions, which keeps them easy to test and reason about.

**URL sync.** State is serialized into the query string (only non-default values, so the default URL stays clean) and read back and validated on page load. That makes any view shareable and reload-safe. It uses `history.replaceState` rather than `pushState`, so changing filters doesn't fill the Back button with one entry per keystroke. Search input is debounced for the same reason.

**UI states.** The `<main>` element has a `data-state` attribute (`loading`, `ready`, `empty` or `error`), and CSS decides what is visible for each. JavaScript flips one attribute instead of showing and hiding elements one by one. Skeletons are pure CSS shimmer placeholders shown while loading. The empty state appears when filters match nothing. The error state shows the failure reason and a Retry button that re-runs the same load function.

**Snapshot data, relative dates.** "Last 7 days" is measured from the newest upload, not from today. The data is a snapshot, and the channel doesn't post every week, so anchoring to today would often show an empty dashboard. The summary line says which date the ranges count back from.

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
