/** @file Async and timing helpers: debounce, throttle, sleep, retry. */

/** @template {(...args:any[])=>void} F @param {F} fn @param {number} wait @returns {F & {cancel:()=>void}} */
export function debounce(fn, wait) {
  let timer;
  const debounced = function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/** @template {(...args:any[])=>void} F @param {F} fn @param {number} limit @returns {F} */
export function throttle(fn, limit) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn.apply(this, args); }
  };
}

/** @param {number} ms @returns {Promise<void>} */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @template T @param {() => Promise<T>} operation
 * @param {{retries?:number, baseDelay?:number, shouldRetry?:(e:unknown,a:number)=>boolean}} [options]
 * @returns {Promise<T>}
 */
export async function retry(operation, { retries = 3, baseDelay = 300, shouldRetry } = {}) {
  let attempt = 0;
  while (true) {
    try { return await operation(); }
    catch (error) {
      attempt += 1;
      const canRetry = attempt <= retries && (shouldRetry ? shouldRetry(error, attempt) : true);
      if (!canRetry) throw error;
      await sleep(baseDelay * 2 ** (attempt - 1));
    }
  }
}