/**
 * @file Feature detection + light shims applied at boot. Detects capabilities
 * once, exposes booleans, and installs only the shims that are missing so modern
 * browsers pay nothing. No heavy polyfills; we degrade rather than emulate.
 */

/** @returns {{ intersectionObserver: boolean, viewTransitions: boolean, idleCallback: boolean, contentVisibility: boolean }} */
export function detectSupport() {
  return {
    intersectionObserver: 'IntersectionObserver' in window,
    viewTransitions: typeof (/** @type {any} */ (document).startViewTransition) === 'function',
    idleCallback: 'requestIdleCallback' in window,
    contentVisibility: CSS?.supports?.('content-visibility: auto') ?? false,
  };
}

/** Install minimal shims for absent APIs. Idempotent. @returns {void} */
export function installShims() {
  // requestIdleCallback shim (Safari): approximate with a macrotask.
  if (!('requestIdleCallback' in window)) {
    /** @type {any} */ (window).requestIdleCallback = (cb) =>
      setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 12 }), 1);
    /** @type {any} */ (window).cancelIdleCallback = (id) => clearTimeout(id);
  }
}