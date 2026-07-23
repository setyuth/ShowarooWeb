/**
 * @file Filter bar for the Discover page. Controlled component: renders from
 * `props.value` and calls `props.onChange(next)` with the whole updated filter
 * state on every interaction — no internal state to fall out of sync with the
 * page that owns it.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} FilterValue
 * @property {'movie'|'tv'} mediaType
 * @property {number[]} genreIds
 * @property {string} year        Empty string = any.
 * @property {string} country     ISO 3166-1 alpha-2, empty string = any.
 * @property {string} sortBy
 *
 * @typedef {object} FilterBarProps
 * @property {FilterValue} value
 * @property {{id:number,name:string}[]} genres
 * @property {{code:string,name:string}[]} countries
 * @property {number[]} years
 * @property {(next: FilterValue) => void} onChange
 */

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'primary_release_date.asc', label: 'Oldest' },
];

export class FilterBar extends Component {
  /** @param {FilterBarProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { value, genres, countries, years, onChange } = this.props;
    const root = createElement('div', { className: 'filter-bar' });

    // Media type segmented toggle.
    const typeGroup = createElement('div', {
      className: 'filter-bar__segmented', attrs: { role: 'radiogroup', 'aria-label': 'Media type' },
    });
    for (const [type, label] of [['movie', 'Movies'], ['tv', 'TV Shows']]) {
      const btn = createElement('button', {
        className: `filter-bar__segment${value.mediaType === type ? ' is-active' : ''}`,
        text: label,
        attrs: { type: 'button', role: 'radio', 'aria-checked': String(value.mediaType === type) },
      });
      this.on(btn, 'click', () => onChange({ ...value, mediaType: /** @type {'movie'|'tv'} */ (type), genreIds: [] }));
      typeGroup.append(btn);
    }
    root.append(typeGroup);

    // Genre chips (multi-select toggle).
    const genreRow = createElement('div', { className: 'filter-bar__chips', attrs: { 'aria-label': 'Genres' } });
    for (const genre of genres) {
      const active = value.genreIds.includes(genre.id);
      const chip = createElement('button', {
        className: `filter-chip${active ? ' is-active' : ''}`, text: genre.name,
        attrs: { type: 'button', 'aria-pressed': String(active) },
      });
      this.on(chip, 'click', () => {
        const next = active ? value.genreIds.filter((id) => id !== genre.id) : [...value.genreIds, genre.id];
        onChange({ ...value, genreIds: next });
      });
      genreRow.append(chip);
    }
    root.append(genreRow);

    // Year / country / sort selects.
    const selects = createElement('div', { className: 'filter-bar__selects' });

    const yearSelect = this.#select('Year', value.year, [
      { value: '', label: 'Any year' },
      ...years.map((y) => ({ value: String(y), label: String(y) })),
    ], (v) => onChange({ ...value, year: v }));

    const countrySelect = this.#select('Country', value.country, [
      { value: '', label: 'Any country' },
      ...countries.map((c) => ({ value: c.code, label: c.name })),
    ], (v) => onChange({ ...value, country: v }));

    const sortSelect = this.#select('Sort by', value.sortBy, SORT_OPTIONS, (v) => onChange({ ...value, sortBy: v }));

    selects.append(yearSelect, countrySelect, sortSelect);
    root.append(selects);

    const hasActiveFilters = value.genreIds.length > 0 || value.year || value.country;
    if (hasActiveFilters) {
      const reset = createElement('button', {
        className: 'filter-bar__reset', text: 'Clear filters', attrs: { type: 'button' },
      });
      this.on(reset, 'click', () => onChange({ ...value, genreIds: [], year: '', country: '' }));
      root.append(reset);
    }

    return root;
  }

  /**
   * @param {string} label @param {string} current
   * @param {{value:string,label:string}[]} options @param {(v:string)=>void} onSelect
   * @returns {HTMLElement}
   */
  #select(label, current, options, onSelect) {
    const wrap = createElement('label', { className: 'filter-bar__field' });
    wrap.append(createElement('span', { className: 'filter-bar__field-label', text: label }));
    const select = /** @type {HTMLSelectElement} */ (createElement('select', { className: 'filter-bar__select' }));
    for (const opt of options) {
      const optionEl = /** @type {HTMLOptionElement} */ (createElement('option', { text: opt.label, attrs: { value: opt.value } }));
      if (opt.value === current) optionEl.selected = true;
      select.append(optionEl);
    }
    this.on(select, 'change', () => onSelect(select.value));
    wrap.append(select);
    return wrap;
  }
}