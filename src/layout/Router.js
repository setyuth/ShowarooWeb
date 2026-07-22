/**
 * @file Hash-based router (decision recorded in Phase 1 architecture notes).
 *
 * Blogger owns server URLs and cannot resolve pushState paths on refresh, so we
 * use hash routes: fully client-controlled, deep-link safe, refresh safe. Routes
 * are registered as patterns with :params; the router matches, extracts params,
 * and invokes the handler. Framework-free.
 */

import { EventBus } from '../core/EventBus.js';

/**
 * @typedef {{ params: Record<string,string>, query: URLSearchParams, path: string }} RouteContext
 * @typedef {(ctx: RouteContext) => void} RouteHandler
 * @typedef {{ pattern: string, regex: RegExp, keys: string[], handler: RouteHandler }} Route
 */

export class Router {
  /** @type {Route[]} */ #routes = [];
  /** @type {RouteHandler | null} */ #notFound = null;
  /** @type {EventBus} */ #bus;
  /** @type {(() => void) | null} */ #detach = null;

  /** @param {EventBus} bus */
  constructor(bus) { this.#bus = bus; }

  /**
   * Register a route. Pattern uses `:name` for params, e.g. '/movie/:id'.
   * @param {string} pattern
   * @param {RouteHandler} handler
   * @returns {this}
   */
  on(pattern, handler) {
    const keys = [];
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$',
    );
    this.#routes.push({ pattern, regex, keys, handler });
    return this;
  }

  /** @param {RouteHandler} handler @returns {this} */
  fallback(handler) { this.#notFound = handler; return this; }

  /** Navigate programmatically. @param {string} path */
  navigate(path) {
    const target = path.startsWith('#') ? path : `#${path}`;
    if (window.location.hash === target) this.#resolve();
    else window.location.hash = target;
  }

  /** Begin listening and resolve the current URL. @returns {void} */
  start() {
    const onChange = () => this.#resolve();
    window.addEventListener('hashchange', onChange);
    this.#detach = () => window.removeEventListener('hashchange', onChange);
    this.#resolve();
  }

  /** Stop listening. @returns {void} */
  stop() { this.#detach?.(); this.#detach = null; }

  #resolve() {
    const raw = window.location.hash.slice(1) || '/';
    const [path, queryString = ''] = raw.split('?');
    const query = new URLSearchParams(queryString);

    for (const route of this.#routes) {
      const match = route.regex.exec(path);
      if (!match) continue;
      /** @type {Record<string,string>} */ const params = {};
      route.keys.forEach((key, i) => { params[key] = decodeURIComponent(match[i + 1]); });
      this.#bus.emit('route:change', { path, params });
      route.handler({ params, query, path });
      return;
    }
    this.#bus.emit('route:notfound', { path });
    this.#notFound?.({ params: {}, query, path });
  }
}