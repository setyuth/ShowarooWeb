/**
 * @file Bounded LRU map. The in-memory tier of TmdbCache (Phase 5) was unbounded
 * for a session; over a long browsing session that grows. This caps entries and
 * evicts least-recently-used, keeping memory flat. Disk tier + TTL unchanged.
 */

export class LruCache {
  /** @type {Map<string, unknown>} */ #map = new Map();
  /** @type {number} */ #max;

  /** @param {number} [max=300] */
  constructor(max = 300) { this.#max = max; }

  /** @param {string} key @returns {unknown} */
  get(key) {
    if (!this.#map.has(key)) return undefined;
    const v = this.#map.get(key);
    this.#map.delete(key); this.#map.set(key, v); // move to MRU
    return v;
  }

  /** @param {string} key @param {unknown} value */
  set(key, value) {
    if (this.#map.has(key)) this.#map.delete(key);
    this.#map.set(key, value);
    if (this.#map.size > this.#max) {
      this.#map.delete(this.#map.keys().next().value); // evict LRU
    }
  }

  /** @param {string} key @returns {boolean} */
  has(key) { return this.#map.has(key); }
  clear() { this.#map.clear(); }
}