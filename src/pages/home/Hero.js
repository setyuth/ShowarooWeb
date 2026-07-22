/**
 * @file Hero banner (DS 11). Cinematic backdrop with gradient scrim, logo/title,
 * metadata, overview, and primary actions. Picks a spotlight item from a trending
 * result. Backdrop uses a responsive srcset; text stays readable via the scrim.
 */

import { Component } from '../../components/Component.js';
import { Button } from '../../components/Button/Button.js';
import { createElement } from '../../utils/dom.js';
import { truncate } from '../../utils/format.js';

/**
 * @typedef {object} HeroProps
 * @property {object} media          Detail-ish model with backdrop + overview.
 * @property {(id: string|number, type: string) => void} onPlay
 * @property {(id: string|number, type: string) => void} onDetails
 */

export class Hero extends Component {
  /** @param {HeroProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { media, onPlay, onDetails } = this.props;
    const hero = createElement('section', {
      className: 'hero', attrs: { 'aria-label': `Featured: ${media.title}` },
    });

    if (media.backdropUrl) {
      const img = createElement('img', {
        className: 'hero__backdrop',
        attrs: {
          src: media.backdropUrl, srcset: media.backdropSrcset ?? '',
          sizes: '100vw', alt: '', loading: 'eager', fetchpriority: 'high', decoding: 'async',
        },
      });
      hero.append(img);
    }
    hero.append(createElement('div', { className: 'hero__scrim', attrs: { 'aria-hidden': 'true' } }));

    const content = createElement('div', { className: 'hero__content container' });
    if (media.logoUrl) {
      content.append(createElement('img', { className: 'hero__logo', attrs: { src: media.logoUrl, alt: media.title } }));
    } else {
      content.append(createElement('h1', { className: 'hero__title', text: media.title }));
    }
    const meta = [media.year, media.rating && `★ ${media.rating}`, media.runtime].filter(Boolean).join('  ·  ');
    if (meta) content.append(createElement('p', { className: 'hero__meta', text: meta }));
    if (media.overview) content.append(createElement('p', { className: 'hero__overview', text: truncate(media.overview, 220) }));

    const actions = createElement('div', { className: 'hero__actions' });
    new Button({ label: 'Play', variant: 'primary', size: 'lg', onClick: () => onPlay(media.id, media.mediaType) }).mount(actions);
    new Button({ label: 'More Info', variant: 'outline', size: 'lg', onClick: () => onDetails(media.id, media.mediaType) }).mount(actions);
    content.append(actions);

    hero.append(content);
    return hero;
  }
}