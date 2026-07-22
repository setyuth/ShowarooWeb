/**
 * @file Provider registry. Holds registered providers in priority order and
 * exposes them to the player + (Phase 12) the manager. Deliberately open: an
 * operator registers only providers they are licensed to use.
 */

export class ProviderRegistry {
  /** @type {import('./StreamProvider.js').StreamProvider[]} */ #providers = [];

  /** @param {import('./StreamProvider.js').StreamProvider} provider @returns {this} */
  register(provider) { this.#providers.push(provider); return this; }

  /** @returns {import('./StreamProvider.js').StreamProvider[]} */
  list() { return [...this.#providers]; }

  /** @param {string} id @returns {import('./StreamProvider.js').StreamProvider | undefined} */
  get(id) { return this.#providers.find((p) => p.id === id); }

  /** @returns {import('./StreamProvider.js').StreamProvider | undefined} */
  get default() { return this.#providers[0]; }
}