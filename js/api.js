// Data access. This is the only module that knows where the data comes from,
// so swapping the JSON file for the real YouTube API would only touch this file.

// Relative path so the app works from a GitHub Pages sub-folder.
const DATA_URL = 'data/videos.json';

// A local JSON file loads almost instantly; the delay makes the loading
// skeletons visible so the UI state can be demoed.
const ARTIFICIAL_DELAY_MS = 800;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Adds fields derived once at load time, so filtering, sorting and rendering
 * never re-parse dates or recompute the same ratio.
 */
function normalizeVideo(video) {
  const interactions = video.likes + video.comments + video.shares;

  return {
    ...video,
    publishedAt: Date.parse(video.publishDate),
    engagementRate: video.views > 0 ? interactions / video.views : 0,
  };
}

/**
 * Fetches and normalizes the channel's Shorts.
 * @param {{ simulateError?: boolean }} options - simulateError forces a failure for demos.
 * @returns {Promise<{ meta: { isSample: boolean, source: string, snapshotDate: number }, videos: object[] }>}
 */
export async function fetchVideos({ simulateError = false } = {}) {
  await wait(ARTIFICIAL_DELAY_MS);

  if (simulateError) {
    throw new Error('Simulated network error from the ?error=1 demo flag.');
  }

  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(`The server responded with ${response.status} ${response.statusText}.`);
  }

  const { videos, isSample, source, snapshotDate } = await response.json();

  return {
    meta: { isSample, source, snapshotDate: Date.parse(snapshotDate) },
    videos: videos.map(normalizeVideo),
  };
}
