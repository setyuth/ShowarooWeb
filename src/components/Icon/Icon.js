/**
 * @file Icon wrapper. Renders an inline SVG from a registered sprite path.
 * Icons are decorative by default (aria-hidden); pass `title` to expose a label.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} IconProps
 * @property {string} name           Registered icon name.
 * @property {'sm'|'md'|'lg'} [size]
 * @property {string} [title]        If set, icon is exposed to a11y tree with this label.
 */

export class Icon extends Component {
  /** @param {IconProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { name, size = 'md', title } = this.props;
    const wrap = createElement('span', {
      className: `ui-icon ui-icon--${size}`,
      attrs: title
        ? { role: 'img', 'aria-label': title }
        : { 'aria-hidden': 'true' },
      dataset: { icon: name },
    });
    return wrap;
  }
}