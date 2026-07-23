/**
 * @file Discover repository. Wraps TMDB /discover, /genre, and
 * /configuration/countries for the Discover page's filter set (genre, year,
 * country) and the recommendation engine's genre-based candidate generation.
 * Isolated like all other repositories; returns app view models, never raw
 * TMDB shapes.
 */

import { BaseRepository } from './BaseRepository.js';
import { toCardPage } from './mappers.js';

/**
 * @typedef {{ id: number, name: string }} Genre
 * @typedef {{ code: string, name: string }} Country
 * @typedef {object} DiscoverFilters
 * @property {'movie'|'tv'} [mediaType]        Default 'movie'.
 * @property {number[]} [genreIds]
 * @property {number|string} [year]            Primary release / first air year.
 * @property {string} [country]                ISO 3166-1 alpha-2, e.g. 'US'.
 * @property {string} [sortBy]                 TMDB sort_by value. Default 'popularity.desc'.
 * @property {number} [page]                   Default 1.
 */

export class DiscoverRepository extends BaseRepository {
  /**
   * Movies matching any of the given genre ids, popularity-sorted.
   * Kept for the recommendation engine's existing usage.
   * @param {number[]} genreIds @param {{ page?: number }} [opts]
   */
  byGenres(genreIds, { page = 1 } = {}) {
    return this.fetchMapped('/discover/movie', (r) => toCardPage(r, this.images), {
      params: { with_genres: genreIds.join('|'), sort_by: 'popularity.desc', page, include_adult: false },
      ttl: this.ttl.medium,
    });
  }

  /**
   * General-purpose filtered discovery for the Discover page.
   * @param {DiscoverFilters} [filters]
   */
  filter({ mediaType = 'movie', genreIds = [], year, country, sortBy = 'popularity.desc', page = 1 } = {}) {
    /** @type {Record<string, string|number|boolean>} */
    const params = { sort_by: sortBy, page, include_adult: false };
    if (genreIds.length) params.with_genres = genreIds.join(',');
    if (year) params[mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year;
    if (country) params.with_origin_country = country;

    return this.fetchMapped(`/discover/${mediaType}`, (r) => toCardPage(r, this.images), {
      params, ttl: this.ttl.short,
    });
  }

  /** Movie genre list (id + name), long-cached — this changes essentially never. */
  movieGenres() {
    return this.fetchMapped('/genre/movie/list', /** @param {{genres: Genre[]}} r */ (r) => r.genres ?? [],
      { ttl: this.ttl.long });
  }

  /** TV genre list (id + name), long-cached. */
  tvGenres() {
    return this.fetchMapped('/genre/tv/list', /** @param {{genres: Genre[]}} r */ (r) => r.genres ?? [],
      { ttl: this.ttl.long });
  }

  /** Country list for the origin-country filter, alphabetized, long-cached. */
  countries() {
    return this.fetchMapped('/configuration/countries',
      /** @param {Array<{iso_3166_1: string, english_name: string}>} raw */
      (raw) => raw
        .map((c) => ({ code: c.iso_3166_1, name: c.english_name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      { ttl: this.ttl.long });
  }
}