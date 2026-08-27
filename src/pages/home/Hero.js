/**
 * @file Hero carousel (DS 11). Cinematic backdrop with gradient scrim, logo/title,
 * metadata, overview, and primary actions — now a proper slideshow over several
 * spotlight items instead of a single static pick. Auto-advances on an interval,
 * pauses on hover/focus, and exposes dot controls for direct navigation.
 */

import { Component } from '../../components/Component.js';
import { Button } from '../../components/Button/Button.js';
import { createElement } from '../../utils/dom.js';
import { truncate } from '../../utils/format.js';

/**
 * @typedef {object} HeroProps
 * @property {object[]} items         Detail-ish models with backdrop + overview.
 * @property {(id: string|number, type: string) => void} onPlay
 * @property {(id: string|number, type: string) => void} onDetails
 * @property {number} [intervalMs]    Auto-advance delay. Default 7000ms.
 */

export class Hero extends Component {
  /** @type {object[]} */ #items = [];
  #index = 0;
  /** @type {number|null} */ #timer = null;
  /** @type {HTMLElement|null} */ #trackEl = null;
  /** @type {HTMLElement|null} */ #dotsEl = null;

  /** @param {HeroProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { items, onPlay, onDetails, intervalMs = 7000 } = this.props;
    this.#items = (items ?? []).filter(Boolean);

    const hero = createElement('section', {
      className: 'hero',
      attrs: this.#items.length > 1
        ? { 'aria-roledescription': 'carousel', 'aria-label': 'Featured titles' }
        : { 'aria-label': `Featured: ${this.#items[0]?.title ?? ''}` },
    });

    if (this.#items.length === 0) return hero;

    const track = createElement('div', { className: 'hero__track' });
    this.#items.forEach((media, i) => {
      const slide = this.#renderSlide(media, onPlay, onDetails, i === 0);
      track.append(slide);
    });
    this.#trackEl = track;
    hero.append(track);

    // Only wire up carousel behavior when there's more than one slide;
    // a single spotlight item just renders as a static hero, same as before.
    if (this.#items.length > 1) {
      const dots = createElement('div', {
        className: 'hero__dots', attrs: { role: 'tablist', 'aria-label': 'Choose featured title' },
      });
      this.#items.forEach((_, i) => {
        const dot = createElement('button', {
          className: 'hero__dot',
          attrs: {
            type: 'button', role: 'tab', 'aria-label': `Show slide ${i + 1}`,
            'aria-selected': i === 0 ? 'true' : 'false',
          },
        });
        if (i === 0) dot.classList.add('is-active');
        this.on(dot, 'click', () => this.#goTo(i, { restart: true }));
        dots.append(dot);
      });
      this.#dotsEl = dots;
      hero.append(dots);

      // Pause on hover/focus so a reader isn't fighting an advancing slide;
      // resume on leave/blur.
      this.on(hero, 'mouseenter', () => this.#stop());
      this.on(hero, 'mouseleave', () => this.#start(intervalMs));
      this.on(hero, 'focusin', () => this.#stop());
      this.on(hero, 'focusout', () => this.#start(intervalMs));

      this.#start(intervalMs);
      this.addDisposer(() => this.#stop());
    }

    return hero;
  }

  /**
   * @param {object} media
   * @param {(id: string|number, type: string) => void} onPlay
   * @param {(id: string|number, type: string) => void} onDetails
   * @param {boolean} isActive
   * @returns {HTMLElement}
   */
  #renderSlide(media, onPlay, onDetails, isActive) {
    const slide = createElement('div', { className: 'hero__slide' });
    if (isActive) slide.classList.add('is-active');

    if (media.backdropUrl) {
      const img = createElement('img', {
        className: 'hero__backdrop',
        attrs: {
          src: media.backdropUrl, srcset: media.backdropSrcset ?? '',
          sizes: '100vw', alt: '', loading: isActive ? 'eager' : 'lazy',
          fetchpriority: isActive ? 'high' : 'auto', decoding: 'async',
        },
      });
      slide.append(img);
    }
    slide.append(createElement('div', { className: 'hero__scrim', attrs: { 'aria-hidden': 'true' } }));

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

    slide.append(content);
    return slide;
  }

  /**
   * @param {number} i
   * @param {{restart?: boolean}} [opts] Restart the auto-advance timer (used
   *   on manual dot clicks so a click doesn't get immediately overridden).
   */
  #goTo(i, opts = {}) {
    const total = this.#items.length;
    if (total === 0) return;
    this.#index = ((i % total) + total) % total;

    this.#trackEl?.querySelectorAll('.hero__slide').forEach((el, idx) => {
      el.classList.toggle('is-active', idx === this.#index);
    });
    this.#dotsEl?.querySelectorAll('.hero__dot').forEach((el, idx) => {
      const active = idx === this.#index;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (opts.restart && this.#timer) this.#start(this.props.intervalMs ?? 7000);
  }

  /** @param {number} intervalMs */
  #start(intervalMs) {
    this.#stop();
    this.#timer = window.setInterval(() => this.#goTo(this.#index + 1), intervalMs);
  }

  #stop() {
    if (this.#timer) { window.clearInterval(this.#timer); this.#timer = null; }
  }
}