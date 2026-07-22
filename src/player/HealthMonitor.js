/**
 * @file Provider health monitoring. Probes providers, caches results with TTL,
 * and exposes a fast, non-blocking health lookup for ordering + failover.
 */

import { CACHE_TTL, STORAGE_KEYS } from '../config/index.js';

/** @typedef {{ ok: boolean, latencyMs: number, checkedAt: number }} HealthRecord */

export class HealthMonitor {
  /** @type {import('../services/storage/StorageService.js').StorageService} */ #store;
  /** @type {Map<string, HealthRecord>} */ #mem = new Map();
  /** @type {number} */ #probeTimeout;

  /**
   * @param {object} deps
   * @param {import('../services/storage/StorageService.js').StorageService} deps.store
   * @param {number} [deps.probeTimeout]
   */
  constructor({ store, probeTimeout = 4000 }) {
    this.#store = store;
    this.#probeTimeout = probeTimeout;
    const saved = store.get(STORAGE_KEYS.providerHealth, null);
    if (saved) for (const [id, rec] of Object.entries(saved)) this.#mem.set(id, rec);
  }

  /**
   * Cached health for a provider; null if never probed.
   * @param {string} id @returns {HealthRecord | null}
   */
  peek(id) { return this.#mem.get(id) ?? null; }

  /**
   * Probe a provider with a timeout race; caches + persists the result.
   * @param {import('./StreamProvider.js').StreamProvider} provider
   * @returns {Promise<HealthRecord>}
   */
  async probe(provider) {
    const started = performance.now();
    /** @type {HealthRecord} */ let record;
    try {
      const health = await Promise.race([
        provider.health(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), this.#probeTimeout)),
      ]);
      record = { ok: !!health.ok, latencyMs: Math.round(performance.now() - started), checkedAt: Date.now() };
    } catch {
      record = { ok: false, latencyMs: this.#probeTimeout, checkedAt: Date.now() };
    }
    this.#mem.set(provider.id, record);
    this.#persist();
    return record;
  }

  /**
   * Probe all providers in parallel (used on the server selector opening).
   * @param {import('./StreamProvider.js').StreamProvider[]} providers
   * @returns {Promise<void>}
   */
  async probeAll(providers) { await Promise.all(providers.map((p) => this.probe(p))); }

  #persist() {
    const obj = Object.fromEntries(this.#mem.entries());
    this.#store.set(STORAGE_KEYS.providerHealth, obj, { ttl: CACHE_TTL.medium });
  }
}