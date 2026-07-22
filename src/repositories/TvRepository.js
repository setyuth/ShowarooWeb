/** @file TV show data access. Mirrors MovieRepository for TV endpoints. */

import { BaseRepository } from './BaseRepository.js';
import { toCardPage, toTvDetail } from './mappers.js';

export class TvRepository extends BaseRepository {
  /** @param {number} [page] */
  trending(page = 1) {
    return this.fetchMapped('/trending/tv/week', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.short });
  }
  /** @param {number} [page] */
  popular(page = 1) {
    return this.fetchMapped('/tv/popular', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.medium });
  }
  /** @param {number} [page] */
  topRated(page = 1) {
    return this.fetchMapped('/tv/top_rated', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.long });
  }
  /** @param {number} [page] */
  airingToday(page = 1) {
    return this.fetchMapped('/tv/airing_today', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.short });
  }
  /** @param {number} [page] */
  onTheAir(page = 1) {
    return this.fetchMapped('/tv/on_the_air', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.short });
  }
  /** @param {string|number} id */
  detail(id) {
    return this.fetchMapped(`/tv/${id}`, (r) => toTvDetail(r, this.images),
      { params: { append_to_response: 'credits,videos,images,recommendations' }, ttl: this.ttl.long });
  }
  /** @param {string|number} id @param {number} [page] */
  similar(id, page = 1) {
    return this.fetchMapped(`/tv/${id}/similar`, (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.long });
  }
}