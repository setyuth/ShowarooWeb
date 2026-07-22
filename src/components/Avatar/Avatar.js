/**
 * @file Avatar component. Image with graceful initials fallback.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} AvatarProps
 * @property {string} name              Used for alt text and initials fallback.
 * @property {string} [src]             Image URL; falls back to initials on error/absence.
 * @property {'sm'|'md'|'lg'} [size]    Default 'md'.
 */

export class Avatar extends Component {
  /** @param {AvatarProps} props */
  constructor(props) { super(props); }

  /** @param {string} name @returns {string} */
  static initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  }

  /** @returns {HTMLElement} */
  render() {
    const { name, src, size = 'md' } = this.props;
    const root = createElement('span', {
      className: `ui-avatar ui-avatar--${size}`,
      attrs: { role: 'img', 'aria-label': name },
    });
    if (src) {
      const img = createElement('img', { attrs: { src, alt: '', loading: 'lazy', decoding: 'async' } });
      // On load failure, swap to initials without leaving a broken image.
      this.on(img, 'error', () => root.replaceChildren(this.#initialsNode(name)));
      root.append(img);
    } else {
      root.append(this.#initialsNode(name));
    }
    return root;
  }

  /** @param {string} name @returns {HTMLElement} */
  #initialsNode(name) {
    return createElement('span', { className: 'ui-avatar__initials', text: Avatar.initials(name), attrs: { 'aria-hidden': 'true' } });
  }
}