/**
 * @file Live per-provider statistics (spec: Provider Evaluation). Tracks online
 * status, latency spread, success/failure rates, consecutive failures, and
 * timestamps. Pure bookkeeping; persisted via storage under the §16 key. No PII.
 */

import { STORAGE_KEYS } from '../config/index.js';

/**
 * @typedef {object} Stat
 * @property {boolean} online
 * @property {number} avgLatency
 * @property {number} fastestLatency
 * @property {number} slowestLatency
 * @property {number} success
 * @property {number} failure
 * @property {number} consecutiveFailures
 * @property {number} avgStartup
 * @property {number|null} lastSuccessAt
 * @property {number|null} lastCheckAt
 * @property {number|null} unhealthyUntil   Cooldown expiry (recovery gating).
 */

/** @returns {Stat} */
function emptyStat() {
  return {
    online: true, avgLatency: 0, fastestLatency: Infinity, slowestLatency: 0,
    success: 0, failure: 0, consecutiveFailures: 0, avgStartup: 0,
    lastSuccessAt: null, lastCheckAt: null, unhealthyUntil: null,
  };
}

export class ProviderStats {
  /** @type {import('../services/storage/StorageService.js').StorageService} */ #store;
  /** @type {Record<string, Stat>} */ #stats;

  /** @param {import('../services/storage/StorageService.js').StorageService} store */
  constructor(store) {
    this.#store = store;
    this.#stats = store.get(STORAGE_KEYS.providerAnalytics, {}) ?? {};
  }

  /** @param {string} id @returns {Stat} */
  get(id) { return this.#stats[id] ?? emptyStat(); }

  /** @param {string} id @returns {Stat} */
  #mut(id) { const s = this.#stats[id] ?? emptyStat(); this.#stats[id] = s; return s; }

  /**
   * Record a health probe result.
   * @param {string} id @param {boolean} ok @param {number} latencyMs
   */
  recordProbe(id, ok, latencyMs) {
    const s = this.#mut(id);
    s.online = ok;
    s.lastCheckAt = Date.now();
    if (ok) {
      s.fastestLatency = Math.min(s.fastestLatency, latencyMs);
      s.slowestLatency = Math.max(s.slowestLatency, latencyMs);
      s.avgLatency = s.avgLatency ? Math.round(s.avgLatency * 0.7 + latencyMs * 0.3) : latencyMs;
    }
    this.#persist();
  }

  /**
   * Record a successful playback start.
   * @param {string} id @param {number} startupMs
   */
  recordSuccess(id, startupMs) {
    const s = this.#mut(id);
    const n = s.success + 1;
    s.success = n;
    s.consecutiveFailures = 0;
    s.unhealthyUntil = null;
    s.online = true;
    s.lastSuccessAt = Date.now();
    s.avgStartup = Math.round((s.avgStartup * (n - 1) + startupMs) / n);
    this.#persist();
  }

  /**
   * Record a failed playback start; may trip the unhealthy cooldown.
   * @param {string} id @param {number} threshold @param {number} cooldownMs
   */
  recordFailure(id, threshold, cooldownMs) {
    const s = this.#mut(id);
    s.failure += 1;
    s.consecutiveFailures += 1;
    if (s.consecutiveFailures >= threshold) {
      s.online = false;
      s.unhealthyUntil = Date.now() + cooldownMs;
    }
    this.#persist();
  }

  /**
   * Whether a provider is currently eligible (not in active cooldown).
   * @param {string} id @returns {boolean}
   */
  isEligible(id) {
    const s = this.get(id);
    return !s.unhealthyUntil || Date.now() >= s.unhealthyUntil;
  }

  /** @param {string} id @returns {number} reliability in [0,1] */
  reliability(id) {
    const s = this.get(id);
    const total = s.success + s.failure;
    return total === 0 ? 0.5 : s.success / total;
  }

  /** @returns {Record<string, Stat>} */
  all() { return { ...this.#stats }; }

  #persist() { this.#store.set(STORAGE_KEYS.providerAnalytics, this.#stats); }
}