/**
 * @file Footer. Premium multi-column layout: brand/tagline, an Explore link
 * column mirroring the primary nav, and the required TMDB attribution.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { APP_ICON_SRC, NAV_ITEMS } from './Header.js';

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
    const brandMark = createElement('div', { className: 'app-footer__brand' });
    brandMark.append(createElement('img', {
      className: 'app-footer__logo-mark',
      attrs: { src: APP_ICON_SRC, alt: '', width: '40', height: '40', loading: 'lazy', decoding: 'async' },
    }));
    brandMark.append(createElement('span', { className: 'app-footer__brand-word', text: 'ShowAroo' }));
    brandCol.append(brandMark);
    brandCol.append(createElement('p', {
      className: 'app-footer__tagline', text: 'Discover movies and TV shows worth your time.',
    }));

    // Explore column, mirrors the primary nav so it stays in sync automatically.
    const exploreCol = createElement('div', { className: 'app-footer__col' });
    exploreCol.append(createElement('h4', { className: 'app-footer__col-title', text: 'Explore' }));
    const exploreList = createElement('ul', { className: 'app-footer__links' });
    for (const item of NAV_ITEMS) {
      const li = createElement('li');

      if (item.external) {
        // Real external link — must NOT go through onNavigate()/router, since
        // item.path is undefined for external items (this previously threw
        // in Router.navigate() when clicked: onNavigate(undefined) ->
        // path.startsWith(...) on undefined). Header.js/MobileNav.js already
        // special-cased this; this loop hadn't been updated to match.
        li.className = 'app-footer__links-item--badge';
        li.append(this.#playBadge(item));
        exploreList.append(li);
        continue;
      }

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

  /**
   * "Get the app" badge, identical in shape/markup to Header's
   * `#androidBadge` (real app icon + two-line "GET IT ON / Google Play"
   * text) so the Play Store link reads the same wherever it appears. Reuses
   * the `app-header__playbadge*` classes on purpose rather than duplicating
   * a footer-specific variant, so a single stylesheet rule keeps both in
   * sync.
   * @param {typeof NAV_ITEMS[number]} item
   * @returns {HTMLElement}
   */
  #playBadge(item) {
    const link = createElement('a', {
      className: 'app-header__playbadge app-footer__playbadge',
      attrs: { href: item.href, target: '_blank', rel: 'noopener noreferrer', 'aria-label': item.label },
    });
    link.append(createElement('img', {
      className: 'app-header__playbadge-icon',
      attrs: { src: APP_ICON_SRC, alt: '', loading: 'lazy', width: '28', height: '28' },
    }));
    const text = createElement('span', { className: 'app-header__playbadge-text' });
    text.append(createElement('span', { className: 'app-header__playbadge-eyebrow', text: 'GET IT ON' }));
    text.append(createElement('span', { className: 'app-header__playbadge-brand', text: 'Google Play' }));
    link.append(text);
    return link;
  }
}