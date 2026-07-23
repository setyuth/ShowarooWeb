/**
 * @file Season detail page (#/tv/:id/season/:season). Season header (poster,
 * overview) plus the full episode list. Reuses Page's section() helper for
 * standard loading/error states; not a DetailPage subclass since it has no
 * favorite/watch-later actions of its own — those live on the parent show.
 */

import { Page } from '../Page.js';
import { Skeleton } from '../../components/Skeleton/Skeleton.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} SeasonDetailPageDeps
 * @property {import('../../repositories/index.js').TvRepository} tv
 * @property {import('../../layout/Router.js').Router} router
 */

export class SeasonDetailPage extends Page {
  /** @type {SeasonDetailPageDeps} */ #deps;
  /** @type {string|number} */ #tvId;
  /** @type {string|number} */ #seasonNumber;

  /** @param {SeasonDetailPageDeps} deps @param {string|number} tvId @param {string|number} seasonNumber */
  constructor(deps, tvId, seasonNumber) {
    super({});
    this.#deps = deps;
    this.#tvId = tvId;
    this.#seasonNumber = seasonNumber;
  }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'season-detail container' });

    const back = createElement('a', {
      className: 'season-detail__back', text: '\u2190 Back to show',
      attrs: { href: `#/tv/${this.#tvId}` },
    });
    this.on(back, 'click', (e) => { e.preventDefault(); this.#deps.router.navigate(`/tv/${this.#tvId}`); });
    root.append(back);

    const body = createElement('div');
    root.append(body);

    this.section({
      container: body,
      skeleton: this.#skeleton(),
      load: () => this.#deps.tv.season(this.#tvId, this.#seasonNumber),
      render: (m) => this.#renderSeason(m),
    });

    return root;
  }

  /** @param {any} m @returns {HTMLElement} */
  #renderSeason(m) {
    const frag = createElement('div');

    const header = createElement('div', { className: 'season-detail__header' });
    if (m.posterUrl) {
      header.append(createElement('img', {
        className: 'season-detail__poster', attrs: { src: m.posterUrl, alt: m.name, loading: 'eager' },
      }));
    }
    const info = createElement('div', { className: 'season-detail__info' });
    info.append(createElement('h1', { className: 'season-detail__title', text: m.name }));
    const metaParts = [
      m.episodes.length ? `${m.episodes.length} episodes` : null,
      m.airDate ? m.airDate.slice(0, 4) : null,
    ].filter(Boolean);
    if (metaParts.length) info.append(createElement('p', { className: 'season-detail__meta', text: metaParts.join(' \u00b7 ') }));
    if (m.overview) info.append(createElement('p', { className: 'season-detail__overview', text: m.overview }));
    header.append(info);
    frag.append(header);

    if (!m.episodes.length) {
      frag.append(createElement('p', { className: 'search-page__empty', text: 'No episode data available for this season yet.' }));
      return frag;
    }

    const list = createElement('div', { className: 'season-detail__episodes' });
    m.episodes.forEach((ep) => list.append(this.#episodeRow(ep)));
    frag.append(list);
    return frag;
  }

  /** @param {any} ep @returns {HTMLElement} */
  #episodeRow(ep) {
    const row = createElement('article', { className: 'episode-row' });
    if (ep.stillUrl) {
      row.append(createElement('img', {
        className: 'episode-row__still', attrs: { src: ep.stillUrl, alt: '', loading: 'lazy' },
      }));
    }
    const body = createElement('div', { className: 'episode-row__body' });
    const titleLine = createElement('div', { className: 'episode-row__title-line' });
    titleLine.append(createElement('span', { className: 'episode-row__number', text: `${ep.episodeNumber}.` }));
    titleLine.append(createElement('h3', { className: 'episode-row__title', text: ep.name }));
    if (ep.rating && ep.rating !== '0.0') {
      titleLine.append(createElement('span', { className: 'episode-row__rating', text: `\u2605 ${ep.rating}` }));
    }
    body.append(titleLine);

    const metaParts = [ep.airDate, ep.runtime ? `${ep.runtime}m` : null].filter(Boolean);
    if (metaParts.length) body.append(createElement('p', { className: 'episode-row__meta', text: metaParts.join(' \u00b7 ') }));
    if (ep.overview) body.append(createElement('p', { className: 'episode-row__overview', text: ep.overview }));

    row.append(body);
    return row;
  }

  /** @returns {HTMLElement} */
  #skeleton() {
    const wrap = createElement('div', { className: 'season-detail__skeleton' });
    wrap.append(new Skeleton({ shape: 'rect', height: '220px' }).render());
    wrap.append(new Skeleton({ shape: 'text', lines: 6 }).render());
    return wrap;
  }
}