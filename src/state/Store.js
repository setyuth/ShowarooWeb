/**
 * @file Minimal reactive store. Immutable state, selector subscriptions,
 * middleware, and typed change events. Framework-free.
 *
 * @template {Record<string, any>} S
 */

export class Store {
  /** @type {S} */ #state;
  /** @type {Set<{ selector: (s: S) => unknown, last: unknown, cb: (v: any, s: S) => void }>} */
  #subs = new Set();
  /** @type {Array<(action: StoreAction, prev: S, next: S) => void>} */
  #middleware = [];

  /** @param {S} initialState */
  constructor(initialState) { this.#state = Object.freeze({ ...initialState }); }

  /** Current immutable state snapshot. @returns {S} */
  getState() { return this.#state; }

  /**
   * Read a derived value via selector.
   * @template T @param {(s: S) => T} selector @returns {T}
   */
  select(selector) { return selector(this.#state); }

  /**
   * Subscribe to a selected slice. Callback fires immediately with the current
   * value, then whenever that slice changes (reference inequality).
   * @template T
   * @param {(s: S) => T} selector
   * @param {(value: T, state: S) => void} cb
   * @returns {() => void} Unsubscribe.
   */
  subscribe(selector, cb) {
    const entry = { selector, last: selector(this.#state), cb };
    this.#subs.add(entry);
    cb(entry.last, this.#state); // prime
    return () => this.#subs.delete(entry);
  }

  /**
   * Register middleware, invoked after each committed action (persistence,
   * logging). @param {(action: StoreAction, prev: S, next: S) => void} fn
   * @returns {this}
   */
  use(fn) { this.#middleware.push(fn); return this; }

  /**
   * Commit an action via a pure updater. The updater receives current state and
   * returns a partial slice to merge. No-op commits (same reference) skip notify.
   * @param {StoreAction} action
   * @param {(s: S) => Partial<S>} updater
   * @returns {void}
   */
  commit(action, updater) {
    const prev = this.#state;
    const patch = updater(prev);
    const next = Object.freeze({ ...prev, ...patch });
    this.#state = next;
    for (const fn of this.#middleware) fn(action, prev, next);
    this.#notify(next);
  }

  /** @param {S} next */
  #notify(next) {
    for (const entry of this.#subs) {
      const value = entry.selector(next);
      if (!Object.is(value, entry.last)) {
        entry.last = value;
        entry.cb(value, next);
      }
    }
  }
}

/**
 * @typedef {{ type: string, payload?: unknown }} StoreAction
 */