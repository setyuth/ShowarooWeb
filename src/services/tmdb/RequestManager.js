/**
 * @file Coordinates outbound TMDB requests:
 *  - De-duplicates identical in-flight GETs (master plan §15: prevent duplicate
 *    requests) by sharing one promise per URL key.
 *  - Client-side rate limiting via a simple token-bucket to stay well under
 *    TMDB limits and avoid 429 storms.
 */

/**
 * @typedef {object} RequestManagerOptions
 * @property {number} [ratePerSecond]  Max requests/sec. Default 20.
 */

export class RequestManager {
  /** @type {Map<string, Promise<unknown>>} */ #inflight = new Map();
  /** @type {number} */ #capacity;
  /** @type {number} */ #tokens;
  /** @type {number} */ #refillMs;
  /** @type {number} */ #lastRefill = Date.now();
  /** @type {Array<() => void>} */ #waiters = [];

  /** @param {RequestManagerOptions} [options] */
  constructor({ ratePerSecond = 20 } = {}) {
    this.#capacity = ratePerSecond;
    this.#tokens = ratePerSecond;
    this.#refillMs = 1000 / ratePerSecond;
  }

  /**
   * Run `task` for `key`, sharing the in-flight promise for identical keys and
   * respecting the rate limit. Cache is layered above this in TmdbService.
   * @template T
   * @param {string} key
   * @param {() => Promise<T>} task
   * @returns {Promise<T>}
   */
  async run(key, task) {
    const existing = this.#inflight.get(key);
    if (existing) return /** @type {Promise<T>} */ (existing);

    const promise = (async () => {
      await this.#acquire();
      try { return await task(); }
      finally { this.#inflight.delete(key); }
    })();
    this.#inflight.set(key, promise);
    return promise;
  }

  /** Token-bucket acquire. @returns {Promise<void>} */
  async #acquire() {
    this.#refill();
    if (this.#tokens >= 1) { this.#tokens -= 1; return; }
    await new Promise((resolve) => this.#waiters.push(resolve));
    return this.#acquire();
  }

  #refill() {
    const now = Date.now();
    const elapsed = now - this.#lastRefill;
    const gained = Math.floor(elapsed / this.#refillMs);
    if (gained > 0) {
      this.#tokens = Math.min(this.#capacity, this.#tokens + gained);
      this.#lastRefill = now;
      while (this.#tokens >= 1 && this.#waiters.length) {
        this.#tokens -= 1;
        this.#waiters.shift()?.();
      }
    } else if (this.#waiters.length) {
      setTimeout(() => this.#refill(), this.#refillMs);
    }
  }
}