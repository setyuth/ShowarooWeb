/**
 * @file Tooltip. Attaches to a target element; shows on hover + focus (a11y),
 * hides on blur/leave/Escape. Uses aria-describedby so screen readers announce it.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} TooltipProps
 * @property {HTMLElement} target
 * @property {string} text
 * @property {'top'|'bottom'|'left'|'right'} [placement]
 */

export class Tooltip extends Component {
  /** @type {number} */ static #seq = 0;

  /** @param {TooltipProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { target, text, placement = 'top' } = this.props;
    const id = `ui-tip-${(Tooltip.#seq += 1)}`;
    const tip = createElement('span', {
      className: `ui-tooltip ui-tooltip--${placement}`,
      text,
      attrs: { role: 'tooltip', id },
    });
    tip.hidden = true;
    target.setAttribute('aria-describedby', id);

    const show = () => { tip.hidden = false; };
    const hide = () => { tip.hidden = true; };
    this.on(target, 'mouseenter', show);
    this.on(target, 'mouseleave', hide);
    this.on(target, 'focus', show);
    this.on(target, 'blur', hide);
    this.on(target, 'keydown', (e) => { if (/** @type {KeyboardEvent} */ (e).key === 'Escape') hide(); });
    return tip;
  }
}