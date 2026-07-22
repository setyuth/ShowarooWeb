/**
 * @file Monitors a single playback startup attempt (spec: Playback Monitoring).
 * Resolves 'started' on iframe/video load, 'timeout' after the configured
 * startup timeout, or 'error' on a frame/network error. One attempt = one
 * monitor; the orchestrator drives retries/failover based on the outcome.
 */

/**
 * @typedef {'started'|'timeout'|'error'} StartupOutcome
 */

export class PlaybackMonitor {
  /**
   * Watch a media element until it starts, errors, or times out.
   * @param {HTMLIFrameElement | HTMLVideoElement} el
   * @param {number} timeoutMs
   * @returns {Promise<{ outcome: StartupOutcome, elapsedMs: number }>}
   */
  static watch(el, timeoutMs) {
    const started = performance.now();
    return new Promise((resolve) => {
      let settled = false;
      const done = (/** @type {StartupOutcome} */ outcome) => {
        if (settled) return; settled = true;
        clearTimeout(timer);
        cleanup();
        resolve({ outcome, elapsedMs: Math.round(performance.now() - started) });
      };
      const onLoad = () => done('started');
      const onPlaying = () => done('started');
      const onError = () => done('error');
      const cleanup = () => {
        el.removeEventListener('load', onLoad);
        el.removeEventListener('playing', onPlaying);
        el.removeEventListener('error', onError);
      };
      // iframe fires 'load'; video fires 'playing'. Listen for both.
      el.addEventListener('load', onLoad, { once: true });
      el.addEventListener('playing', onPlaying, { once: true });
      el.addEventListener('error', onError, { once: true });
      const timer = setTimeout(() => done('timeout'), timeoutMs);
    });
  }
}