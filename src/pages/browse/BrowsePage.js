/**
 * @file Generic "browse all" page. A tab strip of curated categories; each tab
 * is an independently paginated grid with a Load More control. Used by /movies
 * and /tv — the category lists differ, everything else (loading, empty, error,
 * pagination, card wiring) is shared so neither page reinvents it.
 */

import { Page } from '../Page.js';
import { Tabs } from '../../components/Tabs/Tabs.js';
import { Button } from '../../components/Button/Button.js';
import { MediaCard } from '../../components/Card/MediaCard.js';
import { Skeleton } from '../../components/Skeleton/Skeleton.js';
import { createGrid } from '../../layout/Grid.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} BrowseCategory
 * @property {string} id
 * @property {string} label
 * @property {(page: number) => Promise<import('../../core/Result.js').Result<
 *   {items: any[], page: number, totalPages: number}>>} load
 *
 * @typedef {object} BrowsePageDeps
 * @property {import('../../state/AppState.js').AppState} state
 * @property {import('../../layout/Router.js').Router} router
 *
 * @typedef {object} BrowsePageConfig
 * @property {string} title
 * @property {BrowseCategory[]} categories
 */

export class BrowsePage extends Page {
  /** @type {BrowsePageDeps} */ #deps;
  /** @type {BrowsePageConfig} */ #cfg;

  /** @param {BrowsePageDeps} deps @param {BrowsePageConfig} cfg */
  constructor(deps, cfg) { super({}); this.#deps = deps; this.#cfg = cfg; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'search-page container' });
    root.append(createElement('h1', { className: 'search-page__title', text: this.#cfg.title }));

    const items = this.#cfg.categories.map((cat) => {
      const panel = createElement('div', { className: 'browse-panel' });
      this.#loadCategory(panel, cat);
      return { id: cat.id, label: cat.label, panel };
    });

    root.append(new Tabs({ items }).render());
    return root;
  }

  /**
   * Wire one category's panel: initial load, Load More, retry-on-error.
   * @param {HTMLElement} panel @param {BrowseCategory} cat
   */
  #loadCategory(panel, cat) {
    const grid = createGrid({ min: '160px' });
    const loadMoreWrap = createElement('div', {
      attrs: { style: 'display:flex;justify-content:center;margin-top:var(--space-6)' },
    });
    panel.append(grid, loadMoreWrap);

    let currentPage = 1;
    let totalPages = 1;
    let loading = false;

    /** @param {any[]} list */
    const appendItems = (list) => {
      list.forEach((item, i) => {
        const wrap = createElement('div', { className: 'stagger' });
        wrap.style.setProperty('--i', String(Math.min(grid.children.length + i, 24)));
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
        grid.append(wrap);
      });
    };

    const renderLoadMore = () => {
      loadMoreWrap.replaceChildren();
      if (currentPage >= totalPages) return;
      loadMoreWrap.append(new Button({
        label: 'Load more', variant: 'outline',
        onClick: () => load(currentPage + 1),
      }).render());
    };

    /** @param {number} page */
    const load = async (page) => {
      if (loading) return;
      loading = true;
      if (page === 1) grid.replaceChildren(...this.#skeletonCards());
      else loadMoreWrap.replaceChildren(new Button({ label: 'Loading…', variant: 'outline', loading: true }).render());

      const result = await cat.load(page);
      loading = false;

      if (!result.ok) {
        const retryTarget = page === 1 ? grid : loadMoreWrap;
        retryTarget.replaceChildren(this.#errorState(() => load(page)));
        return;
      }

      currentPage = result.value.page;
      totalPages = result.value.totalPages;

      if (page === 1) {
        grid.replaceChildren();
        if (result.value.items.length === 0) {
          grid.replaceChildren(createElement('div', {
            className: 'search-page__empty', text: 'Nothing to show here right now.',
          }));
          loadMoreWrap.replaceChildren();
          return;
        }
      }

      appendItems(result.value.items);
      renderLoadMore();
    };

    load(1);
  }

  /** @returns {HTMLElement[]} */
  #skeletonCards() {
    return Array.from({ length: 12 }, () => new Skeleton({ shape: 'poster' }).render());
  }

  /** @param {() => void} retry @returns {HTMLElement} */
  #errorState(retry) {
    const wrap = createElement('div', { className: 'section-error', attrs: { role: 'alert' } });
    wrap.append(createElement('p', { text: 'Could not load this section.' }));
    wrap.append(new Button({ label: 'Retry', variant: 'outline', size: 'sm', onClick: retry }).render());
    return wrap;
  }

  /** @param {any} m @returns {import('../../state/shape.js').MediaRef} */
  #toRef(m) {
    return { id: m.id, mediaType: m.mediaType, title: m.title, posterUrl: m.posterUrl ?? null, year: m.year, rating: m.rating };
  }
}