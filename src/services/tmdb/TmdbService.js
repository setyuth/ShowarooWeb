/**
 * @file TMDB service facade. The only module that knows TMDB's HTTP surface.
 */

import { CACHE_TTL, TMDB, env } from '../../config/index.js';
import { HttpClient } from './HttpClient.js';
import { RequestManager } from './RequestManager.js';
import { TmdbCache } from './TmdbCache.js';
import { ImageService } from './ImageService.js';

/**
 * @typedef {object} TmdbGetOptions
 * @property {Record<string, string|number|boolean>} [params]  Query params.
 * @property {number} [ttl]        Cache TTL ms; defaults to CACHE_TTL.medium.
 * @property {AbortSignal} [signal] For cancellable calls (e.g. search).
 */

export class TmdbService {
  /** @type {HttpClient} */ #http;
  /** @type {RequestManager} */ #requests;
  /** @type {TmdbCache} */ #cache;
  /** @type {ImageService} */ #images;

  /**
   * @param {object} deps
   * @param {import('../storage/StorageService.js').StorageService} deps.store
   * @param {HttpClient} [deps.http]
   * @param {RequestManager} [deps.requests]
   */
  constructor({ store, http, requests }) {
    this.#http = http ?? new HttpClient();
    this.#requests = requests ?? new RequestManager({ ratePerSecond: 20 });
    this.#cache = new TmdbCache(store);
    this.#images = new ImageService();
  }

  /** Image URL builder for consumers. @returns {ImageService} */
  get images() { return this.#images; }

  /**
   * Cache-first GET against a TMDB endpoint path (e.g. '/movie/popular').
   * @template T
   * @param {string} path
   * @param {TmdbGetOptions} [options]
   * @returns {Promise<import('../../core/Result.js').Result<T>>}
   */
  async get(path, { params = {}, ttl = CACHE_TTL.medium, signal } = {}) {
    const url = this.#buildUrl(path, params);
    const cacheKey = url;

    const cached = this.#cache.get(cacheKey);
    if (cached !== null) return { ok: true, value: /** @type {T} */ (cached) };

    const result = await this.#requests.run(cacheKey, () =>
      this.#http.getJson(url, { headers: this.#authHeaders(), signal }));

    if (result.ok) this.#cache.set(cacheKey, result.value, ttl);
    return result;
  }

  /**
   * Build an authenticated, fully-qualified URL. Adds language + region defaults
   * and the v3 api_key when a bearer token is not in use.
   * @param {string} path
   * @param {Record<string, string|number|boolean>} params
   * @returns {string}
   */
  #buildUrl(path, params) {
    const url = new URL(`${TMDB.apiBaseUrl}${path}`);
    url.searchParams.set('language', TMDB.defaultLanguage);
    if (!env.tmdbAccessToken && env.tmdbApiKey) url.searchParams.set('api_key', env.tmdbApiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    // Stable key ordering so identical logical requests share a cache entry.
    url.searchParams.sort();
    return url.toString();
  }

  /** @returns {Record<string,string>} */
  #authHeaders() {
    const headers = { accept: 'application/json' };
    if (env.tmdbAccessToken) headers.authorization = `Bearer ${env.tmdbAccessToken}`;
    return headers;
  }
}