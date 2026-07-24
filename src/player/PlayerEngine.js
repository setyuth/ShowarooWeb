/**
 * @file Player UI engine driven by the StreamingOrchestrator. Renders a status
 * band (Finding the best server / Connecting / Switching / Restored), the stage,
 * a current-server badge, the manual server selector, and a friendly error with
 * manual selection on total failure. Mounting is passed to the orchestrator so
 * it controls retry/failover; the engine only paints.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';
import { env } from '../config/index.js';
import { ServerSelector } from './ServerSelector.js';

/**
 * @typedef {object} PlayerProps
 * @property {import('./StreamingOrchestrator.js').StreamingOrchestrator} orchestrator
 * @property {import('./ProviderRegistry.js').ProviderRegistry} registry
 * @property {import('./ProviderStats.js').ProviderStats} stats
 * @property {import('./StreamProvider.js').MediaRequest} request
 * @property {string} title
 * @property {(id: string) => void} onSetPreferred
 * @property {string} [preferredId]
 */

export class PlayerEngine extends Component {
  /** @type {HTMLElement|null} */ #stage = null;
  /** @type {HTMLElement|null} */ #statusBand = null;
  /** @type {HTMLElement|null} */ #badge = null;
  /** @type {HTMLElement|null} */ #selectorSlot = null;
  /** @type {string} */ #activeId = '';

  /** @param {PlayerProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'player' });
    this.#statusBand = createElement('div', { className: 'player__status', attrs: { role: 'status', 'aria-live': 'polite' } });
    this.#stage = createElement('div', { className: 'player__stage', attrs: { role: 'region', 'aria-label': `Player: ${this.props.title}` } });
    this.#badge = createElement('div', { className: 'player__badge' });
    this.#selectorSlot = createElement('div', { className: 'player__selector' });
    root.append(this.#statusBand, this.#stage, this.#badge, this.#selectorSlot);
    this.#start();
    this.#renderSelector();
    return root;
  }

  /** @param {string} [forceId] */
  async #start(forceId) {
    this.#clearStage();
    const result = await this.props.orchestrator.play(
      this.props.request,
      (source) => this.#mountSource(source),
      { forceId, onStatus: (s) => this.#status(s) },
    );
    if (!result.ok) { this.#showError(result.error.message); return; }
    this.#activeId = result.value.providerId;
    this.#updateBadge(result.value.providerId);
    this.#renderSelector();
  }

  /**
   * Mounts a source into the stage and returns the element for the monitor.
   * @param {import('./StreamProvider.js').PlayableSource} source
   * @returns {HTMLIFrameElement | HTMLVideoElement}
   */
  #mountSource(source) {
    const el = source.kind === 'iframe'
      ? /** @type {HTMLIFrameElement} */ (createElement('iframe', {
          className: 'player__frame',
          attrs: {
            src: source.url, title: source.title ?? this.props.title,
            allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
            allowfullscreen: 'true', loading: 'lazy',
            referrerpolicy: 'strict-origin-when-cross-origin',
            sandbox: 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox',
          },
        }))
      : /** @type {HTMLVideoElement} */ (createElement('video', {
          className: 'player__video', attrs: { src: source.url, controls: 'true', autoplay: 'true', playsinline: 'true' },
        }));
    this.#stage?.replaceChildren(el);
    return el;
  }

  /** @param {import('./StreamingOrchestrator.js').OrchestratorStatus} s */
  #status(s) {
    if (!this.#statusBand) return;
    // Seamless, non-technical copy; details only in debug mode.
    const text = env.debug && s.providerId ? `${s.message} (${s.providerId})` : s.message;
    this.#statusBand.textContent = s.phase === 'restored' || s.phase === 'connecting' && this.#activeId ? text : text;
    this.#statusBand.dataset.phase = s.phase;
    if (s.phase === 'restored') setTimeout(() => { if (this.#statusBand) this.#statusBand.textContent = ''; }, 2500);
  }

  /** @param {string} id */
  #updateBadge(id) {
    const provider = this.props.registry.get(id);
    if (!this.#badge || !provider) return;
    this.#badge.replaceChildren(
      createElement('span', { className: 'player__badge-dot', attrs: { 'aria-hidden': 'true' } }),
      createElement('span', { text: provider.name }),
    );
  }

  #renderSelector() {
    if (!this.#selectorSlot) return;
    const selector = new ServerSelector({
      registry: this.props.registry, stats: this.props.stats,
      activeId: this.#activeId, preferredId: this.props.preferredId,
      onSelect: (id) => this.#start(id),            // reload ONLY the player
      onSetPreferred: (id) => this.props.onSetPreferred(id),
    });
    this.#selectorSlot.replaceChildren(selector.render());
  }

  #clearStage() { this.#stage?.replaceChildren(); }

  /** @param {string} message */
  #showError(message) {
    if (!this.#stage) return;
    const box = createElement('div', { className: 'player__error', attrs: { role: 'alert' } });
    box.append(createElement('p', { className: 'player__error-msg', text: message }));
    const retry = createElement('button', { className: 'ui-btn ui-btn--primary', text: 'Try again', attrs: { type: 'button' } });
    this.on(retry, 'click', () => this.#start());
    box.append(retry);
    this.#stage.replaceChildren(box);
    // Manual selection stays available beneath the error (spec).
    this.#renderSelector();
  }
}