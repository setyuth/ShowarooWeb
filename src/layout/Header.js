/**
 * @file Sticky desktop header (DS §12). Logo mark + wordmark, primary nav with
 * active states, and a search entry point. Collapses to brand + search on
 * small screens; the primary nav moves to the MobileNav bottom bar.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { debounce } from '../utils/async.js';

/**
 * ShowAroo's own Play Store icon — pulled from the live listing's own CDN
 * path, not a shared Google badge asset. Used both as the site's brand logo
 * (per request) and as the icon in the "Get the app" badge below. `=s128`
 * requests a 128px square from Google's image proxy; markup displays it
 * smaller and lets the browser downscale for crispness on retina.
 */
export const APP_ICON_SRC =
  'https://play-lh.googleusercontent.com/hPsXT3DYQvYC1QIAmaZsDx0TpgXXLIy5pNgBnX0otdJnXbyrQbQlzIFvVYkVTq8rZ3buCxzw64VY69wAUuKjgA=s128';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.personallifeinsights.showarooapp';

/**
 * Primary navigation model. Single source so desktop + mobile + footer stay
 * in sync. Items with `external: true` link off-app (e.g. app-store
 * listings) and carry `href` instead of `path` — every consumer (Header,
 * MobileNav, Footer) MUST special-case `item.external` and render a plain
 * anchor, never through onNavigate()/router.navigate(): there's no in-app
 * route to go to, and passing `item.path` (undefined) into onNavigate()
 * throws inside Router.navigate() (see Footer.js fix, history: this exact
 * bug shipped once already because Footer.js hadn't been updated to match
 * Header.js/MobileNav.js when this item was added).
 */
export const NAV_ITEMS = Object.freeze([
  { id: 'home', label: 'Home', path: '/', icon: 'home' },
  { id: 'movies', label: 'Movies', path: '/movies', icon: 'film' },
  { id: 'tv', label: 'TV', path: '/tv', icon: 'tv' },
  { id: 'discover', label: 'Discover', path: '/discover', icon: 'compass' },
  { id: 'favorites', label: 'Favorites', path: '/favorites', icon: 'heart' },
  {
    id: 'android-app',
    label: 'Get ShowAroo on Google Play',
    external: true,
    href: PLAY_STORE_URL,
  },
]);

/**
 * @typedef {object} HeaderProps
 * @property {(path: string) => void} onNavigate
 * @property {(query: string) => void} [onSearch]
 */

export class Header extends Component {
  /** @param {HeaderProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { onNavigate, onSearch } = this.props;
    const header = createElement('header', { className: 'app-header', attrs: { role: 'banner' } });
    const inner = createElement('div', { className: 'app-header__inner container' });

    // Brand: app icon + wordmark.
    const brand = createElement('a', {
      className: 'app-header__brand',
      attrs: { href: '#/', 'aria-label': 'ShowAroo home' },
    });
    brand.append(this.#logoImg(), createElement('span', { className: 'app-header__brand-word', text: 'ShowAroo' }));
    this.on(brand, 'click', (e) => { e.preventDefault(); onNavigate('/'); });

    // Primary nav.
    const nav = createElement('nav', { className: 'app-header__nav', attrs: { 'aria-label': 'Primary' } });
    for (const item of NAV_ITEMS) {
      if (item.external) {
        nav.append(this.#androidBadge(item));
        continue;
      }

      const link = createElement('a', {
        className: 'app-header__link', text: item.label,
        attrs: { href: `#${item.path}`, 'data-path': item.path },
      });
      this.on(link, 'click', (e) => { e.preventDefault(); onNavigate(item.path); });
      nav.append(link);
    }

    // Search entry.
    const search = createElement('div', { className: 'app-header__search' });
    const input = createElement('input', {
      className: 'app-header__search-input',
      attrs: { type: 'search', placeholder: 'Search movies, TV, people', 'aria-label': 'Search', enterkeyhint: 'search' },
    });
    if (onSearch) {
      const debounced = debounce((v) => onSearch(v), 300);
      this.on(input, 'input', (e) => debounced(/** @type {HTMLInputElement} */ (e.target).value));
      this.addDisposer(() => debounced.cancel());
    }
    search.append(input);

    inner.append(brand, nav, search);
    header.append(inner);
    return header;
  }

  /**
   * "Get the app" badge: real app icon + two-line text. Built from markup
   * (not a hotlinked store-badge image), so it can't go blank the way a
   * third-party-hosted PNG can. Shared shape reused by MobileNav's compact
   * variant would duplicate DOM structure unnecessarily, so MobileNav
   * renders its own simpler icon+label item instead.
   * @param {typeof NAV_ITEMS[number]} item
   * @returns {HTMLElement}
   */
  #androidBadge(item) {
    const link = createElement('a', {
      className: 'app-header__playbadge',
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

  /**
   * Brand logo: the app's real Play Store icon. Replaces the previous
   * inline-SVG placeholder mark now that a real brand asset exists.
   * @returns {HTMLImageElement}
   */
  #logoImg() {
    return /** @type {HTMLImageElement} */ (createElement('img', {
      className: 'app-header__logo-mark',
      attrs: { src: APP_ICON_SRC, alt: '', width: '32', height: '32', loading: 'eager', decoding: 'async' },
    }));
  }

  /**
   * Reflect the active route in the nav (called by app on route:change).
   * @param {string} path
   * @returns {void}
   */
  setActive(path) {
    this.el?.querySelectorAll('.app-header__link[data-path]').forEach((link) => {
      const isActive = link.getAttribute('data-path') === path;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}