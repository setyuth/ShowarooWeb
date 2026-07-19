/**
 * @file Result type for explicit success/failure without throwing.
 * @template T
 * @typedef {{ ok: true, value: T } | { ok: false, error: AppError }} Result
 */

export class AppError extends Error {
  /** @param {string} code @param {string} message @param {unknown} [cause] */
  constructor(code, message, cause) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

/** @template T @param {T} value @returns {Result<T>} */
export function ok(value) { return { ok: true, value }; }

/** @param {string} code @param {string} message @param {unknown} [cause] @returns {Result<never>} */
export function err(code, message, cause) {
  return { ok: false, error: new AppError(code, message, cause) };
}

/** @template T @param {() => T} fn @param {string} [code='UNEXPECTED'] @returns {Result<T>} */
export function attempt(fn, code = 'UNEXPECTED') {
  try { return ok(fn()); }
  catch (error) {
    return err(code, error instanceof Error ? error.message : String(error), error);
  }
}