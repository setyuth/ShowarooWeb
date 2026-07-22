/**
 * @file Skeleton loader. DS §18 — feedback for async work, never a blank screen.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} SkeletonProps
 * @property {'text'|'rect'|'circle'|'poster'} [shape]
 * @property {string} [width]   CSS length. Default depends on shape.
 * @property {string} [height]  CSS length.
 * @property {number} [lines]   For shape='text', number of lines. Default 1.
 */

export class Skeleton extends Component {
  /** @param {SkeletonProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { shape = 'rect', width, height, lines = 1 } = this.props;
    const root = createElement('span', {
      className: 'ui-skeleton-group',
      attrs: { 'aria-hidden': 'true' },
    });
    const count = shape === 'text' ? Math.max(1, lines) : 1;
    for (let i = 0; i < count; i += 1) {
      const el = createElement('span', { className: `ui-skeleton ui-skeleton--${shape}` });
      if (width) el.style.width = width;
      if (height) el.style.height = height;
      root.append(el);
    }
    return root;
  }
}