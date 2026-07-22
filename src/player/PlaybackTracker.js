/**
 * @file Tracks a playback session and writes Continue Watching progress.
 *
 * - Native <video>: samples currentTime/duration on a throttled timeupdate and
 *   on pause/ended; computes exact percentage; marks completed at >=95%.
 * - iframe: cannot read timeline; records an engagement marker (progressKnown
 *   false) and keeps the entry fresh while the tab/session is active.
 *
 * Writes go through AppState.updateProgress (persisted via Phase 7 middleware).
 */

import { throttle } from '../utils/async.js';

const COMPLETE_AT = 0.95;
const SAMPLE_MS = 5000;
const MIN_MEANINGFUL_SEC = 15; // don't record a resume point for a quick bounce

export class PlaybackTracker {
  /** @type {import('../state/AppState.js').AppState} */ #state;
  /** @type {(() => void)[]} */ #disposers = [];

  /** @param {import('../state/AppState.js').AppState} state */
  constructor(state) { this.#state = state; }

  /**
   * Begin tracking a session.
   * @param {object} cfg
   * @param {HTMLIFrameElement|HTMLVideoElement} cfg.element
   * @param {import('../state/shape.js').MediaRef} cfg.media
   * @param {'movie'|'tv'} cfg.type
   * @param {number} [cfg.season]
   * @param {number} [cfg.episode]
   * @param {number} [cfg.resumeSec]  Seek here on start (native only).
   * @returns {void}
   */
  start({ element, media, type, season, episode, resumeSec = 0 }) {
    this.stop(); // one active session at a time
    const base = { media, type, season, episode };

    if (element instanceof HTMLVideoElement) {
      this.#trackNative(element, base, resumeSec);
    } else {
      this.#trackEmbed(base);
    }
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {any} base
   * @param {number} resumeSec
   */
  #trackNative(video, base, resumeSec) {
    // Resume: seek once metadata is ready.
    const seek = () => { if (resumeSec > 0 && resumeSec < video.duration) video.currentTime = resumeSec; };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });

    const write = () => {
      const { currentTime: pos, duration: dur } = video;
      if (!dur || pos < MIN_MEANINGFUL_SEC) return;
      const ratio = pos / dur;
      this.#state.updateProgress({
        ...base,
        progress: Math.round(ratio * 100),
        progressKnown: true,
        positionSec: Math.round(pos),
        durationSec: Math.round(dur),
        updatedAt: Date.now(),
        completed: ratio >= COMPLETE_AT,
      });
    };
    const sampled = throttle(write, SAMPLE_MS);
    this.#bind(video, 'timeupdate', sampled);
    this.#bind(video, 'pause', write);
    this.#bind(video, 'ended', () => {
      this.#state.updateProgress({ ...base, progress: 100, progressKnown: true, positionSec: Math.round(video.duration), durationSec: Math.round(video.duration), updatedAt: Date.now(), completed: true });
    });
  }

  /** @param {any} base */
  #trackEmbed(base) {
    // No readable timeline. Record an engagement marker so the title appears in
    // Continue Watching (resume = reopen), but DO NOT invent a percentage.
    this.#state.updateProgress({
      ...base, progress: 0, progressKnown: false, positionSec: 0, durationSec: 0, updatedAt: Date.now(),
    });
    // Keep it fresh on unload so ordering reflects the most recent watch.
    const refresh = () => this.#state.updateProgress({ ...base, progress: 0, progressKnown: false, positionSec: 0, durationSec: 0, updatedAt: Date.now() });
    this.#bind(window, 'pagehide', refresh);
  }

  /** @param {EventTarget} t @param {string} type @param {EventListener} fn */
  #bind(t, type, fn) { t.addEventListener(type, fn); this.#disposers.push(() => t.removeEventListener(type, fn)); }

  /** Stop the current session and detach listeners. @returns {void} */
  stop() { this.#disposers.splice(0).forEach((d) => d()); }
}