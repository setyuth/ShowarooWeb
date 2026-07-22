/**
 * @file Modal dialog. DS §16. Focus trapping, Escape + backdrop dismissal,
 * scroll lock, focus restoration to the previously focused element, and proper
 * dialog ARIA. Renders into document.body so stacking is predictable.
 */

import { Component } from '../Component.js';
import { createElement, qsa } from '../../utils/dom.js';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/**
 * @typedef {object} ModalProps
 * @property {string} title
 * @property {HTMLElement} content
 * @property {() => void} [onClose]
 */

export class Modal extends Component {
  /** @type {Element | null} */ #lastFocused = null;

  /** @param {ModalProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { title, content } = this.props;
    const backdrop = createElement('div', { className: 'ui-modal__backdrop' });
    const dialog = createElement('div', {
      className: 'ui-modal',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    });

    const header = createElement('div', { className: 'ui-modal__header' });
    header.append(createElement('h2', { className: 'ui-modal__title', text: title }));
    const close = createElement('button', {
      className: 'ui-modal__close', attrs: { type: 'button', 'aria-label': 'Close dialog' }, dataset: { icon: 'close' },
    });
    header.append(close);

    const body = createElement('div', { className: 'ui-modal__body' });
    body.append(content);
    dialog.append(header, body);
    backdrop.append(dialog);

    this.on(close, 'click', () => this.close());
    this.on(backdrop, 'mousedown', (e) => { if (e.target === backdrop) this.close(); });
    this.on(dialog, 'keydown', (e) => this.#onKeydown(/** @type {KeyboardEvent} */ (e), dialog));
    return backdrop;
  }

  /** Open: mount to body, lock scroll, move focus in. @returns {void} */
  open() {
    this.#lastFocused = document.activeElement;
    this.mount(document.body);
    document.documentElement.style.overflow = 'hidden';
    const focusables = qsa(FOCUSABLE, /** @type {ParentNode} */ (this.el));
    /** @type {HTMLElement} */ (focusables[0] ?? this.el)?.focus?.();
  }

  /** Close: restore scroll + focus, tear down. @returns {void} */
  close() {
    document.documentElement.style.overflow = '';
    this.props.onClose?.();
    this.destroy();
    if (this.#lastFocused instanceof HTMLElement) this.#lastFocused.focus();
  }

  /** @param {KeyboardEvent} e @param {HTMLElement} dialog */
  #onKeydown(e, dialog) {
    if (e.key === 'Escape') { e.preventDefault(); this.close(); return; }
    if (e.key !== 'Tab') return;
    // Focus trap.
    const nodes = qsa(FOCUSABLE, dialog);
    if (nodes.length === 0) return;
    const first = /** @type {HTMLElement} */ (nodes[0]);
    const lastEl = /** @type {HTMLElement} */ (nodes[nodes.length - 1]);
    const active = document.activeElement;
    if (e.shiftKey && active === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && active === lastEl) { e.preventDefault(); first.focus(); }
  }
}