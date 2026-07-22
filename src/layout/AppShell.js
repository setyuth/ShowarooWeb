/**
 * @file Application shell. Composes the persistent layout regions (header, main
 * outlet, footer) and exposes the main outlet where pages render. Built once at
 * boot; pages swap inside the outlet without re-rendering the chrome.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { Header } from './Header.js';
import { Footer } from './Footer.js';
import { MobileNav } from './MobileNav.js';

/**
 * @typedef {object} AppShellProps
 * @property {(path: string) => void} onNavigate
 * @property {(query: string) => void} [onSearch]
 */

export class AppShell extends Component {
  /** @type {HTMLElement | null} */ #outlet = null;

  /** @param {AppShellProps} props */
  constructor(props) { super(props); }

  /** The element pages render into. @returns {HTMLElement} */
  get outlet() {
    if (!this.#outlet) throw new Error('AppShell.outlet accessed before render');
    return this.#outlet;
  }

  /** @returns {HTMLElement} */
  render() {
    const { onNavigate, onSearch } = this.props;
    const root = createElement('div', { className: 'app-shell' });

    // Skip link — first focusable element, jumps to main content (a11y).
    const skip = createElement('a', {
      className: 'app-shell__skip', text: 'Skip to content', attrs: { href: '#main' },
    });

    const header = new Header({ onNavigate, onSearch });
    const main = createElement('main', {
      className: 'app-shell__main', attrs: { id: 'main', tabindex: '-1' },
    });
    this.#outlet = main;
    const footer = new Footer({ onNavigate });
    const mobileNav = new MobileNav({ onNavigate });

    root.append(skip);
    header.mount(root);
    root.append(main);
    footer.mount(root);
    mobileNav.mount(root);
    return root;
  }
}