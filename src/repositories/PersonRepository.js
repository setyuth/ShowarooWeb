/** @file Person data access. */

import { BaseRepository } from './BaseRepository.js';
import { toPersonDetail, toCardPage } from './mappers.js';

export class PersonRepository extends BaseRepository {
  /** @param {number} [page] */
  popular(page = 1) {
    return this.fetchMapped('/person/popular', (r) => toCardPage(r, this.images),
      { params: { page }, ttl: this.ttl.medium });
  }
  /** @param {string|number} id */
  detail(id) {
    return this.fetchMapped(`/person/${id}`, (r) => toPersonDetail(r, this.images),
      { params: { append_to_response: 'combined_credits' }, ttl: this.ttl.long });
  }
}