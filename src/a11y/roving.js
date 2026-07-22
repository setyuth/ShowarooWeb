/**
 * @file Roving-tabindex helper for arrow-navigable widget groups (rails, the
 * server radiogroup, mobile nav). Formalizes the pattern Tabs implemented inline
 * so other groups reuse one tested implementation.
 */

/**
 * @param {HTMLElement} container
 * @param {string} itemSelector
 * @param {{ orientation?: 'horizontal'|'vertical'|'both' }} [opts]
 * @returns {() => void} cleanup
 */
export function rovingTabindex(container, itemSelector, { orientation = 'horizontal' } = {}) {
  const items = () => /** @type {HTMLElement[]} */ (Array.from(container.querySelectorAll(itemSelector)));
  const set = (list, i) => list.forEach((el, idx) => { el.tabIndex = idx === i ? 0 : -1; });
  const list0 = items();
  if (list0.length) set(list0, 0);

  /** @param {KeyboardEvent} e */
  const onKeydown = (e) => {
    const list = items();
    const i = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    if (i < 0) return;
    const horiz = orientation !== 'vertical';
    const vert = orientation !== 'horizontal';
    let next = null;
    if (horiz && e.key === 'ArrowRight') next = (i + 1) % list.length;
    else if (horiz && e.key === 'ArrowLeft') next = (i - 1 + list.length) % list.length;
    else if (vert && e.key === 'ArrowDown') next = (i + 1) % list.length;
    else if (vert && e.key === 'ArrowUp') next = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    if (next !== null) { e.preventDefault(); set(list, next); list[next].focus(); }
  };
  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}