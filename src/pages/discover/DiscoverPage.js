/**
 * @file Discover page (#/discover). Filter-driven browsing over TMDB's
 * /discover endpoint: media type, genre (multi), year, country, and sort.
 * Genre and country lists are fetched once and cached long-term via the
 * repository layer; results re-fetch whenever the filter state changes.
 */

import { Page } from '../Page.js';
import { FilterBar } from '../../components/Filter/FilterBar.js';
import { Button } from '../../components/Button/Button.js';
import { MediaCard } from '../../components/Card/MediaCard.js';
import { Skeleton } from '../../components/Skeleton/Skeleton.js';
import { createGrid } from '../../layout/Grid.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} DiscoverPageDeps
 * @property {import('../../repositories/DiscoverRepository.js').DiscoverRepository} discover
 * @property {import('../../state/AppState.js').AppState} state
 * @property {import('../../layout/Router.js').Router} router
 */

export class DiscoverPage extends Page {
  /** @type {DiscoverPageDeps} */ #deps;
  /** @type {import('../../components/Filter/FilterBar.js').FilterValue} */
  #filters = { mediaType: 'movie', genreIds: [], year: '', country: '', sortBy: 'popularity.desc' };
  /** @type {{id:number,name:string}[]} */ #movieGenres = [];
  /** @type {{id:number,name:string}[]} */ #tvGenres = [];
  /** @type {{code:string,name:string}[]} */ #countries = [];
  /** @type {HTMLElement | null} */ #filterSlot = null;
  /** @type {HTMLElement | null} */ #resultsSlot = null;
  /** @type {number} */ #page = 1;
  /** @type {number} */ #totalPages = 1;
  /** @type {boolean} */ #loading = false;
  /** @type {number} */ #requestId = 0;

  /** @param {DiscoverPageDeps} deps */
  constructor(deps) { super({}); this.#deps = deps; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'discover-page container' });
    root.append(createElement('h1', { className: 'discover-page__title', text: 'Discover' }));
    root.append(createElement('p', {
      className: 'discover-page__subtitle',
      text: 'Filter by genre, year, and country to find something new.',
    }));

    this.#filterSlot = createElement('div', { className: 'discover-page__filters' });
    this.#resultsSlot = createElement('div', { className: 'discover-page__results' });
    root.append(this.#filterSlot, this.#resultsSlot);

    this.#renderFilterBarSkeleton();
    this.#bootstrapFilterData();

    return root;
  }

  #renderFilterBarSkeleton() {
    if (!this.#filterSlot) return;
    this.#filterSlot.replaceChildren(createElement('div', {
      className: 'discover-page__filters-loading',
      children: Array.from({ length: 4 }, () => new Skeleton({ shape: 'rect', width: '120px', height: '38px' }).render()),
    }));
  }

  async #bootstrapFilterData() {
    const [movieGenres, tvGenres, countries] = await Promise.all([
      this.#deps.discover.movieGenres(),
      this.#deps.discover.tvGenres(),
      this.#deps.discover.countries(),
    ]);
    this.#movieGenres = movieGenres.ok ? movieGenres.value : [];
    this.#tvGenres = tvGenres.ok ? tvGenres.value : [];
    this.#countries = countries.ok ? countries.value : [];
    this.#renderFilterBar();
    this.#load(1);
  }

  #renderFilterBar() {
    if (!this.#filterSlot) return;
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);
    const genres = this.#filters.mediaType === 'movie' ? this.#movieGenres : this.#tvGenres;

    this.#filterSlot.replaceChildren(new FilterBar({
      value: this.#filters,
      genres,
      countries: this.#countries,
      years,
      onChange: (next) => {
        this.#filters = next;
        this.#renderFilterBar();
        this.#load(1);
      },
    }).render());
  }

  /** @param {number} page */
  async #load(page) {
    if (!this.#resultsSlot) return;
    const requestId = ++this.#requestId;
    this.#loading = true;

    if (page === 1) {
      this.#resultsSlot.replaceChildren(createGrid({ min: '160px', children: this.#skeletonCards() }));
    } else {
      this.#appendLoadingButton();
    }

    const result = await this.#deps.discover.filter({ ...this.#filters, page });
    if (requestId !== this.#requestId) return; // A newer filter change superseded this request.
    this.#loading = false;

    if (!result.ok) {
      this.#resultsSlot.replaceChildren(this.#errorState(() => this.#load(page)));
      return;
    }

    this.#page = result.value.page;
    this.#totalPages = result.value.totalPages;

    if (page === 1) {
      if (result.value.items.length === 0) {
        this.#resultsSlot.replaceChildren(createElement('div', {
          className: 'search-page__empty', text: 'No results match these filters. Try clearing one.',
        }));
        return;
      }
      this.#resultsSlot.replaceChildren(createGrid({ min: '160px', children: [] }));
    }

    const grid = this.#resultsSlot.querySelector('.l-grid') ?? this.#resultsSlot;
    this.#appendItems(grid, result.value.items);
    this.#renderLoadMore();
  }

  /** @param {Element} grid @param {any[]} items */
  #appendItems(grid, items) {
    items.forEach((item, i) => {
      const wrap = createElement('div', { className: 'stagger' });
      wrap.style.setProperty('--i', String(Math.min(grid.children.length + i, 24)));
      const mediaType = item.mediaType ?? this.#filters.mediaType;
      new MediaCard({
        model: {
          ...item,
          isFavorite: this.#deps.state.select.isFavorite(item.id, mediaType)(this.#deps.state.getState()),
          isWatchLater: this.#deps.state.select.isWatchLater(item.id, mediaType)(this.#deps.state.getState()),
        },
        onOpen: (id) => this.#deps.router.navigate(`/${mediaType}/${id}`),
        onToggleFavorite: () => this.#deps.state.toggleFavorite({ ...item, mediaType }),
        onToggleWatchLater: () => this.#deps.state.toggleWatchLater({ ...item, mediaType }),
      }).mount(wrap);
      grid.append(wrap);
    });
  }

  #renderLoadMore() {
    if (!this.#resultsSlot) return;
    const existing = this.#resultsSlot.querySelector('.discover-page__load-more');
    existing?.remove();
    if (this.#page >= this.#totalPages) return;
    const wrap = createElement('div', {
      className: 'discover-page__load-more',
      attrs: { style: 'display:flex;justify-content:center;margin-top:var(--space-6)' },
    });
    wrap.append(new Button({ label: 'Load more', variant: 'outline', onClick: () => this.#load(this.#page + 1) }).render());
    this.#resultsSlot.append(wrap);
  }

  #appendLoadingButton() {
    if (!this.#resultsSlot) return;
    const existing = this.#resultsSlot.querySelector('.discover-page__load-more');
    if (existing) existing.replaceChildren(new Button({ label: 'Loading…', variant: 'outline', loading: true }).render());
  }

  /** @returns {HTMLElement[]} */
  #skeletonCards() {
    return Array.from({ length: 12 }, () => new Skeleton({ shape: 'poster' }).render());
  }

  /** @param {() => void} retry @returns {HTMLElement} */
  #errorState(retry) {
    const wrap = createElement('div', { className: 'section-error', attrs: { role: 'alert' } });
    wrap.append(createElement('p', { text: 'Could not load results.' }));
    wrap.append(new Button({ label: 'Retry', variant: 'outline', size: 'sm', onClick: retry }).render());
    return wrap;
  }
}