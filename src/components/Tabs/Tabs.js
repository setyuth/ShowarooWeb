/**
 * @file Tabs. WAI-ARIA tabs pattern: roving tabindex, arrow-key navigation,
 * Home/End, aria-selected + aria-controls wiring.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';
import { clamp } from '../../utils/guards.js';

/**
 * @typedef {object} TabItem
 * @property {string} id
 * @property {string} label
 * @property {HTMLElement} panel
 *
 * @typedef {object} TabsProps
 * @property {TabItem[]} items
 * @property {number} [initial]   Index. Default 0.
 * @property {(id: string) => void} [onChange]
 */

export class Tabs extends Component {
  /** @type {number} */
  #active = 0;

  /** @param {TabsProps} props */
  constructor(props) { super(props); this.#active = props.initial ?? 0; }

  /** @returns {HTMLElement} */
  render() {
    const { items } = this.props;
    const root = createElement('div', { className: 'ui-tabs' });
    const list = createElement('div', { className: 'ui-tabs__list', attrs: { role: 'tablist' } });
    /** @type {HTMLElement[]} */ const tabs = [];

    items.forEach((item, i) => {
      const selected = i === this.#active;
      const tab = createElement('button', {
        className: 'ui-tabs__tab', text: item.label,
        attrs: {
          type: 'button', role: 'tab', id: `tab-${item.id}`,
          'aria-selected': String(selected), 'aria-controls': `panel-${item.id}`,
          tabindex: selected ? '0' : '-1',
        },
      });
      item.panel.id = `panel-${item.id}`;
      item.panel.setAttribute('role', 'tabpanel');
      item.panel.setAttribute('aria-labelledby', `tab-${item.id}`);
      item.panel.hidden = !selected;

      this.on(tab, 'click', () => this.#select(i, tabs, items));
      this.on(tab, 'keydown', (e) => this.#onKeydown(/** @type {KeyboardEvent} */ (e), i, tabs, items));
      tabs.push(tab);
      list.append(tab);
    });

    root.append(list);
    items.forEach((item) => root.append(item.panel));
    return root;
  }

  /** @param {number} i @param {HTMLElement[]} tabs @param {TabItem[]} items */
  #select(i, tabs, items) {
    this.#active = i;
    tabs.forEach((tab, idx) => {
      const on = idx === i;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      items[idx].panel.hidden = !on;
    });
    tabs[i].focus();
    this.props.onChange?.(items[i].id);
  }

  /** @param {KeyboardEvent} e @param {number} i @param {HTMLElement[]} tabs @param {TabItem[]} items */
  #onKeydown(e, i, tabs, items) {
    const last = items.length - 1;
    let next = null;
    if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
    else if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next !== null) { e.preventDefault(); this.#select(clamp(next, 0, last), tabs, items); }
  }
}