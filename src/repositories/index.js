/**
 * @file Repository barrel + a factory that wires all repositories to one
 * TmdbService instance. The app resolves repositories from the container.
 */

import { MovieRepository } from './MovieRepository.js';
import { TvRepository } from './TvRepository.js';
import { PersonRepository } from './PersonRepository.js';
import { CollectionRepository, CompanyRepository, NetworkRepository } from './CollectionRepository.js';
import { SearchRepository } from './SearchRepository.js';
import { DiscoverRepository } from './DiscoverRepository.js';

export {
  MovieRepository, TvRepository, PersonRepository, CollectionRepository,
  CompanyRepository, NetworkRepository, SearchRepository, DiscoverRepository,
};

/**
 * @param {import('../services/tmdb/TmdbService.js').TmdbService} tmdb
 * @returns {{ movie: MovieRepository, tv: TvRepository, person: PersonRepository,
 *   collection: CollectionRepository, company: CompanyRepository,
 *   network: NetworkRepository, search: SearchRepository, discover: DiscoverRepository }}
 */
export function createRepositories(tmdb) {
  return {
    movie: new MovieRepository(tmdb),
    tv: new TvRepository(tmdb),
    person: new PersonRepository(tmdb),
    collection: new CollectionRepository(tmdb),
    company: new CompanyRepository(tmdb),
    network: new NetworkRepository(tmdb),
    search: new SearchRepository(tmdb),
    discover: new DiscoverRepository(tmdb),
  };
}