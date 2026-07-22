/**
 * @file Client-side recommendation engine. Blends TMDB recommendations, genre
 * discovery, and trending into ranked, de-duplicated "For You" and
 * "Because you liked X" rails. Falls back to trending on cold start. Isolated
 * behind repositories (no TMDB shapes leak).
 */

import { buildProfile, topGenres } from './TasteProfile.js';

export class RecommendationEngine {
  /** @type {any} */ #movie; /** @type {any} */ #tv;
  /** @type {any} */ #discover; /** @type {import('../state/AppState.js').AppState} */ #state;
  /** @type {{ key: string, value: any } | null} */ #memo = null;

  /**
   * @param {object} deps
   * @param {import('../repositories/index.js').MovieRepository} deps.movie
   * @param {import('../repositories/index.js').TvRepository} deps.tv
   * @param {import('../repositories/DiscoverRepository.js').DiscoverRepository} deps.discover
   * @param {import('../state/AppState.js').AppState} deps.state
   */
  constructor({ movie, tv, discover, state }) {
    this.#movie = movie; this.#tv = tv; this.#discover = discover; this.#state = state;
  }

  /**
   * Personalized "For You" list.
   * @param {{ limit?: number }} [opts]
   * @returns {Promise<import('../core/Result.js').Result<{ items: any[], reason: string }>>}
   */
  async forYou({ limit = 20 } = {}) {
    const profile = buildProfile(this.#state.getState());

    // Cold start: honest fallback to trending, clearly labeled.
    if (profile.coldStart) {
      const trending = await this.#movie.trending();
      if (!trending.ok) return trending;
      return { ok: true, value: { items: trending.value.items.slice(0, limit), reason: 'Trending now' } };
    }

    // Memoize within a session for profile stability.
    const memoKey = this.#profileKey(profile);
    if (this.#memo?.key === memoKey) return { ok: true, value: this.#memo.value };

    const genres = topGenres(profile, 3);
    const [rec, disc, trend] = await Promise.all([
      this.#recommendationsForSeeds(profile.seeds),
      genres.length ? this.#discover.byGenres(genres) : Promise.resolve({ ok: true, value: { items: [] } }),
      this.#movie.trending(),
    ]);

    const pool = [
      ...(rec.ok ? rec.value : []),
      ...(disc.ok ? disc.value.items : []),
      ...(trend.ok ? trend.value.items : []),
    ];
    const ranked = this.#rankAndFilter(pool, profile).slice(0, limit);
    const value = { items: ranked, reason: 'Based on your favorites and history' };
    this.#memo = { key: memoKey, value };
    return { ok: true, value };
  }

  /**
   * "Because you liked X" — similar titles for a specific seed.
   * @param {'movie'|'tv'} type @param {string|number} id @param {string} title
   * @returns {Promise<import('../core/Result.js').Result<{ items:any[], reason:string }>>}
   */
  async becauseYouLiked(type, id, title) {
    const repo = type === 'tv' ? this.#tv : this.#movie;
    const similar = await repo.similar(id);
    if (!similar.ok) return similar;
    const profile = buildProfile(this.#state.getState());
    const items = this.#rankAndFilter(similar.value.items, profile);
    return { ok: true, value: { items, reason: `Because you liked ${title}` } };
  }

  /** @param {import('../state/shape.js').MediaRef[]} seeds @returns {Promise<import('../core/Result.js').Result<any[]>>} */
  async #recommendationsForSeeds(seeds) {
    if (seeds.length === 0) return { ok: true, value: [] };
    const results = await Promise.all(seeds.slice(0, 3).map((s) => {
      const repo = s.mediaType === 'tv' ? this.#tv : this.#movie;
      return repo.detail(s.id);
    }));
    const items = results.flatMap((r) => (r.ok ? r.value.recommendations ?? [] : []));
    return { ok: true, value: items };
  }

  /**
   * De-duplicate, drop already-engaged titles, rank by genre affinity + popularity.
   * @param {any[]} pool @param {import('./TasteProfile.js').Profile} profile @returns {any[]}
   */
  #rankAndFilter(pool, profile) {
    /** @type {Map<string, any>} */ const unique = new Map();
    for (const item of pool) {
      const key = `${item.mediaType}:${item.id}`;
      if (profile.engagedKeys.has(key)) continue;      // don't recommend what they've seen
      if (!unique.has(key)) unique.set(key, item);
    }
    const scored = [...unique.values()].map((item) => {
      const affinity = (item.genreIds ?? []).reduce((sum, gid) => sum + (profile.genreAffinity.get(gid) ?? 0), 0);
      const popularity = item.popularity ?? 0;
      return { item, score: affinity * 10 + popularity };
    });
    return scored.sort((a, b) => b.score - a.score).map((x) => x.item);
  }

  /** @param {import('./TasteProfile.js').Profile} profile @returns {string} */
  #profileKey(profile) {
    return `${profile.engagedKeys.size}:${topGenres(profile, 3).join(',')}`;
  }
}