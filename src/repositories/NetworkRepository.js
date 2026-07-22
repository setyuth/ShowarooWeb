/** @file Network data access. */

import { BaseRepository } from './BaseRepository.js';
import { toCollectionDetail, toCardPage } from './mappers.js';

export class NetworkRepository extends BaseRepository {
  /** @param {string|number} id @param {number} [page] */
  shows(id, page = 1) {
    return this.fetchMapped('/discover/tv', (r) => toCardPage(r, this.images),
      { params: { with_networks: id, page }, ttl: this.ttl.long });
  }
}