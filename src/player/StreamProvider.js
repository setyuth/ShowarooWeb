/**
 * @file Streaming provider contract. Every provider implements this interface so
 * the player and the Phase 12 manager treat all providers uniformly. Provider-
 * specific logic lives ONLY in provider implementations (master plan §13).
 */

/**
 * @typedef {object} MediaRequest
 * @property {'movie'|'tv'} type
 * @property {string|number} id           TMDB id.
 * @property {number} [season]
 * @property {number} [episode]
 *
 * @typedef {object} PlayableSource
 * @property {'iframe'|'video'} kind      How the UI should mount it.
 * @property {string} url                 Embeddable/playable URL (provider-vouched).
 * @property {string} [title]
 * @property {boolean} [sandbox]          Whether to sandbox an iframe source.
 *
 * @typedef {object} ProviderHealth
 * @property {boolean} ok
 * @property {number} [latencyMs]
 */

/**
 * @interface
 * @abstract
 */
export class StreamProvider {
  /** Stable unique id. @type {string} */
  get id() { throw new Error('provider must define id'); }
  /** Human-readable name for the server selector. @type {string} */
  get name() { throw new Error('provider must define name'); }

  /**
   * Resolve a playable source for a media request, or a failed Result if the
   * provider cannot serve it. MUST NOT throw.
   * @param {MediaRequest} _request
   * @returns {Promise<import('../core/Result.js').Result<PlayableSource>>}
   */
  async resolve(_request) { throw new Error('provider must implement resolve()'); }

  /**
   * Optional lightweight health probe. Default: assume healthy. Phase 12 uses
   * this for failover ordering.
   * @returns {Promise<ProviderHealth>}
   */
  async health() { return { ok: true }; }
}