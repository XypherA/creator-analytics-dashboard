import { formatCompact, formatInteger, formatPercent } from './format.js';

// How each KPI is displayed. `exact` (optional) becomes a tooltip, so a
// compact "1.2M" can still be checked against the precise number.
const KPI_FORMATS = {
  totalViews: { display: formatCompact, exact: formatInteger },
  totalLikes: { display: formatCompact, exact: formatInteger },
  engagementRate: { display: formatPercent },
  videoCount: { display: formatInteger },
};

/**
 * Aggregates the headline numbers for a set of videos.
 * Engagement is total interactions ÷ total views (weighted by views) rather
 * than the mean of per-video rates, so a tiny Short with a lucky 20% rate
 * can't inflate the channel-wide figure.
 */
export function computeKpis(videos) {
  const totals = videos.reduce(
    (sum, video) => ({
      views: sum.views + video.views,
      likes: sum.likes + video.likes,
      interactions: sum.interactions + video.likes + video.comments + video.shares,
    }),
    { views: 0, likes: 0, interactions: 0 }
  );

  return {
    totalViews: totals.views,
    totalLikes: totals.likes,
    engagementRate: totals.views > 0 ? totals.interactions / totals.views : 0,
    videoCount: videos.length,
  };
}

/** Writes KPI values into the elements marked with data-kpi="<key>". */
export function renderKpis(container, kpis) {
  container.querySelectorAll('[data-kpi]').forEach((element) => {
    const key = element.dataset.kpi;
    const { display, exact } = KPI_FORMATS[key];

    element.textContent = display(kpis[key]);
    element.title = exact ? exact(kpis[key]) : '';
  });
}
