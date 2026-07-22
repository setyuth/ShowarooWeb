/**
 * @file Centralized streaming orchestration configuration. Every tunable the
 * orchestrator uses lives here (spec: Configuration). Frozen; overridable at
 * boot via window.__SHOWAROO_ENV__.streaming for per-deployment tuning.
 */

import { env } from './env.js';

/** @type {Record<string, number>} */
const overrides = (env && /** @type {any} */ (env).streaming) || {};

export const STREAMING = Object.freeze({
  /** Automatic failover master switch. */
  autoFailover: overrides.autoFailover ?? true,
  /** Per-provider startup timeout (iframe load / playback init), ms. */
  startupTimeout: overrides.startupTimeout ?? 8000,
  /** Retries on the SAME provider before failing over. */
  retryCount: overrides.retryCount ?? 1,
  /** Background health-check interval, ms. */
  healthCheckInterval: overrides.healthCheckInterval ?? 5 * 60 * 1000,
  /** Cooldown before a failed provider is eligible again, ms. */
  unhealthyCooldown: overrides.unhealthyCooldown ?? 2 * 60 * 1000,
  /** Consecutive failures that mark a provider temporarily unhealthy. */
  failureThreshold: overrides.failureThreshold ?? 2,
  /** Health probe timeout, ms. */
  probeTimeout: overrides.probeTimeout ?? 4000,

  /** Scoring weights (spec: configurable weights). Normalized internally. */
  weights: Object.freeze({
    health: overrides.weightHealth ?? 0.30,
    reliability: overrides.weightReliability ?? 0.30,
    latency: overrides.weightLatency ?? 0.15,
    startup: overrides.weightStartup ?? 0.10,
    preference: overrides.weightPreference ?? 0.10,
    priority: overrides.weightPriority ?? 0.05,
  }),
  /** Latency (ms) mapped to the worst score; below this scales linearly. */
  latencyCeiling: overrides.latencyCeiling ?? 5000,
  startupCeiling: overrides.startupCeiling ?? 10000,
});