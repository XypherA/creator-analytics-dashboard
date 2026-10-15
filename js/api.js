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
 * Fetches and normalizes the sample videos.
 * @param {{ simulateError?: boolean }} options - simulateError forces a failure for demos.
 * @returns {Promise<object[]>}
 */
export async function fetchVideos({ simulateError = false } = {}) {
  await wait(ARTIFICIAL_DELAY_MS);

  if (simulateError) {
    throw new Error('Simulated network error (the URL contains ?error=1).');
  }

  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(`The server responded with ${response.status} ${response.statusText}.`);
  }

  const data = await response.json();
  return data.videos.map(normalizeVideo);
}
