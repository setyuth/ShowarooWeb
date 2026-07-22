/**
 * @file Full search results page at #/search?q=... . Renders a responsive grid
 * of results with standardized loading/empty/error states, and keeps the URL in
 * sync so searches are shareable/deep-linkable (within hash-routing constraints).
 */

import { Page } from '../pages/Page.js';
import { MediaCard } from '../components/Card/MediaCard.js';
import { Skeleton } from '../components/Skeleton/Skeleton.js';
import { createGrid } from '../layout/Grid.js';
import { createElement } from '../utils/dom.js';

/**
 * @typedef {object} SearchPageDeps
 * @property {import('../repositories/index.js').SearchRepository} search
 * @property {import('../state/AppState.js').AppState} state
 * @property {import('../layout/Router.js').Router} router
 */

export class SearchPage extends Page {
  /** @type {SearchPageDeps} */ #deps;
  /** @type {string} */ #query;

  /** @param {SearchPageDeps} deps @param {string} query */
  constructor(deps, query) { super({}); this.#deps = deps; this.#query = query; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'search-page container' });
    root.append(createElement('h1', {
      className: 'search-page__title',
      text: this.#query ? `Results for “${this.#query}”` : 'Search',
    }));
    const results = createElement('div', { className: 'search-page__results' });
    root.append(results);

    if (this.#query) {
      this.#deps.state.recordSearch(this.#query);
      this.section({
        container: results,
        skeleton: this.#skeletonGrid(),
        load: () => this.#deps.search.multi(this.#query),
        isEmpty: (v) => v.items.length === 0,
        empty: () => this.#empty(),
        render: (v) => this.#grid(v.items),
      });
    } else {
      results.append(this.#empty('Type in the search bar to find movies, TV shows, and people.'));
    }
    return root;
  }

  /** @param {any[]} items @returns {HTMLElement} */
  #grid(items) {
    const cards = items.map((item) => {
      const wrap = createElement('div');
      new MediaCard({
        model: {
          ...item,
          isFavorite: this.#deps.state.select.isFavorite(item.id, item.mediaType)(this.#deps.state.getState()),
          isWatchLater: this.#deps.state.select.isWatchLater(item.id, item.mediaType)(this.#deps.state.getState()),
        },
        onOpen: (id) => this.#deps.router.navigate(`/${item.mediaType}/${id}`),
        onToggleFavorite: () => this.#deps.state.toggleFavorite(this.#toRef(item)),
        onToggleWatchLater: () => this.#deps.state.toggleWatchLater(this.#toRef(item)),
      }).mount(wrap);
      return wrap;
    });
    return createGrid({ min: '160px', children: cards });
  }

  /** @param {any} m */
  #toRef(m) { return { id: m.id, mediaType: m.mediaType, title: m.title, posterUrl: m.posterUrl ?? null, year: m.year, rating: m.rating }; }

  #skeletonGrid() {
    const cards = Array.from({ length: 12 }, () => new Skeleton({ shape: 'poster' }).render());
    return createGrid({ min: '160px', children: cards });
  }

  /** @param {string} [msg] */
  #empty(msg = 'No results found. Try a different search.') {
    return createElement('div', { className: 'search-page__empty', text: msg });
  }
}