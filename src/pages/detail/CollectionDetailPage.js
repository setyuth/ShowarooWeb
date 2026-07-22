/** @file Collection / company / network detail: header + a grid or rail of titles. */

import { DetailPage } from './DetailPage.js';
import { MediaCard } from '../../components/Card/MediaCard.js';
import { createGrid } from '../../layout/Grid.js';
import { createElement } from '../../utils/dom.js';

export class CollectionDetailPage extends DetailPage {
  /** @param {any} deps @param {string|number} id */
  constructor(deps, id) { super(deps); this.collection = deps.collection; this.id = id; }
  loadDetail() { return this.collection.detail(this.id); }
  /** @param {any} m */
  renderBody(m) { return this.#grid(m.parts); }
  /** @param {any[]} items */
  #grid(items) {
    const body = createElement('div', { className: 'container' });
    const cards = (items ?? []).map((item) => { const w = createElement('div'); new MediaCard({ model: item, onOpen: (id) => this.detailDeps.router.navigate(`/${item.mediaType}/${id}`) }).mount(w); return w; });
    body.append(createGrid({ min: '160px', children: cards }));
    return body;
  }
}

export class CompanyDetailPage extends DetailPage {
  /** @param {any} deps @param {string|number} id */
  constructor(deps, id) { super(deps); this.company = deps.company; this.id = id; }
  loadDetail() { return this.company.movies(this.id); }
  header() { return createElement('section', { className: 'detail__header detail__header--plain container' }); }
  /** @param {any} page */
  renderBody(page) {
    const body = createElement('div', { className: 'container' });
    body.append(createElement('h1', { className: 'detail__title', text: 'Studio' }));
    const cards = (page.items ?? []).map((item) => { const w = createElement('div'); new MediaCard({ model: item, onOpen: (id) => this.detailDeps.router.navigate(`/${item.mediaType}/${id}`) }).mount(w); return w; });
    body.append(createGrid({ min: '160px', children: cards }));
    return body;
  }
}

export class NetworkDetailPage extends CompanyDetailPage {
  /** @param {any} deps @param {string|number} id */
  constructor(deps, id) { super(deps, id); this.network = deps.network; }
  loadDetail() { return this.network.shows(this.id); }
}