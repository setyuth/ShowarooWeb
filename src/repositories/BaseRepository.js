/**
 * @file Base repository. Wraps TmdbService.get and applies a mapper to the
 * successful payload, preserving the Result contract end-to-end.
 */

import { CACHE_TTL } from '../config/index.js';

export class BaseRepository {
  /** @type {import('../services/tmdb/TmdbService.js').TmdbService} */ #tmdb;

  /** @param {import('../services/tmdb/TmdbService.js').TmdbService} tmdb */
  constructor(tmdb) { this.#tmdb = tmdb; }

  /** Expose the image builder for mappers that need URLs. @returns {import('../services/tmdb/ImageService.js').ImageService} */
  get images() { return this.#tmdb.images; }

  /**
   * Fetch a path and map the payload. Errors pass through untouched.
   * @template TRaw, TOut
   * @param {string} path
   * @param {(raw: TRaw) => TOut} map
   * @param {import('../services/tmdb/TmdbService.js').TmdbGetOptions} [options]
   * @returns {Promise<import('../core/Result.js').Result<TOut>>}
   */
  async fetchMapped(path, map, options) {
    const result = await this.#tmdb.get(path, options);
    if (!result.ok) return result;
    return { ok: true, value: map(/** @type {TRaw} */ (result.value)) };
  }

  /** Shared TTL classes so every repository tunes caching consistently. */
  get ttl() { return CACHE_TTL; }
}