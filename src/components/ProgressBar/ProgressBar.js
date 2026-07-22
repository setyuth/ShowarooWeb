/**
 * @file Progress bar. Used for Continue Watching progress + buffering. DS §14.
 * Exposes proper ARIA range semantics.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';
import { clamp } from '../../utils/guards.js';

/**
 * @typedef {object} ProgressProps
 * @property {number} value            0–100.
 * @property {boolean} [indeterminate] Buffering state; ignores value.
 * @property {string} [label]          Accessible label.
 */

export class ProgressBar extends Component {
  /** @param {ProgressProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { value, indeterminate = false, label = 'Progress' } = this.props;
    const pct = clamp(Math.round(value ?? 0), 0, 100);
    const attrs = { role: 'progressbar', 'aria-label': label };
    if (!indeterminate) {
      attrs['aria-valuemin'] = '0';
      attrs['aria-valuemax'] = '100';
      attrs['aria-valuenow'] = String(pct);
    }
    const root = createElement('span', {
      className: `ui-progress${indeterminate ? ' ui-progress--indeterminate' : ''}`,
      attrs,
    });
    const fill = createElement('span', { className: 'ui-progress__fill' });
    if (!indeterminate) fill.style.width = `${pct}%`;
    root.append(fill);
    return root;
  }
}