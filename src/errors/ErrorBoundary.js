/**
 * @file A render-time error boundary for page mounting. Wraps a page's render()
 * so a synchronous throw during construction/render shows a friendly recovery
 * screen instead of a blank outlet, with Retry when the error is retriable.
 * (Async failures are handled by Page.section; this covers the render path.)
 */

import { createElement } from '../utils/dom.js';

/**
 * @param {() => HTMLElement} renderPage
 * @param {import('./ErrorHandler.js').ErrorHandler} handler
 * @param {() => void} retry
 * @returns {HTMLElement}
 */
export function renderWithBoundary(renderPage, handler, retry) {
  try {
    return renderPage();
  } catch (error) {
    const appError = handler.handle(error, { context: 'page-render', silent: true });
    const info = handler.describe(appError.code);
    const box = createElement('div', { className: 'error-view container', attrs: { role: 'alert' } });
    box.append(createElement('h1', { className: 'error-view__title', text: info.title }));
    box.append(createElement('p', { className: 'error-view__msg', text: info.message }));
    if (info.hint) box.append(createElement('p', { className: 'error-view__hint', text: info.hint }));
    if (info.retriable) {
      const btn = createElement('button', { className: 'ui-btn ui-btn--primary', text: 'Try again', attrs: { type: 'button' } });
      btn.addEventListener('click', retry);
      box.append(btn);
    }
    return box;
  }
}