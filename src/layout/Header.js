/**
 * @file Sticky desktop header (DS §12). Brand, primary nav with active states,
 * and a search entry point. Collapses to brand + search on small screens; the
 * primary nav moves to the MobileNav bottom bar.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { debounce } from '../utils/async.js';

/** Primary navigation model. Single source so desktop + mobile stay in sync. */
export const NAV_ITEMS = Object.freeze([
  { id: 'home', label: 'Home', path: '/', icon: 'home' },
  { id: 'movies', label: 'Movies', path: '/movies', icon: 'film' },
  { id: 'tv', label: 'TV', path: '/tv', icon: 'tv' },
  { id: 'favorites', label: 'Favorites', path: '/favorites', icon: 'heart' },
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

    // Brand.
    const brand = createElement('a', {
      className: 'app-header__brand', text: 'ShowAroo',
      attrs: { href: '#/', 'aria-label': 'ShowAroo home' },
    });
    this.on(brand, 'click', (e) => { e.preventDefault(); onNavigate('/'); });

    // Primary nav.
    const nav = createElement('nav', { className: 'app-header__nav', attrs: { 'aria-label': 'Primary' } });
    for (const item of NAV_ITEMS) {
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
   * Reflect the active route in the nav (called by app on route:change).
   * @param {string} path
   * @returns {void}
   */
  setActive(path) {
    this.el?.querySelectorAll('.app-header__link').forEach((link) => {
      const isActive = link.getAttribute('data-path') === path;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}