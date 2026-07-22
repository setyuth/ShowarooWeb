/**
 * @file Minimal dependency container / composition root.
 *
 * Holds singleton services keyed by name. Registration happens during boot in a
 * deterministic order; resolution is available to any module afterward. The
 * container seals itself after boot to prevent accidental late registration.
 */

import { AppError } from './Result.js';

export class AppContainer {
  /** @type {Map<string, unknown>} */
  #services = new Map();
  /** @type {boolean} */
  #sealed = false;

  /**
   * Register a singleton service instance under a unique key.
   * @template T
   * @param {string} key
   * @param {T} instance
   * @returns {T} The registered instance, for convenient chaining.
   */
  register(key, instance) {
    if (this.#sealed) {
      throw new AppError('CONTAINER_SEALED', `Cannot register "${key}" after boot`);
    }
    if (this.#services.has(key)) {
      throw new AppError('CONTAINER_DUPLICATE', `Service "${key}" already registered`);
    }
    this.#services.set(key, instance);
    return instance;
  }

  /**
   * Resolve a previously registered service.
   * @template T
   * @param {string} key
   * @returns {T}
   */
  resolve(key) {
    if (!this.#services.has(key)) {
      throw new AppError('CONTAINER_MISSING', `Service "${key}" is not registered`);
    }
    return /** @type {T} */ (this.#services.get(key));
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.#services.has(key);
  }

  /** Seal the container so the dependency graph is fixed post-boot. */
  seal() {
    this.#sealed = true;
  }

  /** @returns {boolean} */
  get isSealed() {
    return this.#sealed;
  }
}

/**
 * Canonical service keys. Using constants avoids typo-prone string lookups and
 * documents the full set of first-class services as the app grows.
 */
export const SERVICES = Object.freeze({
  logger: 'logger',
  bus: 'bus',
  localStore: 'localStore',
  sessionStore: 'sessionStore',
});