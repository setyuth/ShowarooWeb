/**
 * @file Central error handler. Normalizes any thrown value or AppError, logs it
 * (debug-gated), announces politely for screen readers, and shows a friendly,
 * non-blocking toast. Distinguishes expected/handled failures (which callers
 * render locally) from unexpected ones (global net).
 */

import { describe } from './errorCatalog.js';
import { AppError } from '../core/Result.js';
import { env } from '../config/index.js';

export class ErrorHandler {
  /** @type {import('../core/Logger.js').Logger} */ #logger;
  /** @type {import('../components/Toast/ToastManager.js').ToastManager} */ #toasts;
  /** @type {import('../a11y/Announcer.js').Announcer} */ #announcer;

  /**
   * @param {object} deps
   * @param {import('../core/Logger.js').Logger} deps.logger
   * @param {import('../components/Toast/ToastManager.js').ToastManager} deps.toasts
   * @param {import('../a11y/Announcer.js').Announcer} deps.announcer
   */
  constructor({ logger, toasts, announcer }) {
    this.#logger = logger.child('error'); this.#toasts = toasts; this.#announcer = announcer;
  }

  /**
   * Normalize an arbitrary value into an AppError with a stable code.
   * @param {unknown} error @returns {AppError}
   */
  normalize(error) {
    if (error instanceof AppError) return error;
    if (error instanceof Error) return new AppError('UNEXPECTED', error.message, error);
    return new AppError('UNEXPECTED', String(error));
  }

  /**
   * Handle an unexpected error: log + announce + toast. Use for global net and
   * for genuinely unexpected failures. Expected failures should be rendered
   * locally via Page.section / component error states instead.
   * @param {unknown} error
   * @param {{ context?: string, silent?: boolean }} [opts]
   * @returns {AppError}
   */
  handle(error, { context, silent = false } = {}) {
    const appError = this.normalize(error);
    const info = describe(appError.code);
    // Always log (verbose only in debug).
    if (env.debug) this.#logger.error(context ? `[${context}]` : '', appError.code, appError.message, appError.cause ?? '');
    else this.#logger.error(appError.code);
    if (!silent) {
      this.#toasts.show(env.debug ? `${info.message} (${appError.code})` : info.message, { type: 'error' });
      this.#announcer.announce(info.message, { assertive: true });
    }
    return appError;
  }

  /**
   * Friendly info for a code, for local error UIs (Page.section, player).
   * @param {string} [code] @returns {import('./errorCatalog.js').ErrorInfo}
   */
  describe(code) { return describe(code); }
}