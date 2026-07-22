/**
 * @file Page-scoped request coalescing + cancellation. Complements the TMDB
 * RequestManager (Phase 5, which de-dupes identical URLs) by tracking requests
 * per navigation so that leaving a page cancels its still-pending, now-
 * irrelevant fetches (via AbortController), freeing the network + avoiding
 * setState-after-unmount style waste.
 */

export class RequestScope {
  /** @type {Set<AbortController>} */ #controllers = new Set();

  /** A fresh AbortSignal tied to this scope. @returns {AbortSignal} */
  signal() {
    const c = new AbortController();
    this.#controllers.add(c);
    return c.signal;
  }

  /** Abort everything still pending in this scope (call on navigation away). */
  dispose() {
    for (const c of this.#controllers) c.abort();
    this.#controllers.clear();
  }
}