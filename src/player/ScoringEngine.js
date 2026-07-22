/**
 * @file Dynamic provider scoring (spec: Provider Scoring). Combines health,
 * reliability, latency, startup time, user preference, and configured priority
 * using centralized, normalized weights. Higher score wins. Pure + testable.
 */

import { STREAMING } from '../config/index.js';

export class ScoringEngine {
  /** @type {typeof STREAMING} */ #cfg;

  /** @param {typeof STREAMING} [cfg] */
  constructor(cfg = STREAMING) { this.#cfg = cfg; }

  /**
   * Score a provider in [0,1]. Ineligible (cooldown) providers score 0 so they
   * are never auto-selected until recovery.
   * @param {object} input
   * @param {import('./ProviderStats.js').Stat} input.stat
   * @param {boolean} input.eligible
   * @param {number} input.priorityRank   0 = highest configured priority.
   * @param {number} input.priorityCount
   * @param {boolean} input.isPreferred
   * @returns {number}
   */
  score({ stat, eligible, priorityRank, priorityCount, isPreferred }) {
    if (!eligible) return 0;
    const w = this.#normalizedWeights();

    const health = stat.online ? 1 : 0;
    const reliability = (stat.success + stat.failure) === 0 ? 0.5 : stat.success / (stat.success + stat.failure);
    const latency = 1 - Math.min(stat.avgLatency || this.#cfg.latencyCeiling, this.#cfg.latencyCeiling) / this.#cfg.latencyCeiling;
    const startup = 1 - Math.min(stat.avgStartup || this.#cfg.startupCeiling, this.#cfg.startupCeiling) / this.#cfg.startupCeiling;
    const preference = isPreferred ? 1 : 0;
    const priority = priorityCount <= 1 ? 1 : 1 - priorityRank / (priorityCount - 1);

    return (
      health * w.health +
      reliability * w.reliability +
      latency * w.latency +
      startup * w.startup +
      preference * w.preference +
      priority * w.priority
    );
  }

  /** Normalize configured weights so they always sum to 1. @returns {typeof STREAMING.weights} */
  #normalizedWeights() {
    const w = this.#cfg.weights;
    const sum = Object.values(w).reduce((a, b) => a + b, 0) || 1;
    return /** @type {any} */ (Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / sum])));
  }
}