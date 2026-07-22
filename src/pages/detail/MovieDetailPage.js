/** @file Movie detail. Header + cast + videos + recommendations. */

import { DetailPage } from './DetailPage.js';
import { createElement } from '../../utils/dom.js';

export class MovieDetailPage extends DetailPage {
  /**
   * @param {import('./DetailPage.js').DetailDeps & { movie: import('../../repositories/index.js').MovieRepository }} deps
   * @param {string|number} id
   */
  constructor(deps, id) { super(deps); this.movie = deps.movie; this.id = id; }

  loadDetail() { return this.movie.detail(this.id); }

  /** @param {any} m @returns {HTMLElement} */
  renderBody(m) {
    const body = createElement('div');
    body.append(this.castSection(m.cast));
    body.append(this.videosSection(m.videos));
    body.append(this.recommendationsSection('More Like This', m.recommendations));
    return body;
  }
}