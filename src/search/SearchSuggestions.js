/**
 * @file Live suggestions dropdown anchored to the header search input.
 * Implements the ARIA combobox pattern: input owns aria-expanded/activedescendant,
 * listbox of options, ArrowUp/Down/Enter/Escape handling. Shows recent searches
 * when idle, results when present, and standardized empty/loading states.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';

/**
 * @typedef {object} SuggestionsProps
 * @property {HTMLInputElement} input
 * @property {SearchController} controller
 * @property {(id: string|number, type: string) => void} onOpen
 * @property {(query: string) => void} onSubmit
 */

export class SearchSuggestions extends Component {
  /** @type {number} */ #active = -1;
  /** @type {HTMLElement | null} */ #list = null;
  /** @type {any[]} */ #options = [];

  /** @param {SuggestionsProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { input, controller, onOpen, onSubmit } = this.props;
    const panel = createElement('div', { className: 'search-suggest', attrs: { role: 'listbox', id: 'search-listbox' } });
    panel.hidden = true;
    this.#list = panel;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', 'search-listbox');
    input.setAttribute('aria-autocomplete', 'list');

    controller.onResults((state) => this.#renderState(state, onOpen));

    this.on(input, 'input', () => controller.input(input.value));
    this.on(input, 'focus', () => { if (input.value.trim() === '') this.#renderHistory(controller, onSubmit); });
    this.on(input, 'keydown', (e) => this.#onKeydown(/** @type {KeyboardEvent} */ (e), input, controller, onSubmit, onOpen));
    this.on(document, 'click', (e) => { if (!panel.contains(/** @type {Node} */ (e.target)) && e.target !== input) this.#close(input); });

    return panel;
  }

  /** @param {import('./SearchController.js').SearchState} state @param {Function} onOpen */
  #renderState(state, onOpen) {
    if (!this.#list) return;
    this.#active = -1;
    if (state.status === 'idle') { this.#close(this.props.input); return; }
    if (state.status === 'loading') { this.#setOptions([], this.#loadingRow()); return; }
    if (state.status === 'error') { this.#setOptions([], this.#msgRow('Something went wrong. Try again.')); return; }
    if (state.status === 'empty') { this.#setOptions([], this.#msgRow(`No results for “${state.query}”`)); return; }

    const rows = state.items.slice(0, 8).map((item, i) => {
      const row = createElement('div', {
        className: 'search-suggest__opt',
        attrs: { role: 'option', id: `opt-${i}`, 'aria-selected': 'false' },
      });
      if (item.posterUrl) row.append(createElement('img', { className: 'search-suggest__thumb', attrs: { src: item.posterUrl, alt: '', loading: 'lazy' } }));
      const label = [item.title, item.year].filter(Boolean).join(' · ');
      row.append(createElement('span', { text: label }));
      this.on(row, 'click', () => onOpen(item.id, item.mediaType));
      return row;
    });
    this.#setOptions(state.items.slice(0, 8), ...rows);
  }

  /** @param {SearchController} controller @param {Function} onSubmit */
  #renderHistory(controller, onSubmit) {
    const history = controller.history;
    if (history.length === 0) { this.#close(this.props.input); return; }
    const rows = history.map((q, i) => {
      const row = createElement('div', {
        className: 'search-suggest__opt search-suggest__opt--history',
        text: q, attrs: { role: 'option', id: `opt-${i}`, 'aria-selected': 'false' },
        dataset: { icon: 'history' },
      });
      this.on(row, 'click', () => onSubmit(q));
      return row;
    });
    this.#setOptions(history.map((q) => ({ query: q })), ...rows);
  }

  /** @param {any[]} options @param {...HTMLElement} rows */
  #setOptions(options, ...rows) {
    if (!this.#list) return;
    this.#options = options;
    this.#list.replaceChildren(...rows);
    this.#open(this.props.input);
  }

  /** @param {KeyboardEvent} e @param {HTMLInputElement} input @param {SearchController} controller @param {Function} onSubmit @param {Function} onOpen */
  #onKeydown(e, input, controller, onSubmit, onOpen) {
    const rows = this.#list ? Array.from(this.#list.children) : [];
    if (e.key === 'ArrowDown') { e.preventDefault(); this.#move(1, rows, input); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.#move(-1, rows, input); }
    else if (e.key === 'Enter') {
      const opt = this.#options[this.#active];
      if (opt && 'id' in opt) onOpen(opt.id, opt.mediaType);
      else if (opt && 'query' in opt) onSubmit(opt.query);
      else onSubmit(input.value);
    } else if (e.key === 'Escape') { this.#close(input); }
  }

  /** @param {number} delta @param {Element[]} rows @param {HTMLInputElement} input */
  #move(delta, rows, input) {
    if (rows.length === 0) return;
    if (this.#active >= 0) rows[this.#active]?.setAttribute('aria-selected', 'false');
    this.#active = (this.#active + delta + rows.length) % rows.length;
    const el = rows[this.#active];
    el.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  }

  /** @param {HTMLInputElement} input */
  #open(input) { if (this.#list) { this.#list.hidden = false; input.setAttribute('aria-expanded', 'true'); } }
  /** @param {HTMLInputElement} input */
  #close(input) { if (this.#list) { this.#list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); this.#active = -1; } }

  #loadingRow() { return createElement('div', { className: 'search-suggest__msg', text: 'Searching…' }); }
  /** @param {string} text */
  #msgRow(text) { return createElement('div', { className: 'search-suggest__msg', text }); }
}