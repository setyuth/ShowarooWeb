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
    const trending = await this.#deps.movie.trending();
    if (!trending.ok || trending.value.items.length === 0) { slot.replaceChildren(); return; }
    // Spotlight the top trending item; fetch its detail for overview + backdrop logo.
    const top = trending.value.items[0];
    const detail = await this.#deps.movie.detail(top.id);
    const media = detail.ok ? detail.value : top;
    slot.replaceChildren(new Hero({
      media,
      onPlay: (id, type) => this.#deps.router.navigate(`/watch/${type}/${id}`),
      onDetails: (id, type) => this.#deps.router.navigate(`/${type}/${id}`),
    }).render());
  }

  /**
   * @param {HTMLElement} parent @param {string} title
   * @param {() => Promise<import('../../core/Result.js').Result<{items: any[]}>>} load
   */
  #addRail(parent, title, load) {
    const container = createElement('div', { className: 'home__rail' });
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
    const container = createElement('div', { className: 'home__rail' });
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