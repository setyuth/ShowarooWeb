/** @file TV detail. Header + seasons + cast + videos + recommendations. */

import { DetailPage } from './DetailPage.js';
import { createElement } from '../../utils/dom.js';

export class TvDetailPage extends DetailPage {
  /**
   * @param {import('./DetailPage.js').DetailDeps & { tv: import('../../repositories/index.js').TvRepository }} deps
   * @param {string|number} id
   */
  constructor(deps, id) { super(deps); this.tv = deps.tv; this.id = id; }

  loadDetail() { return this.tv.detail(this.id); }

  /** @param {any} m @returns {HTMLElement} */
  renderBody(m) {
    const body = createElement('div');
    body.append(this.#seasons(m));
    body.append(this.castSection(m.cast));
    body.append(this.videosSection(m.videos));
    body.append(this.recommendationsSection('More Like This', m.recommendations));
    return body;
  }

  /** @param {any} m @returns {HTMLElement} */
  #seasons(m) {
    const section = createElement('section', { className: 'detail__seasons container' });
    if (!m.seasons?.length) return section;
    section.append(createElement('h2', { className: 'detail__section-title', text: `Seasons (${m.numberOfSeasons})` }));
    const track = createElement('div', { className: 'detail__season-track', attrs: { role: 'list' } });
    for (const s of m.seasons) {
      const card = createElement('div', { className: 'detail__season-card', attrs: { role: 'listitem' } });
      if (s.posterUrl) card.append(createElement('img', { className: 'detail__season-poster', attrs: { src: s.posterUrl, alt: s.name, loading: 'lazy' } }));
      card.append(createElement('span', { className: 'detail__season-name', text: s.name }));
      card.append(createElement('span', { className: 'detail__season-count', text: `${s.episodeCount} episodes` }));
      track.append(card);
    }
    section.append(track);
    return section;
  }
}