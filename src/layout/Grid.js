/**
 * @file Responsive grid helper. Produces a CSS-grid container whose column count
 * adapts via `auto-fill` + `minmax`, so it needs no JS on resize. Used by rails
 * and section grids on the homepage and listing pages.
 */

import { createElement } from '../utils/dom.js';

/**
 * Create a responsive grid element.
 * @param {object} [options]
 * @param {string} [options.min='160px']  Minimum column width (maps to card size).
 * @param {string} [options.gap='var(--space-4)']
 * @param {(Node|string)[]} [options.children]
 * @returns {HTMLElement}
 */
export function createGrid({ min = '160px', gap = 'var(--space-4)', children = [] } = {}) {
  const grid = createElement('div', { className: 'l-grid', children });
  grid.style.setProperty('--grid-min', min);
  grid.style.setProperty('--grid-gap', gap);
  return grid;
}