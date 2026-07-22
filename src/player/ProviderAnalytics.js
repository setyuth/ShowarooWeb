/**
 * @file Per-provider analytics: success/failure counts + rolling average latency.
 * Persisted via storage (§16). Feeds effective ordering (reliable, fast providers
 * rise). Pure bookkeeping; no PII, no external calls.
 */

import { STORAGE_KEYS } from '../config/index.js';

/** @typedef {{ success: number, failure: number, avgLatencyMs: number }} ProviderStat */

export class ProviderAnalytics {
  /** @type {import('../services/storage/StorageService.js').StorageService} */ #store;
  /** @type {Record<string, ProviderStat>} */ #stats;

  /** @param {import('../services/storage/StorageService.js').StorageService} store */
  constructor(store) {
    this.#store = store;
    this.#stats = store.get(STORAGE_KEYS.providerAnalytics, {}) ?? {};
  }

  /** @param {string} id @returns {ProviderStat} */
  get(id) { return this.#stats[id] ?? { success: 0, failure: 0, avgLatencyMs: 0 }; }

  /** @param {string} id @param {number} latencyMs */
  recordSuccess(id, latencyMs) {
    const s = this.get(id);
    const n = s.success + 1;
    this.#stats[id] = { ...s, success: n, avgLatencyMs: Math.round((s.avgLatencyMs * s.success + latencyMs) / n) };
    this.#persist();
  }

  /** @param {string} id */
  recordFailure(id) {
    const s = this.get(id);
    this.#stats[id] = { ...s, failure: s.failure + 1 };
    this.#persist();
  }

  /**
   * Reliability score in [0,1]; unknown providers get a neutral 0.5 so they are
   * tried but not preferred over proven ones.
   * @param {string} id @returns {number}
   */
  score(id) {
    const s = this.get(id);
    const total = s.success + s.failure;
    return total === 0 ? 0.5 : s.success / total;
  }

  #persist() { this.#store.set(STORAGE_KEYS.providerAnalytics, this.#stats); }
}