/**
 * @file Sticky desktop header (DS §12). Logo mark + wordmark, primary nav with
 * active states, and a search entry point. Collapses to brand + search on
 * small screens; the primary nav moves to the MobileNav bottom bar.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { debounce } from '../utils/async.js';

/**
 * Google's official Play Store badge asset (their brand kit — meant to be
 * embedded as-is on external sites, not restyled). Using the real asset
 * instead of a custom pill avoids both the trademark question and the
 * "doesn't look like a real store badge" problem.
 */
export const PLAY_BADGE_SRC =
  'https://play.google.com/intl/en_us/badges/static/images/badges/en-us_badge_web_generic.png';

/**
 * Primary navigation model. Single source so desktop + mobile stay in sync.
 * Items with `external: true` link off-app (e.g. app-store listings) and
 * carry `href` instead of `path` — both Header and MobileNav render these
 * as real anchors with target="_blank", never through onNavigate()/
 * router.navigate(), since there's no in-app route to go to.
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
    href: 'https://play.google.com/store/apps/details?id=com.personallifeinsights.showarooapp',
    // Rendered as the official Play Store badge image, not a text link —
    // see #androidBadge() in Header and MobileNav.
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

    // Brand: logo mark (inline SVG, no external asset) + wordmark.
    const brand = createElement('a', {
      className: 'app-header__brand',
      attrs: { href: '#/', 'aria-label': 'ShowAroo home' },
    });
    brand.append(this.#logoMark(), createElement('span', { className: 'app-header__brand-word', text: 'ShowAroo' }));
    this.on(brand, 'click', (e) => { e.preventDefault(); onNavigate('/'); });

    // Primary nav.
    const nav = createElement('nav', { className: 'app-header__nav', attrs: { 'aria-label': 'Primary' } });
    for (const item of NAV_ITEMS) {
      if (item.external) {
        nav.append(this.#androidBadge(item, 'app-header__playbadge'));
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
   * Real Google Play badge, wrapped in a plain anchor. Shared shape used by
   * both Header and MobileNav so the two never drift apart visually.
   * @param {typeof NAV_ITEMS[number]} item
   * @param {string} wrapperClassName
   * @returns {HTMLElement}
   */
  #androidBadge(item, wrapperClassName) {
    const link = createElement('a', {
      className: wrapperClassName,
      attrs: {
        href: item.href,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': item.label,
      },
    });
    link.append(createElement('img', {
      className: `${wrapperClassName}-img`,
      attrs: {
        src: PLAY_BADGE_SRC, alt: 'Get it on Google Play',
        loading: 'lazy', width: '135', height: '40',
      },
    }));
    return link;
  }

  /**
   * Inline SVG logo mark: a rounded gradient badge with a play glyph. No
   * external image asset required; colors are theme tokens, so it stays in
   * sync with the design system automatically. Swap this for an <img> if a
   * real brand asset exists later.
   * @returns {SVGSVGElement}
   */
  #logoMark() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('width', '32');
    svg.setAttribute('height', '32');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'app-header__logo-mark');
    svg.innerHTML = `
      <defs>
        <linearGradient id="showaroo-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--color-primary)"/>
          <stop offset="1" stop-color="var(--color-accent, var(--color-primary))"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#showaroo-logo-grad)"/>
      <path d="M16 12.5 L28 20 L16 27.5 Z" fill="var(--color-bg)"/>
    `;
    return /** @type {SVGSVGElement} */ (svg);
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