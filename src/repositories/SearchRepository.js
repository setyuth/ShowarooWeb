/**
 * @file Search data access. Multi-search across movies/TV/people plus scoped
 * searches. Supports cancellation via AbortSignal for live search (Phase 9).
 */

import { BaseRepository } from './BaseRepository.js';
import { toCardPage } from './mappers.js';

export class SearchRepository extends BaseRepository {
  /**
   * @param {string} query @param {{ page?: number, signal?: AbortSignal }} [opts]
   */
  multi(query, { page = 1, signal } = {}) {
    return this.fetchMapped('/search/multi', (r) => toCardPage(r, this.images),
      { params: { query, page, include_adult: false }, ttl: this.ttl.short, signal });
  }
  /** @param {string} query @param {{ page?: number, signal?: AbortSignal }} [opts] */
  movies(query, { page = 1, signal } = {}) {
    return this.fetchMapped('/search/movie', (r) => toCardPage(r, this.images),
      { params: { query, page, include_adult: false }, ttl: this.ttl.short, signal });
  }
  /** @param {string} query @param {{ page?: number, signal?: AbortSignal }} [opts] */
  tv(query, { page = 1, signal } = {}) {
    return this.fetchMapped('/search/tv', (r) => toCardPage(r, this.images),
      { params: { query, page }, ttl: this.ttl.short, signal });
  }
}