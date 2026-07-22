/**
 * @file Global screen-reader announcer. One polite + one assertive live region
 * for the whole app, so any module can announce state changes (route loaded,
 * search results count, playback status, item added/removed) without creating
 * ad-hoc live regions.
 */

import { createElement } from '../utils/dom.js';

export class Announcer {
  /** @type {HTMLElement} */ #polite;
  /** @type {HTMLElement} */ #assertive;

  constructor() {
    this.#polite = Announcer.#region('polite');
    this.#assertive = Announcer.#region('assertive');
    document.body.append(this.#polite, this.#assertive);
  }

  /**
   * @param {string} message
   * @param {{ assertive?: boolean }} [opts]
   * @returns {void}
   */
  announce(message, { assertive = false } = {}) {
    const region = assertive ? this.#assertive : this.#polite;
    // Clear then set on next frame so repeated identical messages re-announce.
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message; });
  }

  /** @param {'polite'|'assertive'} level @returns {HTMLElement} */
  static #region(level) {
    return createElement('div', {
      className: 'sr-only', attrs: { 'aria-live': level, 'aria-atomic': 'true', role: 'status' },
    });
  }
}