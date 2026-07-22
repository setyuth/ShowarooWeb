/**
 * @file Base for detail pages. Renders an immediate backdrop shell, loads full
 * detail, and provides shared section builders (meta, overview, cast, videos,
 * recommendations). Concrete pages implement #loadDetail + #renderBody.
 */

import { Page } from '../Page.js';
import { Skeleton } from '../../components/Skeleton/Skeleton.js';
import { Badge } from '../../components/Badge/Badge.js';
import { Button } from '../../components/Button/Button.js';
import { ContentRail } from '../home/ContentRail.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} DetailDeps
 * @property {import('../../state/AppState.js').AppState} state
 * @property {import('../../layout/Router.js').Router} router
 */

/**
 * @abstract
 * @augments Page
 */
export class DetailPage extends Page {
  /** @type {DetailDeps} */ detailDeps;

  /** @param {DetailDeps} deps */
  constructor(deps) { super({}); this.detailDeps = deps; }

  /**
   * Concrete pages load their mapped detail model.
   * @abstract @returns {Promise<import('../../core/Result.js').Result<any>>}
   */
  loadDetail() { throw new Error('loadDetail() must be implemented'); }

  /**
   * Concrete pages render the type-specific body below the shared header.
   * @abstract @param {any} model @returns {HTMLElement}
   */
  renderBody() { throw new Error('renderBody() must be implemented'); }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'detail' });
    const body = createElement('div', { className: 'detail__body container' });
    root.append(body);

    this.section({
      container: body,
      skeleton: this.#skeleton(),
      load: () => this.loadDetail(),
      render: (model) => {
        // Record the view once detail resolves (has full media ref).
        this.detailDeps.state.recordView({
          id: model.id, mediaType: model.mediaType, title: model.title,
          posterUrl: model.posterUrl ?? null, year: model.year, rating: model.rating,
        });
        const frag = createElement('div');
        frag.append(this.header(model), this.renderBody(model));
        return frag;
      },
    });
    return root;
  }

  /**
   * Shared backdrop + poster + title/meta/actions header.
   * @param {any} m @returns {HTMLElement}
   */
  header(m) {
    const header = createElement('section', { className: 'detail__header' });
    if (m.backdropUrl) {
      header.append(createElement('img', {
        className: 'detail__backdrop',
        attrs: { src: m.backdropUrl, srcset: m.backdropSrcset ?? '', sizes: '100vw', alt: '', loading: 'eager', decoding: 'async' },
      }));
    }
    header.append(createElement('div', { className: 'detail__scrim', attrs: { 'aria-hidden': 'true' } }));

    const inner = createElement('div', { className: 'detail__header-inner container' });
    if (m.posterUrl) inner.append(createElement('img', { className: 'detail__poster', attrs: { src: m.posterUrl, alt: `${m.title} poster` } }));

    const info = createElement('div', { className: 'detail__info' });
    info.append(createElement('h1', { className: 'detail__title', text: m.title }));
    if (m.tagline) info.append(createElement('p', { className: 'detail__tagline', text: m.tagline }));

    const meta = createElement('div', { className: 'detail__meta' });
    [m.year, m.runtime, m.rating && `★ ${m.rating}`].filter(Boolean)
      .forEach((t) => meta.append(createElement('span', { className: 'detail__meta-item', text: t })));
    info.append(meta);

    if (m.genres?.length) {
      const genres = createElement('div', { className: 'detail__genres' });
      m.genres.forEach((g) => new Badge({ label: g, tone: 'neutral' }).mount(genres));
      info.append(genres);
    }
    if (m.overview) info.append(createElement('p', { className: 'detail__overview', text: m.overview }));

    // Actions: favorite / watch later toggles + play (movie/tv only).
    const actions = createElement('div', { className: 'detail__actions' });
    const ref = { id: m.id, mediaType: m.mediaType, title: m.title, posterUrl: m.posterUrl ?? null, year: m.year, rating: m.rating };
    if (m.mediaType === 'movie' || m.mediaType === 'tv') {
      new Button({ label: 'Play', variant: 'primary', onClick: () => this.detailDeps.router.navigate(`/watch/${m.mediaType}/${m.id}`) }).mount(actions);
    }
    this.#toggleButton(actions, 'Favorite', () => this.detailDeps.state.select.isFavorite(m.id, m.mediaType)(this.detailDeps.state.getState()), () => this.detailDeps.state.toggleFavorite(ref));
    this.#toggleButton(actions, 'Watch Later', () => this.detailDeps.state.select.isWatchLater(m.id, m.mediaType)(this.detailDeps.state.getState()), () => this.detailDeps.state.toggleWatchLater(ref));
    info.append(actions);

    inner.append(info);
    header.append(inner);
    return header;
  }

  /** @param {HTMLElement} parent @param {string} label @param {() => boolean} isOn @param {() => void} toggle */
  #toggleButton(parent, label, isOn, toggle) {
    const btn = new Button({
      label, variant: 'outline',
      onClick: () => { toggle(); render(); },
    });
    const el = btn.mount(parent);
    const render = () => {
      const on = isOn();
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', String(on));
    };
    render();
  }

  /**
   * Cast rail shared by movie/TV/person credits.
   * @param {any[]} cast @returns {HTMLElement}
   */
  castSection(cast) {
    const section = createElement('section', { className: 'detail__cast container' });
    if (!cast?.length) return section;
    section.append(createElement('h2', { className: 'detail__section-title', text: 'Cast' }));
    const track = createElement('div', { className: 'detail__cast-track', attrs: { role: 'list' } });
    for (const person of cast) {
      const card = createElement('div', { className: 'detail__cast-card', attrs: { role: 'listitem' } });
      if (person.profileUrl) card.append(createElement('img', { className: 'detail__cast-photo', attrs: { src: person.profileUrl, alt: person.name, loading: 'lazy' } }));
      card.append(createElement('span', { className: 'detail__cast-name', text: person.name }));
      if (person.character) card.append(createElement('span', { className: 'detail__cast-role', text: person.character }));
      const open = () => this.detailDeps.router.navigate(`/person/${person.id}`);
      card.setAttribute('tabindex', '0'); card.setAttribute('role', 'button');
      this.on(card, 'click', open);
      this.on(card, 'keydown', (e) => { const k = /** @type {KeyboardEvent} */ (e).key; if (k === 'Enter' || k === ' ') { e.preventDefault(); open(); } });
      track.append(card);
    }
    section.append(track);
    return section;
  }

  /**
   * Videos section (YouTube trailers/teasers) rendered as privacy-friendly links
   * that open a modal player on demand (no autoplaying third-party iframes).
   * @param {any[]} videos @returns {HTMLElement}
   */
  videosSection(videos) {
    const section = createElement('section', { className: 'detail__videos container' });
    if (!videos?.length) return section;
    section.append(createElement('h2', { className: 'detail__section-title', text: 'Trailers & Videos' }));
    const grid = createElement('div', { className: 'detail__video-grid' });
    videos.slice(0, 6).forEach((v) => {
      const btn = createElement('button', {
        className: 'detail__video', attrs: { type: 'button', 'aria-label': `Play ${v.name}` },
      });
      btn.append(createElement('img', { className: 'detail__video-thumb', attrs: { src: `https://i.ytimg.com/vi/${v.key}/hqdefault.jpg`, alt: '', loading: 'lazy' } }));
      btn.append(createElement('span', { className: 'detail__video-title', text: v.name }));
      this.on(btn, 'click', () => this.#openVideo(v));
      grid.append(btn);
    });
    section.append(grid);
    return section;
  }

  /** @param {any} v */
  async #openVideo(v) {
    const { Modal } = await import('../../components/Modal/Modal.js');
    const frame = createElement('div', { className: 'detail__video-embed' });
    const iframe = createElement('iframe', {
      attrs: {
        src: `https://www.youtube-nocookie.com/embed/${v.key}?autoplay=1`,
        title: v.name, allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: 'true',
        loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin',
      },
    });
    frame.append(iframe);
    new Modal({ title: v.name, content: frame }).open();
  }

  /**
   * Recommendations rail, wired to state + router like the homepage.
   * @param {string} title @param {any[]} items @returns {HTMLElement}
   */
  recommendationsSection(title, items) {
    if (!items?.length) return createElement('div');
    return new ContentRail({
      title, items,
      onOpen: (id, type) => this.detailDeps.router.navigate(`/${type}/${id}`),
      onToggleFavorite: (m) => this.detailDeps.state.toggleFavorite(this.#ref(m)),
      onToggleWatchLater: (m) => this.detailDeps.state.toggleWatchLater(this.#ref(m)),
      isFavorite: (id, type) => this.detailDeps.state.select.isFavorite(id, type)(this.detailDeps.state.getState()),
      isWatchLater: (id, type) => this.detailDeps.state.select.isWatchLater(id, type)(this.detailDeps.state.getState()),
    }).render();
  }

  /** @param {any} m */
  #ref(m) { return { id: m.id, mediaType: m.mediaType, title: m.title, posterUrl: m.posterUrl ?? null, year: m.year, rating: m.rating }; }

  #skeleton() {
    const wrap = createElement('div', { className: 'detail__skeleton' });
    wrap.append(new Skeleton({ shape: 'rect', height: '42vh' }).render());
    wrap.append(new Skeleton({ shape: 'text', lines: 4 }).render());
    return wrap;
  }
}