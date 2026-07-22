/**
 * @file Focus management utilities: focusable discovery, a reusable focus trap,
 * and post-navigation focus handling. Consolidates logic previously inlined in
 * Modal (Phase 3) so there's one correct implementation.
 */

export const FOCUSABLE_SELECTOR = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])', 'audio[controls]', 'video[controls]',
  'iframe', '[contenteditable]:not([contenteditable="false"])',
].join(',');

/**
 * Visible, focusable elements within a root (skips hidden/zero-size).
 * @param {ParentNode} root @returns {HTMLElement[]}
 */
export function getFocusable(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    const he = /** @type {HTMLElement} */ (el);
    return he.offsetParent !== null || he.getClientRects().length > 0;
  });
}

/**
 * Trap Tab focus within a container until released. Returns a release function.
 * @param {HTMLElement} container
 * @returns {() => void}
 */
export function trapFocus(container) {
  /** @param {KeyboardEvent} e */
  const onKeydown = (e) => {
    if (e.key !== 'Tab') return;
    const nodes = getFocusable(container);
    if (nodes.length === 0) { e.preventDefault(); return; }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}

/**
 * Move focus to a newly-rendered page region and announce it. Sets a temporary
 * tabindex so the heading/region is programmatically focusable without becoming
 * a tab stop permanently.
 * @param {HTMLElement} region
 * @returns {void}
 */
export function focusRegion(region) {
  if (!region.hasAttribute('tabindex')) region.setAttribute('tabindex', '-1');
  region.focus({ preventScroll: true });
}