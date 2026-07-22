/**
 * @file Dropdown menu. Click/keyboard toggle, outside-click + Escape dismissal,
 * arrow-key item navigation, aria-expanded + menu/menuitem roles. Used later by
 * the server selector (DS §14) and nav profile menu.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} DropdownItem
 * @property {string} id
 * @property {string} label
 * @property {boolean} [selected]
 *
 * @typedef {object} DropdownProps
 * @property {string} triggerLabel
 * @property {DropdownItem[]} items
 * @property {(id: string) => void} [onSelect]
 */

export class Dropdown extends Component {
  /** @type {boolean} */ #open = false;

  /** @param {DropdownProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { triggerLabel, items } = this.props;
    const root = createElement('div', { className: 'ui-dropdown' });

    const trigger = createElement('button', {
      className: 'ui-dropdown__trigger', text: triggerLabel,
      attrs: { type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false' },
    });
    const menu = createElement('div', { className: 'ui-dropdown__menu', attrs: { role: 'menu' } });
    menu.hidden = true;

    /** @type {HTMLElement[]} */ const itemEls = items.map((item) => {
      const el = createElement('button', {
        className: `ui-dropdown__item${item.selected ? ' is-selected' : ''}`,
        text: item.label,
        attrs: { type: 'button', role: 'menuitem', tabindex: '-1' },
      });
      this.on(el, 'click', () => { this.props.onSelect?.(item.id); this.#toggle(trigger, menu, false); });
      menu.append(el);
      return el;
    });

    this.on(trigger, 'click', () => this.#toggle(trigger, menu, !this.#open, itemEls));
    this.on(trigger, 'keydown', (e) => {
      if (/** @type {KeyboardEvent} */ (e).key === 'ArrowDown') { e.preventDefault(); this.#toggle(trigger, menu, true, itemEls); }
    });
    this.on(menu, 'keydown', (e) => this.#onMenuKeydown(/** @type {KeyboardEvent} */ (e), trigger, menu, itemEls));
    // Dismiss on outside click.
    this.on(document, 'click', (e) => {
      if (this.#open && !root.contains(/** @type {Node} */ (e.target))) this.#toggle(trigger, menu, false);
    });

    root.append(trigger, menu);
    return root;
  }

  /** @param {HTMLElement} trigger @param {HTMLElement} menu @param {boolean} open @param {HTMLElement[]} [itemEls] */
  #toggle(trigger, menu, open, itemEls) {
    this.#open = open;
    trigger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (open && itemEls?.length) itemEls[0].focus();
    else trigger.focus();
  }

  /** @param {KeyboardEvent} e @param {HTMLElement} trigger @param {HTMLElement} menu @param {HTMLElement[]} itemEls */
  #onMenuKeydown(e, trigger, menu, itemEls) {
    const idx = itemEls.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    if (e.key === 'Escape') { e.preventDefault(); this.#toggle(trigger, menu, false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); itemEls[(idx + 1) % itemEls.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); itemEls[(idx - 1 + itemEls.length) % itemEls.length].focus(); }
  }
}