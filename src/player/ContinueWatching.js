/**
 * @file Continue Watching service: read/query/remove entries and compute resume
 * targets. Thin domain layer over AppState so pages don't poke the store shape.
 */

export class ContinueWatching {
  /** @type {import('../state/AppState.js').AppState} */ #state;

  /** @param {import('../state/AppState.js').AppState} state */
  constructor(state) { this.#state = state; }

  /**
   * Active entries (not completed), newest first.
   * @returns {import('../state/shape.js').ContinueEntry[]}
   */
  list() {
    return Object.values(this.#state.getState().continueWatching)
      .filter((e) => !e.completed)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Resume target for a media item, or null if none.
   * @param {'movie'|'tv'} type @param {string|number} id
   * @returns {{ path: string, resumeSec: number } | null}
   */
  resume(type, id) {
    const entry = this.#state.getState().continueWatching[`${type}:${id}`];
    if (!entry || entry.completed) return null;
    const suffix = type === 'tv' && entry.season && entry.episode ? `/${entry.season}/${entry.episode}` : '';
    return { path: `/watch/${type}/${id}${suffix}`, resumeSec: entry.positionSec ?? 0 };
  }

  /** @param {'movie'|'tv'} type @param {string|number} id @returns {void} */
  remove(type, id) { this.#state.removeContinueWatching(`${type}:${id}`); }

  /** @returns {void} */
  clearCompleted() { this.#state.clearCompletedContinueWatching(); }
}