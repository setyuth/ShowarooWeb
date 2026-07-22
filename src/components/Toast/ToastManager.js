/**
 * @file Toast notifications. DS §17. Non-blocking, auto-dismiss with pause on
 * hover, types: success | error | warning | info. A single manager owns one
 * live region (aria-live=polite) so screen readers announce toasts.
 */

import { createElement } from '../../utils/dom.js';

/** @typedef {'success'|'error'|'warning'|'info'} ToastType */

export class ToastManager {
  /** @type {HTMLElement} */ #region;

  constructor() {
    this.#region = createElement('div', {
      className: 'ui-toast-region',
      attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false' },
    });
    document.body.append(this.#region);
  }

  /**
   * Show a toast.
   * @param {string} message
   * @param {{ type?: ToastType, duration?: number }} [options]
   * @returns {() => void} Dismiss function.
   */
  show(message, { type = 'info', duration = 4000 } = {}) {
    const toast = createElement('div', { className: `ui-toast ui-toast--${type}` });
    toast.append(createElement('span', { className: 'ui-toast__msg', text: message }));
    const dismissBtn = createElement('button', {
      className: 'ui-toast__close', attrs: { type: 'button', 'aria-label': 'Dismiss notification' }, dataset: { icon: 'close' },
    });
    toast.append(dismissBtn);
    this.#region.append(toast);

    let timer = 0;
    const dismiss = () => { window.clearTimeout(timer); toast.remove(); };
    const start = () => { timer = window.setTimeout(dismiss, duration); };
    const pause = () => window.clearTimeout(timer);

    dismissBtn.addEventListener('click', dismiss);
    toast.addEventListener('mouseenter', pause);
    toast.addEventListener('mouseleave', start);
    start();
    return dismiss;
  }
}