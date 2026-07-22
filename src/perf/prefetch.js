// src/perf/prefetch.js (essence)
export function idlePrefetch(tasks, { max = 4 } = {}) {
  const conn = /** @type {any} */ (navigator).connection;
  if (conn?.saveData || /2g/.test(conn?.effectiveType ?? '')) return () => {};
  let cancelled = false;
  const run = (deadline) => {
    while (!cancelled && tasks.length && max-- > 0 && (deadline?.timeRemaining?.() ?? 1) > 0) {
      tasks.shift()?.();
    }
  };
  const id = (window.requestIdleCallback ?? ((cb) => setTimeout(() => cb({ timeRemaining: () => 1 }), 200)))(run);
  return () => { cancelled = true; (window.cancelIdleCallback ?? clearTimeout)(id); };
}