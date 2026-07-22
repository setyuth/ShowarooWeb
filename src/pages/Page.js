/**
 * @file Page base class. A Page owns a route, renders into the shell outlet, and
 * manages its own teardown. Provides a helper to render an async section with
 * skeleton -> content | empty | error, so no page reinvents loading UX (DS 18-20).
 */

import { Component } from '../components/Component.js';

/**
 * @template {object} [P=object]
 * @augments Component<P>
 * @abstract
 */
export class Page extends Component {
  /**
   * Render an async section with standardized states.
   * @template T
   * @param {object} cfg
   * @param {HTMLElement} cfg.container   Where to render.
   * @param {HTMLElement} cfg.skeleton    Shown while loading.
   * @param {() => Promise<import('../core/Result.js').Result<T>>} cfg.load
   * @param {(value: T) => HTMLElement} cfg.render      Success renderer.
   * @param {(value: T) => boolean} [cfg.isEmpty]        Empty predicate.
   * @param {() => HTMLElement} [cfg.empty]              Empty-state renderer.
   * @param {(retry: () => void) => HTMLElement} [cfg.error]  Error renderer.
   * @returns {Promise<void>}
   */
  async section({ container, skeleton, load, render, isEmpty, empty, error }) {
    container.replaceChildren(skeleton);
    const result = await load();
    if (result.ok) {
      if (isEmpty?.(result.value) && empty) container.replaceChildren(empty());
      else container.replaceChildren(render(result.value));
    } else {
      const retry = () => this.section({ container, skeleton, load, render, isEmpty, empty, error });
      container.replaceChildren(
        error ? error(retry) : this.#defaultError(retry),
      );
    }
  }

  /** @param {() => void} retry @returns {HTMLElement} */
  #defaultError(retry) {
    const wrap = document.createElement('div');
    wrap.className = 'section-error';
    wrap.setAttribute('role', 'alert');
    const msg = document.createElement('p');
    msg.textContent = 'Could not load this section.';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ui-btn ui-btn--outline ui-btn--sm';
    btn.textContent = 'Retry';
    btn.addEventListener('click', retry);
    wrap.append(msg, btn);
    return wrap;
  }
}