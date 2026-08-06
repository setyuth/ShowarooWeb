/** @file Player barrel + factory, now wiring the full manager stack. */
export { StreamProvider } from './StreamProvider.js';
export { OfficialTrailerProvider } from './OfficialTrailerProvider.js';
export { InternetArchiveProvider } from './InternetArchiveProvider.js';
export { ProviderRegistry } from './ProviderRegistry.js';
export { HealthMonitor } from './HealthMonitor.js';
export { ProviderAnalytics } from './ProviderAnalytics.js';
export { ProviderManager } from './ProviderManager.js';
export { PlayerEngine } from './PlayerEngine.js';
export { ServerSelector } from './ServerSelector.js';
export { WatchPage } from './WatchPage.js';

/**
 * Build the full orchestrated player stack. Operators register additional
 * LICENSED providers on the registry; the orchestrator does the rest.
 *
 * NOTE: this factory is not currently called anywhere — Bootstrap.js#initPlayer()
 * builds its own ProviderRegistry by hand instead. It also references
 * ScoringEngine / StreamingOrchestrator / ProviderStats / StreamingAnalytics /
 * HealthCheckService, none of which are imported above, and none of which
 * match this file's actual exports (HealthMonitor / ProviderAnalytics /
 * ProviderManager). Left as-is per your instruction — flagging again here
 * so it isn't mistaken for working wiring later.
 *
 * @param {object} deps
 * @param {{ movie:any, tv:any }} deps.repos
 * @param {import('../services/storage/StorageService.js').StorageService} deps.store
 * @param {import('../state/AppState.js').AppState} deps.state
 * @param {import('../core/EventBus.js').EventBus} deps.bus
 */
export function createPlayerStack({ repos, store, state, bus }) {
  const registry = new ProviderRegistry().register(new OfficialTrailerProvider(repos));
  const stats = new ProviderStats(store);
  const scoring = new ScoringEngine();
  const analytics = new StreamingAnalytics(store, stats);
  const health = new HealthCheckService({ registry, stats, bus });
  const orchestrator = new StreamingOrchestrator({ registry, scoring, stats, analytics, state, bus });
  return { registry, stats, scoring, analytics, health, orchestrator };
}