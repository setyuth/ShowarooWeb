/**
 * @file Minimal fetch wrapper: timeout via AbortController, JSON parsing, and
 * normalized errors as Result. No TMDB knowledge here; it is a generic client.
 */

import { ok, err } from '../../core/Result.js';
import { retry } from '../../utils/async.js';

export class HttpClient {
  /** @type {number} */ #timeout;
  /** @type {number} */ #retries;

  /** @param {{ timeout?: number, retries?: number }} [options] */
  constructor({ timeout = 10000, retries = 2 } = {}) {
    this.#timeout = timeout;
    this.#retries = retries;
  }

  /**
   * GET JSON with timeout + bounded retry on transient failures.
   * @template T
   * @param {string} url
   * @param {{ headers?: Record<string,string>, signal?: AbortSignal }} [options]
   * @returns {Promise<import('../../core/Result.js').Result<T>>}
   */
  async getJson(url, { headers = {}, signal } = {}) {
    try {
      const data = await retry(() => this.#once(url, headers, signal), {
        retries: this.#retries,
        baseDelay: 400,
        // Retry only transient conditions: network error, 429, 5xx.
        shouldRetry: (error) => error instanceof TransientError,
      });
      return ok(/** @type {T} */ (data));
    } catch (error) {
      if (error instanceof HttpError) {
        return err(`TMDB_HTTP_${error.status}`, error.message, error);
      }
      if (error?.name === 'AbortError') {
        return err('TMDB_TIMEOUT', `Request timed out after ${this.#timeout}ms`, error);
      }
      return err('TMDB_NETWORK', 'Network request failed', error);
    }
  }

  /** @param {string} url @param {Record<string,string>} headers @param {AbortSignal} [external] */
  async #once(url, headers, external) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeout);
    // Honor an externally-provided abort signal (e.g. cancelled search).
    if (external) external.addEventListener('abort', () => controller.abort(), { once: true });
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      if (!res.ok) {
        const transient = res.status === 429 || res.status >= 500;
        const message = `TMDB responded ${res.status}`;
        throw transient ? new TransientError(message, res.status) : new HttpError(message, res.status);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
}

export class HttpError extends Error {
  /** @param {string} message @param {number} status */
  constructor(message, status) { super(message); this.name = 'HttpError'; this.status = status; }
}
export class TransientError extends HttpError {
  constructor(message, status) { super(message, status); this.name = 'TransientError'; }
}