/**
 * @file Mobile bottom navigation (DS §12). Touch-friendly targets (min 44px),
 * icon + label, active state. Hidden on desktop via CSS; complements the header.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { NAV_ITEMS } from './Header.js';

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
    this.el?.querySelectorAll('.app-mobilenav__item').forEach((btn) => {
      const isActive = btn.getAttribute('data-path') === path;
      btn.classList.toggle('is-active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  }
}