/**
 * @file Motion helpers. `viewTransition` wraps a DOM-swap callback in the View
 * Transitions API when available (smooth crossfade), falling back to a
 * class-based fade, and to an instant swap under reduced-motion. `playEnter`
 * applies a one-shot enter animation and cleans up the class afterward.
 */

/** @returns {boolean} */
function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Run a DOM update with a smooth transition when possible.
 * @param {() => void} update  Performs the DOM swap (e.g. mount new page).
 * @param {HTMLElement} [fallbackRoot]  Element to fade when API is unavailable.
 * @returns {Promise<void>}
 */
export async function viewTransition(update, fallbackRoot) {
  if (prefersReducedMotion()) { update(); return; }

  // Preferred: native View Transitions (Chrome/Edge). Smooth, interruptible.
  const doc = /** @type {any} */ (document);
  if (typeof doc.startViewTransition === 'function') {
    await doc.startViewTransition(() => update()).finished.catch(() => {});
    return;
  }

  // Fallback: class-based fade out → swap → fade in.
  if (fallbackRoot) {
    fallbackRoot.classList.add('route-fade-out');
    await new Promise((r) => setTimeout(r, 120));
    update();
    fallbackRoot.classList.remove('route-fade-out');
    fallbackRoot.classList.add('route-fade-in');
    setTimeout(() => fallbackRoot.classList.remove('route-fade-in'), 200);
  } else {
    update();
  }
}

/**
 * Apply a one-shot enter animation, removing the class when it ends so the
 * element can re-animate later if re-mounted.
 * @param {HTMLElement} el
 * @param {'enter-fade'|'enter-rise'|'enter-scale'} [variant='enter-fade']
 * @returns {void}
 */
export function playEnter(el, variant = 'enter-fade') {
  if (prefersReducedMotion()) return;
  el.classList.add(variant);
  el.addEventListener('animationend', () => el.classList.remove(variant), { once: true });
}

/**
 * Apply staggered enter to a container's children via the --i custom property.
 * @param {HTMLElement} container @returns {void}
 */
export function playStagger(container) {
  if (prefersReducedMotion()) return;
  container.classList.add('stagger');
  Array.from(container.children).forEach((child, i) => {
    /** @type {HTMLElement} */ (child).style.setProperty('--i', String(i));
  });
}