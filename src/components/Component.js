/**
 * @file Base component contract shared by every UI component.
 *
 * Minimal lifecycle with automatic listener cleanup. No virtual DOM, no deps:
 * components own a single root element and re-render by replacing it in place.
 */

import { on as domOn } from '../utils/dom.js';

/**
 * @template {object} [P=object]
 * @abstract
 */
export class Component {
  /** @type {P} */
  props;
  /** @type {HTMLElement | null} */
  #root = null;
  /** @type {Array<() => void>} */
  #disposers = [];

  /** @param {P} [props] */
  constructor(props = /** @type {P} */ ({})) {
    this.props = props;
  }

  /** The rendered root element, or null before first render. @returns {HTMLElement | null} */
  get el() {
    return this.#root;
  }

  /**
   * Build and return the root element. Subclasses MUST implement.
   * @abstract
   * @returns {HTMLElement}
   */
  render() {
    throw new Error('Component.render() must be implemented by subclass');
  }

  /**
   * Render once and append to a parent.
   * @param {ParentNode} parent
   * @returns {HTMLElement}
   */
  mount(parent) {
    if (!this.#root) this.#root = this.render();
    parent.append(this.#root);
    return this.#root;
  }

  /**
   * Merge new props and re-render in place, preserving DOM position.
   * @param {Partial<P>} next
   * @returns {HTMLElement}
   */
  update(next) {
    this.props = { ...this.props, ...next };
    const fresh = this.render();
    if (this.#root && this.#root.parentNode) {
      this.#root.replaceWith(fresh);
    }
    // Re-rendering supersedes old listeners bound to the previous root.
    this.#flushDisposers();
    this.#root = fresh;
    return fresh;
  }

  /**
   * Register an auto-disposed event listener.
   * @param {EventTarget} target
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} handler
   * @param {boolean | AddEventListenerOptions} [options]
   * @returns {void}
   */
  on(target, type, handler, options) {
    this.#disposers.push(domOn(target, type, handler, options));
  }

  /**
   * Register an arbitrary cleanup callback (timers, observers, subscriptions).
   * @param {() => void} dispose
   * @returns {void}
   */
  addDisposer(dispose) {
    this.#disposers.push(dispose);
  }

  /** Tear down listeners and remove the root. Safe to call more than once. */
  destroy() {
    this.#flushDisposers();
    this.#root?.remove();
    this.#root = null;
  }

  #flushDisposers() {
    for (const dispose of this.#disposers.splice(0)) {
      try { dispose(); } catch { /* disposer errors must not block teardown */ }
    }
  }
}