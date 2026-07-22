/**
 * @file Builds a genre-weighted taste profile from local engagement signals.
 * Pure: takes a state snapshot, returns a ranked genre affinity map + seed items.
 */

/** Signal weights: stronger intent counts more. */
const WEIGHT = Object.freeze({ favorite: 3, continueWatching: 2.5, watchLater: 1.5, viewed: 1 });

/**
 * @typedef {object} Profile
 * @property {Map<number, number>} genreAffinity  genreId → score.
 * @property {import('../state/shape.js').MediaRef[]} seeds  Recent high-signal items.
 * @property {Set<string>} engagedKeys  `${type}:${id}` to exclude from results.
 * @property {boolean} coldStart
 */

/**
 * @param {import('../state/shape.js').AppStateShape} state
 * @returns {Profile}
 */
export function buildProfile(state) {
  /** @type {Map<number, number>} */ const genreAffinity = new Map();
  /** @type {Set<string>} */ const engagedKeys = new Set();

  /** @param {import('../state/shape.js').MediaRef[]} list @param {number} weight */
  const ingest = (list, weight) => {
    for (const m of list) {
      engagedKeys.add(`${m.mediaType}:${m.id}`);
      for (const gid of m.genreIds ?? []) {
        genreAffinity.set(gid, (genreAffinity.get(gid) ?? 0) + weight);
      }
    }
  };

  ingest(state.favorites, WEIGHT.favorite);
  ingest(Object.values(state.continueWatching).map((e) => e.media), WEIGHT.continueWatching);
  ingest(state.watchLater, WEIGHT.watchLater);
  ingest(state.recentlyViewed, WEIGHT.viewed);

  // Seeds: most recent favorites + continue-watching, capped.
  const seeds = [...state.favorites, ...Object.values(state.continueWatching).map((e) => e.media)].slice(0, 5);

  return { genreAffinity, seeds, engagedKeys, coldStart: engagedKeys.size === 0 };
}

/**
 * Top-N genre ids by affinity.
 * @param {Profile} profile @param {number} n @returns {number[]}
 */
export function topGenres(profile, n) {
  return [...profile.genreAffinity.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => id);
}