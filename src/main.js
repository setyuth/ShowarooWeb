/**
 * @file Application entry point.
 *
 * Delegates all initialization to the staged Bootstrap. Waits for the DOM so
 * the mount-node check is reliable regardless of where the module tag sits in
 * the Blogger theme. Exposes a promise resolving to the sealed container.
 */

import { Bootstrap } from './bootstrap/Bootstrap.js';

/**
 * Resolve once the DOM is parsed. Module scripts are deferred by spec, but this
 * guards against the snippet being placed in <head> on some Blogger themes.
 * @returns {Promise<void>}
 */
function domReady() {
  if (document.readyState === 'loading') {
    return new Promise((resolve) =>
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }),
    );
  }
  return Promise.resolve();
}

/** Sealed application container, available to later-phase code and tests. */
export const app = domReady().then(() => new Bootstrap().boot());