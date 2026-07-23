/**
 * @file Footer. Premium multi-column layout: brand/tagline, an Explore link
 * column mirroring the primary nav, and the required TMDB attribution.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { NAV_ITEMS } from './Header.js';

/**
 * @typedef {object} FooterProps
 * @property {(path: string) => void} onNavigate
 */

export class Footer extends Component {
  /** @param {FooterProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { onNavigate } = this.props;
    const footer = createElement('footer', { className: 'app-footer', attrs: { role: 'contentinfo' } });
    const inner = createElement('div', { className: 'app-footer__inner container' });

    // Brand column.
    const brandCol = createElement('div', { className: 'app-footer__col app-footer__col--brand' });
    brandCol.append(createElement('span', { className: 'app-footer__brand', text: 'ShowAroo' }));
    brandCol.append(createElement('p', {
      className: 'app-footer__tagline', text: 'Discover movies and TV shows worth your time.',
    }));

    // Explore column, mirrors the primary nav so it stays in sync automatically.
    const exploreCol = createElement('div', { className: 'app-footer__col' });
    exploreCol.append(createElement('h4', { className: 'app-footer__col-title', text: 'Explore' }));
    const exploreList = createElement('ul', { className: 'app-footer__links' });
    for (const item of NAV_ITEMS) {
      const li = createElement('li');
      const link = createElement('a', { text: item.label, attrs: { href: `#${item.path}` } });
      this.on(link, 'click', (e) => { e.preventDefault(); onNavigate(item.path); });
      li.append(link);
      exploreList.append(li);
    }
    exploreCol.append(exploreList);

    // Library column: personal-collection links, also mirrors real routes.
    const libraryCol = createElement('div', { className: 'app-footer__col' });
    libraryCol.append(createElement('h4', { className: 'app-footer__col-title', text: 'Your Library' }));
    const libraryList = createElement('ul', { className: 'app-footer__links' });
    for (const [label, path] of [['Watch Later', '/watch-later'], ['History', '/history'], ['Continue Watching', '/continue']]) {
      const li = createElement('li');
      const link = createElement('a', { text: label, attrs: { href: `#${path}` } });
      this.on(link, 'click', (e) => { e.preventDefault(); onNavigate(path); });
      li.append(link);
      libraryList.append(li);
    }
    libraryCol.append(libraryList);

    inner.append(brandCol, exploreCol, libraryCol);

    const bottom = createElement('div', { className: 'app-footer__bottom container' });
    bottom.append(createElement('p', {
      className: 'app-footer__attr',
      text: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    }));

    footer.append(inner, bottom);
    return footer;
  }
}