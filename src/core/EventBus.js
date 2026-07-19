/**
 * @file A tiny, dependency-free publish/subscribe event bus.
 * Handlers are isolated: a throwing handler never prevents others from running.
 */

export class EventBus {
  /** @type {Map<string, Set<Function>>} */
  #handlers = new Map();

  /** @param {string} event @param {Function} handler @returns {() => void} */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('EventBus.on: handler must be a function');
    }
    let set = this.#handlers.get(event);
    if (!set) { set = new Set(); this.#handlers.set(event, set); }
    set.add(handler);
    return () => this.off(event, handler);
  }

  /** @param {string} event @param {Function} handler @returns {() => void} */
  once(event, handler) {
    const off = this.on(event, (payload) => { off(); handler(payload); });
    return off;
  }

  /** @param {string} event @param {Function} handler */
  off(event, handler) {
    const set = this.#handlers.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this.#handlers.delete(event);
  }

  /** @param {string} event @param {*} [payload] */
  emit(event, payload) {
    const set = this.#handlers.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try { handler(payload); }
      catch (error) { this.onError(event, error); }
    }
  }

  /** @param {string} [event] */
  clear(event) {
    if (event === undefined) this.#handlers.clear();
    else this.#handlers.delete(event);
  }

  /** @param {string} event @param {unknown} error */
  onError(event, error) {
    console.error(`[EventBus] handler error for "${event}":`, error);
  }
}