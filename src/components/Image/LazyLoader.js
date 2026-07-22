/**
 * @file Shared IntersectionObserver for images. One observer for the whole app
 * (cheaper than one-per-image). Elements register with a callback fired once
 * when they approach the viewport, then are unobserved.
 */

export class LazyLoader {
  /** @type {IntersectionObserver | null} */ #io = null;
  /** @type {WeakMap<Element, () => void>} */ #cbs = new WeakMap();

  constructor() {
    if ('IntersectionObserver' in window) {
      this.#io = new IntersectionObserver((entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const cb = this.#cbs.get(entry.target);
          obs.unobserve(entry.target);
          this.#cbs.delete(entry.target);
          cb?.();
        }
      }, { rootMargin: '200px 0px', threshold: 0.01 }); // preload just before visible
    }
  }

  /**
   * Run `onEnter` when `el` nears the viewport. If the observer is unavailable,
   * run immediately (graceful fallback).
   * @param {Element} el @param {() => void} onEnter @returns {void}
   */
  observe(el, onEnter) {
    if (!this.#io) { onEnter(); return; }
    this.#cbs.set(el, onEnter);
    this.#io.observe(el);
  }

  /** @param {Element} el */
  unobserve(el) { if (this.#io) { this.#io.unobserve(el); this.#cbs.delete(el); } }
}

/** App-wide singleton. */
export const lazyLoader = new LazyLoader();