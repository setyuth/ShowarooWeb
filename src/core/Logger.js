/**
 * @file Leveled, production-safe logger. In production only warn/error emit.
 */

/** @typedef {'debug'|'info'|'warn'|'error'|'silent'} LogLevel */
const LEVEL_WEIGHT = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

export class Logger {
  #prefix; #threshold;

  /** @param {{prefix?: string, level?: LogLevel}} [options] */
  constructor({ prefix = 'ShowAroo', level = 'debug' } = {}) {
    this.#prefix = prefix;
    this.#threshold = LEVEL_WEIGHT[level] ?? LEVEL_WEIGHT.debug;
  }

  /** @param {string} scope @returns {Logger} */
  child(scope) {
    const child = new Logger({ prefix: `${this.#prefix}:${scope}` });
    child.#threshold = this.#threshold;
    return child;
  }

  /** @param {LogLevel} level */
  setLevel(level) { this.#threshold = LEVEL_WEIGHT[level] ?? this.#threshold; }

  debug(...a) { if (this.#threshold <= LEVEL_WEIGHT.debug) console.debug(`[${this.#prefix}]`, ...a); }
  info(...a) { if (this.#threshold <= LEVEL_WEIGHT.info) console.info(`[${this.#prefix}]`, ...a); }
  warn(...a) { if (this.#threshold <= LEVEL_WEIGHT.warn) console.warn(`[${this.#prefix}]`, ...a); }
  error(...a) { if (this.#threshold <= LEVEL_WEIGHT.error) console.error(`[${this.#prefix}]`, ...a); }
}