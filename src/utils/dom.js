/**
 * @file Minimal, safe DOM helpers. createElement uses textContent, never innerHTML.
 */

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** @returns {() => void} */
export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/** @param {string} tag @param {object} [props] @returns {HTMLElement} */
export function createElement(tag, { className, text, attrs, dataset, children } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  if (attrs) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (dataset) for (const [k, v] of Object.entries(dataset)) el.dataset[k] = v;
  if (children) {
    for (const child of children) {
      el.append(typeof child === 'string' ? document.createTextNode(child) : child);
    }
  }
  return el;
}