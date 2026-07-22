/**
 * @file Intelligent streaming orchestrator (spec core). Selects the best provider
 * via ScoringEngine, resolves + mounts through a caller-supplied mount callback,
 * monitors startup, retries once on the same provider, then fails over to the
 * next highest-scoring eligible provider. Records stats + analytics and emits
 * seamless status messages. Resolves content ONLY through registered lawful
 * providers; it never fetches sources itself.
 */

import { STREAMING } from '../config/index.js';
import { err } from '../core/Result.js';

/**
 * @typedef {object} OrchestratorStatus
 * @property {'finding'|'connecting'|'switching'|'restored'|'failed'} phase
 * @property {string} message
 * @property {string} [providerId]
 */

export class StreamingOrchestrator {
  /** @type {import('./ProviderRegistry.js').ProviderRegistry} */ #registry;
  /** @type {import('./ScoringEngine.js').ScoringEngine} */ #scoring;
  /** @type {import('./ProviderStats.js').ProviderStats} */ #stats;
  /** @type {import('./StreamingAnalytics.js').StreamingAnalytics} */ #analytics;
  /** @type {import('../state/AppState.js').AppState} */ #state;
  /** @type {import('../core/EventBus.js').EventBus} */ #bus;
  /** @type {typeof STREAMING} */ #cfg;

  /** @param {object} deps */
  constructor({ registry, scoring, stats, analytics, state, bus, cfg = STREAMING }) {
    this.#registry = registry; this.#scoring = scoring; this.#stats = stats;
    this.#analytics = analytics; this.#state = state; this.#bus = bus; this.#cfg = cfg;
  }

  /**
   * Providers sorted by live score, highest first. Ineligible (cooldown) score 0.
   * @param {string} [forceId] Manual selection: only this provider.
   * @returns {import('./StreamProvider.js').StreamProvider[]}
   */
  rank(forceId) {
    const providers = this.#registry.list();
    if (forceId) return providers.filter((p) => p.id === forceId);
    const preferredId = this.#state.getState().preferences.preferredProvider;
    return providers
      .map((p, i) => ({
        p,
        s: this.#scoring.score({
          stat: this.#stats.get(p.id),
          eligible: this.#stats.isEligible(p.id),
          priorityRank: i, priorityCount: providers.length,
          isPreferred: p.id === preferredId,
        }),
      }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.p);
  }

  /**
   * Play a request with automatic selection + failover.
   * @param {import('./StreamProvider.js').MediaRequest} request
   * @param {(source: import('./StreamProvider.js').PlayableSource) => (HTMLIFrameElement|HTMLVideoElement)} mount
   *        Mounts the source and returns the element to monitor.
   * @param {{ forceId?: string, onStatus?: (s: OrchestratorStatus) => void }} [options]
   * @returns {Promise<import('../core/Result.js').Result<{ providerId: string }>>}
   */
  async play(request, mount, { forceId, onStatus = () => {} } = {}) {
    this.#analytics.recordAttempt();
    const ordered = this.rank(forceId);
    if (ordered.length === 0) return err('NO_PROVIDER', 'No streaming provider is configured.');

    const autoFailover = this.#cfg.autoFailover && !forceId;
    const maxSameProvider = this.#cfg.retryCount + 1; // initial try + retries
    const failures = [];

    onStatus({ phase: 'finding', message: 'Finding the best server…' });

    for (let pi = 0; pi < ordered.length; pi += 1) {
      const provider = ordered[pi];
      if (pi > 0) {
        onStatus({ phase: 'switching', message: 'Switching to another server…', providerId: provider.id });
        this.#analytics.recordFailover();
      }

      for (let attempt = 0; attempt < maxSameProvider; attempt += 1) {
        onStatus({ phase: 'connecting', message: attempt === 0 ? 'Connecting…' : 'Retrying…', providerId: provider.id });
        const outcome = await this.#tryProvider(provider, request, mount);

        if (outcome.ok) {
          this.#stats.recordSuccess(provider.id, outcome.startupMs);
          this.#analytics.recordSuccess(provider.id, outcome.startupMs);
          onStatus({ phase: pi > 0 ? 'restored' : 'connecting', message: pi > 0 ? 'Playback restored.' : 'Connecting…', providerId: provider.id });
          this.#bus.emit('player:health-updated', this.#stats.all());
          return { ok: true, value: { providerId: provider.id } };
        }
        failures.push(`${provider.name}:${outcome.reason}`);
        // Retry once on the SAME provider before moving on (spec step 1).
      }

      // Same-provider retries exhausted: mark failure, maybe cool down.
      this.#stats.recordFailure(provider.id, this.#cfg.failureThreshold, this.#cfg.unhealthyCooldown);
      this.#analytics.recordFailedStart();
      if (!autoFailover) break; // Manual mode / failover off: stop after first provider.
    }

    onStatus({ phase: 'failed', message: 'We could not start playback. Try another server.', });
    return err('ALL_PROVIDERS_FAILED', `No server could play this title (${failures.join('; ')}).`);
  }

  /**
   * One resolve+mount+monitor cycle.
   * @param {import('./StreamProvider.js').StreamProvider} provider
   * @param {import('./StreamProvider.js').MediaRequest} request
   * @param {(source: any) => (HTMLIFrameElement|HTMLVideoElement)} mount
   * @returns {Promise<{ ok: true, startupMs: number } | { ok: false, reason: string }>}
   */
  async #tryProvider(provider, request, mount) {
    let resolved;
    try {
      resolved = await provider.resolve(request);
    } catch {
      return { ok: false, reason: 'threw' };
    }
    if (!resolved.ok) return { ok: false, reason: resolved.error.code };

    const { PlaybackMonitor } = await import('./PlaybackMonitor.js');
    const el = mount(resolved.value);
    const { outcome, elapsedMs } = await PlaybackMonitor.watch(el, this.#cfg.startupTimeout);
    return outcome === 'started' ? { ok: true, startupMs: elapsedMs } : { ok: false, reason: outcome };
  }
}