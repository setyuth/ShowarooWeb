/**
 * @file Aggregate, anonymous local analytics (spec: Analytics). Totals across all
 * playback, plus derived "most reliable" / "fastest" provider. Used only to
 * inform selection + power a debug panel. Persisted via storage.
 */

import { STORAGE_KEYS } from '../config/index.js';

export class StreamingAnalytics {
  /** @type {import('../services/storage/StorageService.js').StorageService} */ #store;
  /** @type {import('./ProviderStats.js').ProviderStats} */ #stats;
  /** @type {{ attempts:number, success:number, failed:number, failovers:number, startupSum:number, startupN:number }} */ #agg;

  /**
   * @param {import('../services/storage/StorageService.js').StorageService} store
   * @param {import('./ProviderStats.js').ProviderStats} stats
   */
  constructor(store, stats) {
    this.#store = store; this.#stats = stats;
    this.#agg = store.get(`${STORAGE_KEYS.providerAnalytics}:agg`, null)
      ?? { attempts: 0, success: 0, failed: 0, failovers: 0, startupSum: 0, startupN: 0 };
  }

  recordAttempt() { this.#agg.attempts += 1; this.#persist(); }
  recordFailover() { this.#agg.failovers += 1; this.#persist(); }
  recordFailedStart() { this.#agg.failed += 1; this.#persist(); }
  /** @param {string} _id @param {number} startupMs */
  recordSuccess(_id, startupMs) {
    this.#agg.success += 1; this.#agg.startupSum += startupMs; this.#agg.startupN += 1; this.#persist();
  }

  /** @returns {object} snapshot for the debug panel. */
  snapshot() {
    const all = this.#stats.all();
    const ids = Object.keys(all);
    const mostReliable = ids.sort((a, b) => this.#stats.reliability(b) - this.#stats.reliability(a))[0] ?? null;
    const fastest = ids.sort((a, b) => (all[a].avgLatency || Infinity) - (all[b].avgLatency || Infinity))[0] ?? null;
    return {
      totalAttempts: this.#agg.attempts,
      successfulStarts: this.#agg.success,
      failedStarts: this.#agg.failed,
      automaticFailovers: this.#agg.failovers,
      avgStartupMs: this.#agg.startupN ? Math.round(this.#agg.startupSum / this.#agg.startupN) : 0,
      mostReliableProvider: mostReliable,
      fastestProvider: fastest,
    };
  }

  #persist() { this.#store.set(`${STORAGE_KEYS.providerAnalytics}:agg`, this.#agg); }
}