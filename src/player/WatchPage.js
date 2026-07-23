/**
 * @file Watch page at #/watch/:type/:id. Builds the streaming stack
 * (StreamingOrchestrator + ScoringEngine + ProviderStats + StreamingAnalytics)
 * and hosts it in PlayerEngine. Progress is written to AppState for Continue
 * Watching.
 */

import { Page } from '../pages/Page.js';
import { PlayerEngine } from './PlayerEngine.js';
import { StreamingOrchestrator } from './StreamingOrchestrator.js';
import { ScoringEngine } from './ScoringEngine.js';
import { ProviderStats } from './ProviderStats.js';
import { StreamingAnalytics } from './StreamingAnalytics.js';
import { createElement } from '../utils/dom.js';

/**
 * @typedef {object} WatchDeps
 * @property {import('./ProviderRegistry.js').ProviderRegistry} registry
 * @property {import('../repositories/index.js').MovieRepository} movie
 * @property {import('../repositories/index.js').TvRepository} tv
 * @property {import('../state/AppState.js').AppState} state
 * @property {import('../services/storage/StorageService.js').StorageService} store
 * @property {import('../core/EventBus.js').EventBus} bus
 */

export class WatchPage extends Page {
  /** @param {WatchDeps} deps @param {{type:'movie'|'tv', id:string|number}} target */
  constructor(deps, target) { super({}); this.deps = deps; this.target = target; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'watch container' });
    const { registry, movie, tv, state, store, bus } = this.deps;

    if (registry.list().length === 0) {
      root.append(createElement('div', {
        className: 'watch__empty',
        text: 'No streaming provider is configured. Register a licensed provider to enable playback.',
      }));
      return root;
    }

    // The orchestrator stack is built once per page visit; stats/analytics
    // persist across visits via the shared storage service.
    const stats = new ProviderStats(store);
    const scoring = new ScoringEngine();
    const analytics = new StreamingAnalytics(store, stats);
    const orchestrator = new StreamingOrchestrator({ registry, scoring, stats, analytics, state, bus });

    const repo = this.target.type === 'tv' ? tv : movie;
    this.section({
      container: root,
      skeleton: createElement('div', { className: 'watch__skeleton' }),
      load: () => repo.detail(this.target.id),
      render: (detail) => {
        const frag = createElement('div');
        frag.append(createElement('h1', { className: 'watch__title', text: detail.title }));

        const player = new PlayerEngine({
          orchestrator, registry, stats,
          request: { type: this.target.type, id: this.target.id },
          title: detail.title,
          preferredId: state.getState().preferences.preferredProvider,
          onSetPreferred: (id) => state.setPreferences({ preferredProvider: id }),
        });
        frag.append(player.render());

        // Minimal Continue Watching marker; full progress tracking hooks into
        // the player's own monitor in a later pass.
        state.updateProgress({
          media: { id: detail.id, mediaType: detail.mediaType, title: detail.title, posterUrl: detail.posterUrl ?? null, year: detail.year, rating: detail.rating },
          progress: 0, updatedAt: Date.now(),
        });
        return frag;
      },
    });
    return root;
  }
}