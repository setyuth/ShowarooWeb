/**
 * @file Reusable library collection page. Renders a persisted list slice as a
 * responsive, reactive grid of MediaCards with per-item remove and a
 * standardized empty state. Subscribes to its slice so add/remove anywhere in
 * the app updates the page live (no manual refresh).
 *
 * Favorites (Phase 14), Watch Later (Phase 15), and History (Phase 16) are all
 * instances of this with different selectors, actions, and copy.
 */

import { Page } from '../Page.js';
import { MediaCard } from '../../components/Card/MediaCard.js';
import { createGrid } from '../../layout/Grid.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} CollectionConfig
 * @property {string} title
 * @property {(s: any) => import('../../state/shape.js').MediaRef[]} selector  Slice selector.
 * @property {(media: import('../../state/shape.js').MediaRef) => void} onRemove
 * @property {string} removeLabel        e.g. 'Remove from Favorites'.
 * @property {string} emptyText
 * @property {string} [emptyCtaLabel]
 * @property {string} [emptyCtaPath]
 */

/**
 * @typedef {object} CollectionDeps
 * @property {import('../../state/AppState.js').AppState} state
 * @property {import('../../layout/Router.js').Router} router
 */

export class CollectionPage extends Page {
  /** @type {CollectionDeps} */ #deps;
  /** @type {CollectionConfig} */ #cfg;
  /** @type {HTMLElement|null} */ #gridSlot = null;
  /** @type {(() => void)|null} */ #unsub = null;

  /** @param {CollectionDeps} deps @param {CollectionConfig} cfg */
  constructor(deps, cfg) { super({}); this.#deps = deps; this.#cfg = cfg; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'library container' });
    const header = createElement('div', { className: 'library__header' });
    header.append(createElement('h1', { className: 'library__title', text: this.#cfg.title }));
    this.#count = createElement('span', { className: 'library__count' });
    header.append(this.#count);
    root.append(header);

    this.#gridSlot = createElement('div', { className: 'library__grid-slot' });
    root.append(this.#gridSlot);

    // Live subscription: re-render the grid whenever the slice changes.
    this.#unsub = this.#deps.state.subscribe(this.#cfg.selector, (items) => this.#renderGrid(items));
    this.addDisposer(() => this.#unsub?.());
    return root;
  }

  /** @type {HTMLElement} */ #count;

  /** @param {import('../../state/shape.js').MediaRef[]} items */
  #renderGrid(items) {
    if (!this.#gridSlot) return;
    this.#count.textContent = items.length ? `${items.length}` : '';
    if (items.length === 0) { this.#gridSlot.replaceChildren(this.#empty()); return; }

    const cards = items.map((media) => {
      const wrap = createElement('div');
      new MediaCard({
        model: {
          ...media,
          onRemove: () => this.#cfg.onRemove(media),
          removeLabel: `${this.#cfg.removeLabel}: ${media.title}`,
        },
        onOpen: (id) => this.#deps.router.navigate(`/${media.mediaType}/${id}`),
      }).mount(wrap);
      return wrap;
    });
    this.#gridSlot.replaceChildren(createGrid({ min: '160px', children: cards }));
  }

  /** @returns {HTMLElement} */
  #empty() {
    const box = createElement('div', { className: 'library__empty' });
    box.append(createElement('p', { text: this.#cfg.emptyText }));
    if (this.#cfg.emptyCtaLabel && this.#cfg.emptyCtaPath) {
      const cta = createElement('button', { className: 'ui-btn ui-btn--primary', text: this.#cfg.emptyCtaLabel, attrs: { type: 'button' } });
      this.on(cta, 'click', () => this.#deps.router.navigate(/** @type {string} */ (this.#cfg.emptyCtaPath)));
      box.append(cta);
    }
    return box;
  }
}