/** @file Collection, company, and network data access. */

import { BaseRepository } from './BaseRepository.js';
import { toCollectionDetail, toCardPage } from './mappers.js';

export class CollectionRepository extends BaseRepository {
  /** @param {string|number} id */
  detail(id) {
    return this.fetchMapped(`/collection/${id}`, (r) => toCollectionDetail(r, this.images),
      { ttl: this.ttl.long });
  }
}

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

export class NetworkRepository extends BaseRepository {
  /** @param {string|number} id @param {number} [page] */
  shows(id, page = 1) {
    return this.fetchMapped('/discover/tv', (r) => toCardPage(r, this.images),
      { params: { with_networks: id, page }, ttl: this.ttl.long });
  }
}