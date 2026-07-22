/**
 * @file The default, lawful provider. Resolves a media item's official trailer
 * from TMDB's video metadata (YouTube) and returns a privacy-friendly embed.
 * This gives the Play action a real, licensed function out of the box without
 * touching any copyrighted full-length content.
 */

import { StreamProvider } from './StreamProvider.js';
import { ok, err } from '../core/Result.js';

export class OfficialTrailerProvider extends StreamProvider {
  /** @type {import('../repositories/index.js').MovieRepository} */ #movie;
  /** @type {import('../repositories/index.js').TvRepository} */ #tv;

  /**
   * @param {object} deps
   * @param {import('../repositories/index.js').MovieRepository} deps.movie
   * @param {import('../repositories/index.js').TvRepository} deps.tv
   */
  constructor({ movie, tv }) { super(); this.#movie = movie; this.#tv = tv; }

  get id() { return 'official-trailer'; }
  get name() { return 'Official Trailer'; }

  /**
   * @param {import('./StreamProvider.js').MediaRequest} request
   * @returns {Promise<import('../core/Result.js').Result<import('./StreamProvider.js').PlayableSource>>}
   */
  async resolve(request) {
    const detail = request.type === 'tv'
      ? await this.#tv.detail(request.id)
      : await this.#movie.detail(request.id);
    if (!detail.ok) return detail;

    const videos = detail.value.videos ?? [];
    const pick = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
      ?? videos.find((v) => v.site === 'YouTube');
    if (!pick) return err('NO_SOURCE', 'No official trailer available for this title.');

    return ok({
      kind: 'iframe',
      url: `https://www.youtube-nocookie.com/embed/${pick.key}?autoplay=1&rel=0`,
      title: pick.name ?? detail.value.title,
    });
  }
}