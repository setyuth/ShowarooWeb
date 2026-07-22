/**
 * @file Global event registration.
 *
 * Wires window-level listeners and cross-cutting app events during boot. A full
 * global error handler with recovery strategies lands in Phase 23; this is the
 * minimal, honest baseline that reports and logs without swallowing bugs.
 */

import { EVENTS } from '../config/index.js';
import { SERVICES } from '../core/AppContainer.js';

/**
 * @param {import('../core/AppContainer.js').AppContainer} container
 * @returns {void}
 */
export function registerGlobalEvents(container) {
  const logger = container.resolve(SERVICES.logger);
  const bus = container.resolve(SERVICES.bus);

  // Surface uncaught errors and promise rejections through the app's channels.
  window.addEventListener('error', (event) => {
    logger.error('uncaught error', event.error ?? event.message);
    bus.emit(EVENTS.app.error, { source: 'window.error', error: event.error });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('unhandled promise rejection', event.reason);
    bus.emit(EVENTS.app.error, { source: 'unhandledrejection', error: event.reason });
  });

  // Keep app state coherent across tabs: react to storage changes from elsewhere.
  window.addEventListener('storage', () => {
    bus.emit(EVENTS.storage.changed, undefined);
  });
}