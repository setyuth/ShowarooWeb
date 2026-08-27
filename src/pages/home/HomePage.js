/**
 * @file Homepage. Composes a hero + multiple content rails (Trending, Popular,
 * Top Rated, Upcoming, plus Continue Watching when present). Each rail loads
 * independently so one slow/failed section never blocks the rest.
 */

import { Page } from '../Page.js';
import { Hero } from './Hero.js';
import { ContentRail } from './ContentRail.js';
import { Skeleton } from '../../components/Skeleton/Skeleton.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} HomeDeps
 * @property {import('../../repositories/index.js').MovieRepository} movie
 * @property {import('../../repositories/index.js').TvRepository} tv
 * @property {import('../../state/AppState.js').AppState} state
 * @property {import('../../layout/Router.js').Router} router
 */

export class HomePage extends Page {
  /** @type {HomeDeps} */ #deps;

  /** @param {HomeDeps} deps */
  constructor(deps) { super({}); this.#deps = deps; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'home' });
    const heroSlot = createElement('div', { className: 'home__hero' });
    const rails = createElement('div', { className: 'home__rails' });
    root.append(heroSlot, rails);

    this.#loadHero(heroSlot);
    this.#renderContinueWatching(rails);
    this.#addRail(rails, 'Trending This Week', () => this.#deps.movie.trending());
    this.#addRail(rails, 'Popular Movies', () => this.#deps.movie.popular());
    this.#addRail(rails, 'Top Rated', () => this.#deps.movie.topRated());
    this.#addRail(rails, 'Upcoming', () => this.#deps.movie.upcoming());
    this.#addRail(rails, 'Popular on TV', () => this.#deps.tv.popular());
    return root;
  }

  /** @param {HTMLElement} slot */
  async #loadHero(slot) {
    slot.replaceChildren(new Skeleton({ shape: 'rect', height: '60vh' }).render());
    // Pull from both movie and TV trending so the spotlight rotates across
    // both — previously this only ever queried movies, so TV never showed
    // up in the hero no matter how trending it was.
    const [movies, shows] = await Promise.all([
      this.#deps.movie.trending(),
      this.#deps.tv.trending(),
    ]);
    const movieItems = movies.ok ? movies.value.items : [];
    const showItems = shows.ok ? shows.value.items : [];
    const pool = this.#interleave(movieItems, showItems).slice(0, 6);
    if (pool.length === 0) { slot.replaceChildren(); return; }

    const details = await Promise.all(pool.map((item) => this.#detailFor(item)));
    const items = details.map((detail, i) => (detail.ok ? detail.value : pool[i]));
    slot.replaceChildren(new Hero({
      items,
      onPlay: (id, type) => this.#deps.router.navigate(`/watch/${type}/${id}`),
      onDetails: (id, type) => this.#deps.router.navigate(`/${type}/${id}`),
    }).render());
  }

  /**
   * Fetch detail from whichever repo matches the item's media type.
   * @param {any} item @returns {Promise<import('../../core/Result.js').Result<any>>}
   */
  #detailFor(item) {
    const repo = item.mediaType === 'tv' ? this.#deps.tv : this.#deps.movie;
    return repo.detail(item.id);
  }

  /**
   * Alternate between two lists so the combined pool isn't all-movies-then-
   * all-TV — e.g. [m1, t1, m2, t2, m3, t3, m4] if one list runs longer.
   * @param {any[]} a @param {any[]} b @returns {any[]}
   */
  #interleave(a, b) {
    const out = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i += 1) {
      if (a[i]) out.push(a[i]);
      if (b[i]) out.push(b[i]);
    }
    return out;
  }

  /**
   * @param {HTMLElement} parent @param {string} title
   * @param {() => Promise<import('../../core/Result.js').Result<{items: any[]}>>} load
   */
  #addRail(parent, title, load) {
    const container = createElement('div', { className: 'home__rail container' });
    parent.append(container);
    const skeleton = this.#railSkeleton();
    this.section({
      container, skeleton, load,
      isEmpty: (v) => v.items.length === 0,
      empty: () => this.#emptyRail(title),
      render: (v) => new ContentRail({
        title, items: v.items,
        onOpen: (id, type) => this.#deps.router.navigate(`/${type}/${id}`),
        onToggleFavorite: (m) => this.#deps.state.toggleFavorite(this.#toRef(m)),
        onToggleWatchLater: (m) => this.#deps.state.toggleWatchLater(this.#toRef(m)),
        isFavorite: (id, type) => this.#deps.state.select.isFavorite(id, type)(this.#deps.state.getState()),
        isWatchLater: (id, type) => this.#deps.state.select.isWatchLater(id, type)(this.#deps.state.getState()),
      }).render(),
    });
  }

  /** @param {HTMLElement} parent */
  #renderContinueWatching(parent) {
    const cw = Object.values(this.#deps.state.getState().continueWatching)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((e) => ({ ...e.media, progress: e.progress }));
    if (cw.length === 0) return; // Empty by design: omit the rail entirely, no clutter.
    const container = createElement('div', { className: 'home__rail container' });
    parent.append(container);
    container.append(new ContentRail({
      title: 'Continue Watching', items: cw,
      onOpen: (id, type) => this.#deps.router.navigate(`/watch/${type}/${id}`),
      onToggleFavorite: (m) => this.#deps.state.toggleFavorite(this.#toRef(m)),
      onToggleWatchLater: (m) => this.#deps.state.toggleWatchLater(this.#toRef(m)),
      isFavorite: (id, type) => this.#deps.state.select.isFavorite(id, type)(this.#deps.state.getState()),
      isWatchLater: (id, type) => this.#deps.state.select.isWatchLater(id, type)(this.#deps.state.getState()),
    }).render());
  }

  /** @param {any} m @returns {import('../../state/shape.js').MediaRef} */
  #toRef(m) {
    return { id: m.id, mediaType: m.mediaType, title: m.title, posterUrl: m.posterUrl ?? null, year: m.year, rating: m.rating };
  }

  /** @returns {HTMLElement} */
  #railSkeleton() {
    const wrap = createElement('div', { className: 'rail rail--skeleton container' });
    for (let i = 0; i < 6; i += 1) wrap.append(new Skeleton({ shape: 'poster', width: '160px' }).render());
    return wrap;
  }

  /** @param {string} title @returns {HTMLElement} */
  #emptyRail(title) {
    return createElement('div', {
      className: 'rail-empty container',
      text: `Nothing to show in ${title} right now.`,
    });
  }
}