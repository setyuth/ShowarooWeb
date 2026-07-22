/**
 * @file TTL cache for TMDB responses. Two-tier: an in-memory Map for the current
 * session (fast, avoids JSON churn) backed by localStorage for cross-session
 * persistence (master plan §15). Keys are namespaced under the tmdb cache key.
 */

import { STORAGE_KEYS } from '../../config/index.js';

export class TmdbCache {
  /** @type {Map<string, { value: unknown, expires: number }>} */ #mem = new Map();
  /** @type {import('../storage/StorageService.js').StorageService} */ #store;

  /** @param {import('../storage/StorageService.js').StorageService} store */
  constructor(store) { this.#store = store; }

  /** @param {string} key @returns {string} */
  #diskKey(key) { return `${STORAGE_KEYS.tmdbCache}:${key}`; }

  /**
   * @template T
   * @param {string} key
   * @returns {T | null}
   */
  get(key) {
    const hit = this.#mem.get(key);
    if (hit) {
      if (Date.now() < hit.expires) return /** @type {T} */ (hit.value);
      this.#mem.delete(key);
    }
    // Fall back to disk (StorageService already enforces its own TTL envelope).
    const disk = this.#store.get(this.#diskKey(key), null);
    if (disk !== null) {
      // Rehydrate memory tier without a known expiry; disk TTL governs validity.
      this.#mem.set(key, { value: disk, expires: Date.now() });
      return /** @type {T} */ (disk);
    }
    return null;
  }

  /**
   * @param {string} key
   * @param {unknown} value
   * @param {number} ttl  Milliseconds.
   * @returns {void}
   */
  set(key, value, ttl) {
    this.#mem.set(key, { value, expires: Date.now() + ttl });
    // Persist; storage failures (quota/private mode) are non-fatal for caching.
    this.#store.set(this.#diskKey(key), value, { ttl });
  }
}