/**
 * @file DOM write batching + fragment builders. Grids/rails build into a
 * DocumentFragment and attach once (one reflow instead of N), and visual state
 * writes are coalesced into a single rAF to avoid layout thrash.
 */

/**
 * Build many nodes and return a single fragment for one-shot insertion.
 * @template T
 * @param {T[]} items @param {(item: T, index: number) => Node} build
 * @returns {DocumentFragment}
 */
export function buildFragment(items, build) {
  const frag = document.createDocumentFragment();
  items.forEach((item, i) => frag.append(build(item, i)));
  return frag;
}

/**
 * Coalesce multiple DOM-write callbacks into the next animation frame. Repeated
 * calls in the same tick run together, once, in order.
 * @returns {(fn: () => void) => void}
 */
export function createWriteScheduler() {
  /** @type {Array<() => void>} */ let queue = [];
  let scheduled = false;
  const flush = () => {
    const batch = queue; queue = []; scheduled = false;
    for (const fn of batch) fn();
  };
  return (fn) => {
    queue.push(fn);
    if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
  };
}