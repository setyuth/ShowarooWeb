/**
 * @file Movie data access. Trending/popular/top-rated/upcoming/now-playing
 * lists + full detail. No TMDB shapes escape this file (via mappers).
 */

import { BaseRepository } from './BaseRepository.js';
import { toCardPage, toMovieDetail } from './mappers.js';

export class MovieRepository extends BaseRepository {
  /** @param {number} [page] */
  trending(page = 1) {
    return this.fetchMapped('/trending/movie/week', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.short });
  }
  /** @param {number} [page] */
  popular(page = 1) {
    return this.fetchMapped('/movie/popular', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.medium });
  }
  /** @param {number} [page] */
  topRated(page = 1) {
    return this.fetchMapped('/movie/top_rated', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.long });
  }
  /** @param {number} [page] */
  upcoming(page = 1) {
    return this.fetchMapped('/movie/upcoming', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.medium });
  }
  /** @param {number} [page] */
  nowPlaying(page = 1) {
    return this.fetchMapped('/movie/now_playing', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.short });
  }
  /**
   * Full detail in a single request via append_to_response.
   * @param {string|number} id
   */
  detail(id) {
    return this.fetchMapped(`/movie/${id}`, (r) => toMovieDetail(r, this.images),
      { params: { append_to_response: 'credits,videos,images,recommendations' }, ttl: this.ttl.long });
  }
  /** @param {string|number} id @param {number} [page] */
  similar(id, page = 1) {
    return this.fetchMapped(`/movie/${id}/similar`, (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.long });
  }
}