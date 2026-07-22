/**
 * @file Repository barrel + factory. One place assembles all repositories over a
 * single TmdbService, so the container registers them together.
 */

import { MovieRepository } from './MovieRepository.js';
import { TvRepository } from './TvRepository.js';
import { PersonRepository } from './PersonRepository.js';
import { CollectionRepository } from './CollectionRepository.js';
import { CompanyRepository } from './CompanyRepository.js';
import { NetworkRepository } from './NetworkRepository.js';
import { SearchRepository } from './SearchRepository.js';

export { toCardModel } from './mappers.js';

/**
 * @param {import('../services/tmdb/TmdbService.js').TmdbService} tmdb
 * @returns {{ movie: MovieRepository, tv: TvRepository, person: PersonRepository,
 *   collection: CollectionRepository, company: CompanyRepository,
 *   network: NetworkRepository, search: SearchRepository }}
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
  };
}