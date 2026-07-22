/**
 * @file Discover repository. Wraps TMDB /discover for genre- and criteria-based
 * candidate generation used by the recommendation engine. Isolated like all
 * other repositories; returns card-page view models.
 */

import { BaseRepository } from './BaseRepository.js';
import { toCardPage } from './mappers.js';

export class DiscoverRepository extends BaseRepository {
  /**
   * Movies matching any of the given genre ids, popularity-sorted.
   * @param {number[]} genreIds @param {{ page?: number }} [opts]
   */
  byGenres(genreIds, { page = 1 } = {}) {
    return this.fetchMapped('/discover/movie', (r) => toCardPage(r, this.images), {
      params: { with_genres: genreIds.join('|'), sort_by: 'popularity.desc', page, include_adult: false },
      ttl: this.ttl.medium,
    });
  }
}