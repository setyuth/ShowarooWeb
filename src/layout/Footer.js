/**
 * @file Footer. Secondary links + TMDB attribution (required by TMDB terms).
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';

/**
 * @typedef {object} FooterProps
 * @property {(path: string) => void} onNavigate
 */

export class Footer extends Component {
  /** @param {FooterProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const footer = createElement('footer', { className: 'app-footer', attrs: { role: 'contentinfo' } });
    const inner = createElement('div', { className: 'app-footer__inner container' });
    inner.append(createElement('p', {
      className: 'app-footer__attr',
      text: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    }));
    footer.append(inner);
    return footer;
  }
}