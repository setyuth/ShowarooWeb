/**
 * @file Safe, namespaced storage service over Web Storage.
 * Returns Result values for writes that can fail; safe fallbacks for reads.
 */

import { ok, err } from '../../core/Result.js';

export class StorageService {
  #backend; #namespace; #version;

  /** @param {{backend: Storage, namespace: string, schemaVersion: number}} options */
  constructor({ backend, namespace, schemaVersion }) {
    this.#backend = StorageService.#isUsable(backend) ? backend : null;
    this.#namespace = namespace;
    this.#version = schemaVersion;
  }

  get isAvailable() { return this.#backend !== null; }

  /** @template T @param {string} key @param {T} [fallback=null] @returns {T} */
  get(key, fallback = null) {
    if (!this.#backend) return fallback;
    const raw = this.#backend.getItem(this.#prefixed(key));
    if (raw === null) return fallback;
    let envelope = null;
    try { envelope = JSON.parse(raw); }
    catch { this.remove(key); return fallback; }
    if (!envelope || envelope.v !== this.#version) { this.remove(key); return fallback; }
    if (envelope.ttl !== null && Date.now() - envelope.t > envelope.ttl) {
      this.remove(key); return fallback;
    }
    return envelope.d;
  }

  /** @param {string} key @param {*} value @param {{ttl?: number|null}} [options] */
  set(key, value, { ttl = null } = {}) {
    if (!this.#backend) return err('STORAGE_UNAVAILABLE', 'Storage backend is not available');
    const envelope = { v: this.#version, t: Date.now(), ttl, d: value };
    try {
      this.#backend.setItem(this.#prefixed(key), JSON.stringify(envelope));
      return ok(true);
    } catch (error) {
      const isQuota = error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
      return err(
        isQuota ? 'STORAGE_QUOTA_EXCEEDED' : 'STORAGE_WRITE_FAILED',
        isQuota ? 'Storage quota exceeded' : 'Failed to write to storage',
        error,
      );
    }
  }

  /** @param {string} key */
  remove(key) {
    if (!this.#backend) return;
    this.#backend.removeItem(this.#prefixed(key));
  }

  clearNamespace() {
    if (!this.#backend) return;
    const prefix = `${this.#namespace}:`;
    const toRemove = [];
    for (let i = 0; i < this.#backend.length; i += 1) {
      const key = this.#backend.key(i);
      if (key && key.startsWith(prefix)) toRemove.push(key);
    }
    toRemove.forEach((key) => this.#backend?.removeItem(key));
  }

  #prefixed(key) { return `${this.#namespace}:${key}`; }

  static #isUsable(backend) {
    if (!backend) return false;
    const probe = '__showaroo_probe__';
    try { backend.setItem(probe, '1'); backend.removeItem(probe); return true; }
    catch { return false; }
  }
}