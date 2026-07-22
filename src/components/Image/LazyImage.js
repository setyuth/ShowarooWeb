/**
 * @file LazyImage — the single image primitive. Reserves aspect ratio (no CLS),
 * shows a blurred low-res placeholder, lazy-loads the full responsive image via
 * the shared observer, and crossfades on load. Falls back cleanly on error.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';
import { lazyLoader } from './LazyLoader.js';

/**
 * @typedef {object} LazyImageProps
 * @property {string|null} src           Full-size URL.
 * @property {string} [srcset]           Responsive srcset (from ImageService).
 * @property {string} [sizes]            e.g. '(min-width:1024px) 200px, 160px'.
 * @property {string|null} [placeholder] Tiny blur URL (e.g. TMDB w92).
 * @property {string} alt
 * @property {'2 / 3'|'16 / 9'|'1 / 1'} [ratio]  Reserved aspect ratio.
 * @property {boolean} [priority]        If true, load eagerly + high fetchpriority.
 */

export class LazyImage extends Component {
  /** @param {LazyImageProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { src, srcset, sizes, placeholder, alt, ratio = '2 / 3', priority = false } = this.props;
    const frame = createElement('div', { className: 'lazyimg', attrs: { 'data-loaded': 'false' } });
    frame.style.aspectRatio = ratio;

    // Empty-source fallback: neutral surface, no broken icon.
    if (!src) { frame.classList.add('lazyimg--empty'); return frame; }

    // Blurred placeholder underneath (if available).
    if (placeholder) {
      frame.append(createElement('img', {
        className: 'lazyimg__ph', attrs: { src: placeholder, alt: '', 'aria-hidden': 'true', decoding: 'async' },
      }));
    }

    const img = createElement('img', {
      className: 'lazyimg__full',
      attrs: {
        alt, decoding: 'async',
        loading: priority ? 'eager' : 'lazy',
        fetchpriority: priority ? 'high' : 'auto',
        sizes: sizes ?? '',
      },
    });

    const reveal = () => {
      if (srcset) img.setAttribute('srcset', srcset);
      img.setAttribute('src', src);
    };
    this.on(img, 'load', () => frame.setAttribute('data-loaded', 'true'));
    this.on(img, 'error', () => { frame.classList.add('lazyimg--error'); frame.setAttribute('data-loaded', 'true'); });

    frame.append(img);

    // Priority images load now; others when near viewport (native lazy still applies).
    if (priority) reveal();
    else lazyLoader.observe(frame, reveal);

    return frame;
  }
}