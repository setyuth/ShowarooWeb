/**
 * @file Mobile bottom navigation (DS §12). Touch-friendly targets (min 44px),
 * icon + label, active state. Hidden on desktop via CSS; complements the header.
 *
 * Items with `external: true` (e.g. the Android app link) render as the real
 * Google Play badge image instead of an SPA-route button — they leave the app
 * entirely, so they must not go through onNavigate()/router.navigate(). See
 * Header.js#PLAY_BADGE_SRC for the shared asset.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { NAV_ITEMS, PLAY_BADGE_SRC } from './Header.js';

/**
 * @typedef {object} MobileNavProps
 * @property {(path: string) => void} onNavigate
 */

export class MobileNav extends Component {
  /** @param {MobileNavProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { onNavigate } = this.props;
    const nav = createElement('nav', {
      className: 'app-mobilenav', attrs: { 'aria-label': 'Primary mobile' },
    });
    for (const item of NAV_ITEMS) {
      if (item.external) {
        const link = createElement('a', {
          className: 'app-mobilenav__item app-mobilenav__item--external',
          attrs: {
            href: item.href,
            target: '_blank',
            rel: 'noopener noreferrer',
            'aria-label': item.label,
          },
        });
        link.append(createElement('img', {
          className: 'app-mobilenav__playbadge-img',
          attrs: { src: PLAY_BADGE_SRC, alt: 'Get it on Google Play', loading: 'lazy' },
        }));
        nav.append(link);
        continue;
      }

      const btn = createElement('button', {
        className: 'app-mobilenav__item',
        attrs: { type: 'button', 'data-path': item.path, 'aria-label': item.label },
        dataset: { icon: item.icon },
      });
      btn.append(createElement('span', { className: 'app-mobilenav__label', text: item.label }));
      this.on(btn, 'click', () => onNavigate(item.path));
      nav.append(btn);
    }
    return nav;
  }

  /** @param {string} path @returns {void} */
  setActive(path) {
    this.el?.querySelectorAll('.app-mobilenav__item[data-path]').forEach((btn) => {
      const isActive = btn.getAttribute('data-path') === path;
      btn.classList.toggle('is-active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  }
}