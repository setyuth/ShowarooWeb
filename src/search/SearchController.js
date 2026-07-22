/**
 * @file Coordinates live search: debounce, cancellation, race-guarding, history.
 * Emits results to a single listener (the active view) via onResults.
 */

import { debounce } from '../utils/async.js';

/**
 * @typedef {'idle'|'loading'|'results'|'empty'|'error'} SearchStatus
 * @typedef {object} SearchState
 * @property {SearchStatus} status
 * @property {string} query
 * @property {import('../components/Card/MediaCard.js').MediaCardModel[]} items
 */

export class SearchController {
  /** @type {import('../repositories/index.js').SearchRepository} */ #repo;
  /** @type {import('../state/AppState.js').AppState} */ #state;
  /** @type {AbortController | null} */ #inflight = null;
  /** @type {number} */ #token = 0;
  /** @type {(state: SearchState) => void} */ #listener = () => {};
  /** @type {(q: string) => void} */ #debouncedRun;

  /**
   * @param {object} deps
   * @param {import('../repositories/index.js').SearchRepository} deps.search
   * @param {import('../state/AppState.js').AppState} deps.state
   * @param {number} [deps.debounceMs]
   */
  constructor({ search, state, debounceMs = 300 }) {
    this.#repo = search;
    this.#state = state;
    this.#debouncedRun = debounce((q) => this.#run(q), debounceMs);
  }

  /** @param {(state: SearchState) => void} listener @returns {void} */
  onResults(listener) { this.#listener = listener; }

  /** Recent searches for the initial dropdown. @returns {string[]} */
  get history() { return this.#state.getState().searchHistory; }

  /**
   * Handle raw input. Empty resets to idle immediately (and cancels in-flight).
   * @param {string} raw
   * @returns {void}
   */
  input(raw) {
    const query = raw.trim();
    if (query.length === 0) {
      this.#cancel();
      this.#emit({ status: 'idle', query: '', items: [] });
      return;
    }
    this.#emit({ status: 'loading', query, items: [] });
    this.#debouncedRun(query);
  }

  /**
   * Commit a query (Enter / suggestion click): record history, run immediately.
   * @param {string} query
   * @returns {void}
   */
  commit(query) {
    const q = query.trim();
    if (!q) return;
    this.#state.recordSearch(q);
    this.#run(q);
  }

  /** @param {string} query */
  async #run(query) {
    this.#cancel();
    const controller = new AbortController();
    this.#inflight = controller;
    const token = (this.#token += 1);

    const result = await this.#repo.multi(query, { signal: controller.signal });
    if (token !== this.#token) return; // A newer query superseded this one.

    if (!result.ok) {
      // Aborted requests are expected during fast typing; don't surface as error.
      if (result.error.code === 'TMDB_NETWORK' && controller.signal.aborted) return;
      this.#emit({ status: 'error', query, items: [] });
      return;
    }
    const items = result.value.items;
    this.#emit({ status: items.length ? 'results' : 'empty', query, items });
  }

  #cancel() { this.#inflight?.abort(); this.#inflight = null; }

  /** @param {SearchState} state */
  #emit(state) { this.#listener(state); }
}