/**
 * @file Media (Movie/TV) card. DS §10.
 * Poster, rating, year, genres, favorite + watch-later actions, optional
 * continue-watching progress. Interactions: hover lift/scale (via CSS tokens),
 * keyboard focus, overlay actions. Data-shape-agnostic: takes a plain view model,
 * so it stays decoupled from TMDB (repositories map to this in later phases).
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';
import { Badge } from '../Badge/Badge.js';
import { ProgressBar } from '../ProgressBar/ProgressBar.js';

/**
 * @typedef {object} MediaCardModel
 * @property {string|number} id
 * @property {string} title
 * @property {string} [posterUrl]
 * @property {string} [year]
 * @property {string} [rating]         Preformatted, e.g. '8.4'.
 * @property {string[]} [genres]
 * @property {number} [progress]       0–100 for Continue Watching.
 * @property {boolean} [isFavorite]
 * @property {boolean} [isWatchLater]
 *
 * @typedef {object} MediaCardProps
 * @property {MediaCardModel} model
 * @property {(id: string|number) => void} [onOpen]
 * @property {(id: string|number) => void} [onToggleFavorite]
 * @property {(id: string|number) => void} [onToggleWatchLater]
 */

export class MediaCard extends Component {
  /** @param {MediaCardProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { model, onOpen, onToggleFavorite, onToggleWatchLater } = this.props;
    const card = createElement('article', {
      className: 'ui-card',
      attrs: { tabindex: '0', role: 'button', 'aria-label': model.title },
    });

    // Poster (lazy). Real blur-up placeholders arrive in Phase 18.
    const media = createElement('div', { className: 'ui-card__media' });
    if (model.posterUrl) {
      media.append(createElement('img', {
        className: 'ui-card__poster',
        attrs: { src: model.posterUrl, alt: '', loading: 'lazy', decoding: 'async' },
      }));
    } else {
      media.append(createElement('div', { className: 'ui-card__poster ui-card__poster--empty', attrs: { 'aria-hidden': 'true' } }));
    }
    if (model.rating) new Badge({ label: model.rating, tone: 'rating', icon: this.#starIcon() }).mount(media);

    // Overlay actions (favorite / watch later).
    const overlay = createElement('div', { className: 'ui-card__actions' });
    if (onToggleFavorite) overlay.append(this.#actionBtn('favorite', model.isFavorite ?? false, model.title, () => onToggleFavorite(model.id)));
    if (onToggleWatchLater) overlay.append(this.#actionBtn('watch-later', model.isWatchLater ?? false, model.title, () => onToggleWatchLater(model.id)));
    media.append(overlay);

    if (typeof model.progress === 'number') {
      new ProgressBar({ value: model.progress, label: `${model.title} watch progress` }).mount(media);
    }
    card.append(media);

    // Body: title + meta.
    const body = createElement('div', { className: 'ui-card__body' });
    body.append(createElement('h3', { className: 'ui-card__title', text: model.title }));
    const metaBits = [model.year, (model.genres ?? []).slice(0, 2).join(', ')].filter(Boolean);
    if (metaBits.length) body.append(createElement('p', { className: 'ui-card__meta', text: metaBits.join(' · ') }));
    card.append(body);

    // Open interactions: click + Enter/Space (native button semantics on a div-role).
    if (onOpen) {
      this.on(card, 'click', (e) => { if (!(/** @type {HTMLElement} */ (e.target)).closest('.ui-card__actions')) onOpen(model.id); });
      this.on(card, 'keydown', (e) => {
        const key = /** @type {KeyboardEvent} */ (e).key;
        if (key === 'Enter' || key === ' ') { e.preventDefault(); onOpen(model.id); }
      });
    }
    return card;
  }

  /**
   * Small inline star glyph for the rating badge. No icon font/sprite system
   * exists yet, so this is self-contained SVG rather than a data-icon hook.
   * @returns {SVGSVGElement}
   */
  #starIcon() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('width', '11');
    svg.setAttribute('height', '11');
    svg.setAttribute('fill', 'currentColor');
    svg.innerHTML = '<path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L10 14.8l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.7z"/>';
    return /** @type {SVGSVGElement} */ (svg);
  }

  /**
   * @param {string} kind @param {boolean} active @param {string} title @param {() => void} onClick
   * @returns {HTMLElement}
   */
  #actionBtn(kind, active, title, onClick) {
    const verb = kind === 'favorite' ? 'favorite' : 'watch later';
    const btn = createElement('button', {
      className: `ui-card__action ui-card__action--${kind}${active ? ' is-active' : ''}`,
      attrs: {
        type: 'button',
        'aria-pressed': String(active),
        'aria-label': `${active ? 'Remove from' : 'Add to'} ${verb}: ${title}`,
      },
      dataset: { icon: kind },
    });
    this.on(btn, 'click', (e) => { e.stopPropagation(); onClick(); });
    return btn;
  }
}