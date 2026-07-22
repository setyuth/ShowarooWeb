/**
 * @file Badge component. Small status/label pill.
 * Tones: neutral | primary | success | warning | danger | info.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} BadgeProps
 * @property {string} label
 * @property {'neutral'|'primary'|'success'|'warning'|'danger'|'info'} [tone]
 * @property {HTMLElement} [icon]
 */

export class Badge extends Component {
  /** @param {BadgeProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { label, tone = 'neutral', icon } = this.props;
    const badge = createElement('span', { className: `ui-badge ui-badge--${tone}` });
    if (icon) { icon.setAttribute('aria-hidden', 'true'); badge.append(icon); }
    badge.append(createElement('span', { text: label }));
    return badge;
  }
}