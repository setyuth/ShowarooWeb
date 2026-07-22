/**
 * @file Background health checks (spec: Background Health Checks). Runs at
 * startup, on an interval, and on demand when a provider repeatedly fails.
 * Probes race a timeout and never block the UI; results feed ProviderStats and
 * therefore scoring. Uses visibilitychange to pause when the tab is hidden.
 */

import { STREAMING } from '../config/index.js';

export class HealthCheckService {
  /** @type {import('./ProviderRegistry.js').ProviderRegistry} */ #registry;
  /** @type {import('./ProviderStats.js').ProviderStats} */ #stats;
  /** @type {import('../core/EventBus.js').EventBus} */ #bus;
  /** @type {number} */ #timer = 0;
  /** @type {typeof STREAMING} */ #cfg;

  /**
   * @param {object} deps
   * @param {import('./ProviderRegistry.js').ProviderRegistry} deps.registry
   * @param {import('./ProviderStats.js').ProviderStats} deps.stats
   * @param {import('../core/EventBus.js').EventBus} deps.bus
   * @param {typeof STREAMING} [deps.cfg]
   */
  constructor({ registry, stats, bus, cfg = STREAMING }) {
    this.#registry = registry; this.#stats = stats; this.#bus = bus; this.#cfg = cfg;
  }

  /** Start: probe once, then schedule periodic checks (paused when hidden). */
  start() {
    this.checkAll();
    this.#schedule();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.#stop();
      else { this.checkAll(); this.#schedule(); }
    });
  }

  #schedule() {
    this.#stop();
    this.#timer = window.setInterval(() => this.checkAll(), this.#cfg.healthCheckInterval);
  }

  #stop() { if (this.#timer) { clearInterval(this.#timer); this.#timer = 0; } }

  /** Probe every provider in parallel; non-blocking. @returns {Promise<void>} */
  async checkAll() {
    await Promise.all(this.#registry.list().map((p) => this.check(p)));
    this.#bus.emit('player:health-updated', this.#stats.all());
  }

  /**
   * Probe one provider with a timeout race.
   * @param {import('./StreamProvider.js').StreamProvider} provider
   * @returns {Promise<void>}
   */
  async check(provider) {
    const started = performance.now();
    try {
      const health = await Promise.race([
        provider.health(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), this.#cfg.probeTimeout)),
      ]);
      this.#stats.recordProbe(provider.id, !!health.ok, Math.round(performance.now() - started));
    } catch {
      this.#stats.recordProbe(provider.id, false, this.#cfg.probeTimeout);
    }
  }
}