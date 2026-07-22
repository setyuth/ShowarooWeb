/** @file Person detail. Bio + known-for filmography grid. */

import { DetailPage } from './DetailPage.js';
import { MediaCard } from '../../components/Card/MediaCard.js';
import { createGrid } from '../../layout/Grid.js';
import { createElement } from '../../utils/dom.js';
import { formatYear } from '../../utils/format.js';

export class PersonDetailPage extends DetailPage {
  /**
   * @param {import('./DetailPage.js').DetailDeps & { person: import('../../repositories/index.js').PersonRepository }} deps
   * @param {string|number} id
   */
  constructor(deps, id) { super(deps); this.person = deps.person; this.id = id; }

  loadDetail() { return this.person.detail(this.id); }

  /** Person has no backdrop; override header to a profile layout. @param {any} m */
  header(m) {
    const header = createElement('section', { className: 'detail__header detail__header--person' });
    const inner = createElement('div', { className: 'detail__header-inner container' });
    if (m.profileUrl) inner.append(createElement('img', { className: 'detail__poster', attrs: { src: m.profileUrl, alt: `${m.name} photo` } }));
    const info = createElement('div', { className: 'detail__info' });
    info.append(createElement('h1', { className: 'detail__title', text: m.name }));
    const facts = [m.knownFor, m.birthday && `Born ${formatYear(m.birthday)}`, m.placeOfBirth].filter(Boolean).join(' · ');
    if (facts) info.append(createElement('p', { className: 'detail__meta', text: facts }));
    if (m.biography) info.append(createElement('p', { className: 'detail__overview', text: m.biography }));
    inner.append(info);
    header.append(inner);
    return header;
  }

  /** @param {any} m @returns {HTMLElement} */
  renderBody(m) {
    const body = createElement('div', { className: 'container' });
    if (m.credits?.length) {
      body.append(createElement('h2', { className: 'detail__section-title', text: 'Known For' }));
      const cards = m.credits.slice(0, 24).map((item) => {
        const wrap = createElement('div');
        new MediaCard({
          model: item,
          onOpen: (id) => this.detailDeps.router.navigate(`/${item.mediaType}/${id}`),
        }).mount(wrap);
        return wrap;
      });
      body.append(createGrid({ min: '150px', children: cards }));
    }
    return body;
  }
}