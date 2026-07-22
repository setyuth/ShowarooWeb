/**
 * @file Orchestrates multiple lawfully-registered providers: effective ordering
 * (preferred > reliability/latency score > registration order), health-aware
 * failover, and analytics recording. Does not resolve content itself.
 */

import { err } from '../core/Result.js';

/**
 * @typedef {object} ResolveOutcome
 * @property {import('./StreamProvider.js').PlayableSource} source
 * @property {string} providerId
 */

export class ProviderManager {
  /** @type {import('./ProviderRegistry.js').ProviderRegistry} */ #registry;
  /** @type {import('./HealthMonitor.js').HealthMonitor} */ #health;
  /** @type {import('./ProviderAnalytics.js').ProviderAnalytics} */ #analytics;
  /** @type {import('../state/AppState.js').AppState} */ #state;

  /**
   * @param {object} deps
   * @param {import('./ProviderRegistry.js').ProviderRegistry} deps.registry
   * @param {import('./HealthMonitor.js').HealthMonitor} deps.health
   * @param {import('./ProviderAnalytics.js').ProviderAnalytics} deps.analytics
   * @param {import('../state/AppState.js').AppState} deps.state
   */
  constructor({ registry, health, analytics, state }) {
    this.#registry = registry; this.#health = health;
    this.#analytics = analytics; this.#state = state;
  }

  /**
   * Providers in effective order. Preferred provider first (if set + present),
   * then by a combined reliability/latency/health score, then registration order.
   * @param {string} [forceId] Put this provider first (manual selection).
   * @returns {import('./StreamProvider.js').StreamProvider[]}
   */
  order(forceId) {
    const providers = this.#registry.list();
    const preferredId = forceId ?? this.#state.getState().preferences.preferredProvider;
    return providers
      .map((p, i) => ({ p, i, key: this.#rankKey(p, preferredId) }))
      .sort((a, b) => b.key - a.key || a.i - b.i)
      .map((x) => x.p);
  }

  /**
   * Resolve a source with failover across the ordered providers.
   * @param {import('./StreamProvider.js').MediaRequest} request
   * @param {{ forceId?: string }} [options]
   * @returns {Promise<import('../core/Result.js').Result<ResolveOutcome>>}
   */
  async resolve(request, { forceId } = {}) {
    const ordered = this.order(forceId);
    if (ordered.length === 0) return err('NO_PROVIDER', 'No streaming provider is configured.');

    const failures = [];
    for (const provider of ordered) {
      const started = performance.now();
      let result;
      try {
        result = await provider.resolve(request);
      } catch (error) {
        result = err('PROVIDER_THREW', `${provider.name} failed`, error);
      }
      if (result.ok) {
        this.#analytics.recordSuccess(provider.id, Math.round(performance.now() - started));
        return { ok: true, value: { source: result.value, providerId: provider.id } };
      }
      this.#analytics.recordFailure(provider.id);
      failures.push(`${provider.name}: ${result.error.code}`);
    }
    return err('ALL_PROVIDERS_FAILED', `No server could play this title (${failures.join('; ')}).`);
  }

  /** @param {import('./StreamProvider.js').StreamProvider} p @param {string} [preferredId] @returns {number} */
  #rankKey(p, preferredId) {
    if (preferredId && p.id === preferredId) return Number.MAX_SAFE_INTEGER;
    const health = this.#health.peek(p.id);
    const healthScore = health ? (health.ok ? 1 : 0) : 0.5;
    const latencyPenalty = health ? Math.min(health.latencyMs, 5000) / 5000 : 0.5;
    // Weighted: reliability dominates, health next, low latency as tiebreaker.
    return this.#analytics.score(p.id) * 2 + healthScore - latencyPenalty * 0.5;
  }
}