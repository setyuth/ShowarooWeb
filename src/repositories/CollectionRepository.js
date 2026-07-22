/** @file Collection */

import { BaseRepository } from './BaseRepository.js';
import { toCollectionDetail, toCardPage } from './mappers.js';

export class CollectionRepository extends BaseRepository {
  /** @param {string|number} id */
  detail(id) {
    return this.fetchMapped(`/collection/${id}`, (r) => toCollectionDetail(r, this.images),
      { ttl: this.ttl.long });
  }
}