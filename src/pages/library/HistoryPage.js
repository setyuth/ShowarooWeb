/**
 * @file History page (#/history). Two sections: Recently Viewed (reactive media
 * grid via the shared CollectionPage) and Search History (a compact,
 * keyboard-accessible list of past queries). Each section has its own clear
 * action and empty state. Consumes data recorded since Phases 8–10 (views) and
 * Phase 9 (searches); adds no new tracking.
 */

import { Page } from '../Page.js';
import { CollectionPage } from './CollectionPage.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} HistoryDeps
 * @property {import('../../state/AppState.js').AppState} state
 * @property {import('../../layout/Router.js').Router} router
 */

export class HistoryPage extends Page {
  /** @type {HistoryDeps} */ #deps;
  /** @type {(()=>void)|null} */ #unsub = null;

  /** @param {HistoryDeps} deps */
  constructor(deps) { super({}); this.#deps = deps; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'history' });

    // --- Recently Viewed: reuse CollectionPage for the media grid ---
    const viewed = new CollectionPage(this.#deps, {
      title: 'Recently Viewed',
      selector: (s) => s.recentlyViewed,
      onRemove: (media) => this.#deps.state.removeRecentlyViewed(media.id, media.mediaType),
      removeLabel: 'Remove from history',
      emptyText: 'Nothing here yet. Titles you open will show up here.',
      emptyCtaLabel: 'Browse titles',
      emptyCtaPath: '/',
      headerAction: {
        label: 'Clear all',
        onClick: () => this.#deps.state.clearRecentlyViewed(),
        // Shown only when the slice is non-empty (CollectionPage handles this).
      },
    });
    root.append(viewed.render());

    // --- Search History: compact list section ---
    const searchSection = createElement('section', { className: 'history__searches container' });
    root.append(searchSection);
    this.#unsub = this.#deps.state.subscribe((s) => s.searchHistory, (queries) => this.#renderSearches(searchSection, queries));
    this.addDisposer(() => this.#unsub?.());
    return root;
  }

  /** @param {HTMLElement} section @param {string[]} queries */
  #renderSearches(section, queries) {
    const header = createElement('div', { className: 'library__header' });
    header.append(createElement('h2', { className: 'library__title', text: 'Recent Searches' }));
    if (queries.length) {
      const clear = createElement('button', { className: 'ui-btn ui-btn--ghost ui-btn--sm', text: 'Clear all', attrs: { type: 'button' } });
      this.on(clear, 'click', () => this.#deps.state.clearSearchHistory());
      header.append(clear);
    }

    if (queries.length === 0) {
      section.replaceChildren(header, createElement('p', { className: 'history__empty-searches', text: 'No recent searches.' }));
      return;
    }

    const list = createElement('ul', { className: 'history__search-list', attrs: { role: 'list' } });
    for (const q of queries) {
      const li = createElement('li', { className: 'history__search-item', attrs: { role: 'listitem' } });
      const go = createElement('button', {
        className: 'history__search-link', text: q,
        attrs: { type: 'button', 'aria-label': `Search again for ${q}` }, dataset: { icon: 'search' },
      });
      this.on(go, 'click', () => this.#deps.router.navigate(`/search?q=${encodeURIComponent(q)}`));
      li.append(go);
      list.append(li);
    }
    section.replaceChildren(header, list);
  }
}