/**
 * @file Watch page at #/watch/:type/:id. Hosts the PlayerEngine with the active
 * provider, shows the title, a server selector (single default until Phase 12),
 * and tracks playback progress into AppState for Continue Watching (Phase 13
 * deepens this; a minimal start marker is written here).
 */

import { Page } from '../pages/Page.js';
import { PlayerEngine } from './PlayerEngine.js';
import { createElement } from '../utils/dom.js';

/**
 * @typedef {object} WatchDeps
 * @property {import('./ProviderRegistry.js').ProviderRegistry} registry
 * @property {import('../repositories/index.js').MovieRepository} movie
 * @property {import('../repositories/index.js').TvRepository} tv
 * @property {import('../state/AppState.js').AppState} state
 */

export class WatchPage extends Page {
  /** @param {WatchDeps} deps @param {{type:'movie'|'tv', id:string|number}} target */
  constructor(deps, target) { super({}); this.deps = deps; this.target = target; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'watch container' });
    const provider = this.deps.registry.default;

    if (!provider) {
      root.append(createElement('div', {
        className: 'watch__empty',
        text: 'No streaming provider is configured. Register a licensed provider to enable playback.',
      }));
      return root;
    }

    const repo = this.target.type === 'tv' ? this.deps.tv : this.deps.movie;
    this.section({
      container: root,
      skeleton: createElement('div', { className: 'watch__skeleton' }),
      load: () => repo.detail(this.target.id),
      render: (detail) => {
        const frag = createElement('div');
        frag.append(createElement('h1', { className: 'watch__title', text: detail.title }));
        const player = new PlayerEngine({
          request: { type: this.target.type, id: this.target.id },
          provider, title: detail.title,
        });
        frag.append(player.render());
        // Minimal Continue Watching marker; real progress tracking is Phase 13.
        this.deps.state.updateProgress({
          media: { id: detail.id, mediaType: detail.mediaType, title: detail.title, posterUrl: detail.posterUrl ?? null, year: detail.year, rating: detail.rating },
          progress: 0, updatedAt: Date.now(),
        });
        return frag;
      },
    });
    return root;
  }
}