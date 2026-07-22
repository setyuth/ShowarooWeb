/** @file company. */

import { BaseRepository } from './BaseRepository.js';
import { toCollectionDetail, toCardPage } from './mappers.js';

export class CompanyRepository extends BaseRepository {
  /** @param {string|number} id */
  detail(id) {
    // Company detail is light; movies come via discover, mapped to a card page.
    return this.fetchMapped(`/company/${id}`, (r) => r, { ttl: this.ttl.day });
  }
  /** @param {string|number} id @param {number} [page] */
  movies(id, page = 1) {
    return this.fetchMapped('/discover/movie', (r) => toCardPage(r, this.images),
      { params: { with_companies: id, page }, ttl: this.ttl.long });
  }
}
