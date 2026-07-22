/**
 * @file Horizontal content rail. A titled, scrollable row of MediaCards with
 * keyboard-accessible scroll controls. Wires each card's favorite/watch-later
 * and open callbacks to the caller (which bridges to AppState + Router).
 */

import { Component } from '../../components/Component.js';
import { MediaCard } from '../../components/Card/MediaCard.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} ContentRailProps
 * @property {string} title
 * @property {import('../../components/Card/MediaCard.js').MediaCardModel[]} items
 * @property {(id: string|number, type: string) => void} onOpen
 * @property {(m: any) => void} onToggleFavorite
 * @property {(m: any) => void} onToggleWatchLater
 * @property {(id: string|number, type: string) => boolean} isFavorite
 * @property {(id: string|number, type: string) => boolean} isWatchLater
 */

export class ContentRail extends Component {
  /** @param {ContentRailProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { title, items, onOpen, onToggleFavorite, onToggleWatchLater, isFavorite, isWatchLater } = this.props;
    const rail = createElement('section', { className: 'rail', attrs: { 'aria-label': title } });

    const head = createElement('div', { className: 'rail__head container' });
    head.append(createElement('h2', { className: 'rail__title', text: title }));
    rail.append(head);

    const track = createElement('div', {
      className: 'rail__track', attrs: { role: 'list', tabindex: '0', 'aria-label': `${title} titles` },
    });
    for (const item of items) {
      const model = { ...item, isFavorite: isFavorite(item.id, item.mediaType), isWatchLater: isWatchLater(item.id, item.mediaType) };
      const cardWrap = createElement('div', { className: 'rail__item', attrs: { role: 'listitem' } });
      new MediaCard({
        model,
        onOpen: (id) => onOpen(id, item.mediaType),
        onToggleFavorite: () => onToggleFavorite(item),
        onToggleWatchLater: () => onToggleWatchLater(item),
      }).mount(cardWrap);
      track.append(cardWrap);
    }
    rail.append(track);
    return rail;
  }
}