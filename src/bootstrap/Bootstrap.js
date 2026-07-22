/**
 * @file Ordered application startup sequence (composition root driver).
 */

import { APP, EVENTS, env, hasTmdbCredentials } from '../config/index.js';
import { AppContainer, SERVICES } from '../core/AppContainer.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../core/Logger.js';
import { AppError } from '../core/Result.js';
import { localStore, sessionStore } from '../services/storage/index.js';
import { registerGlobalEvents } from './events.js';
import { renderFatalError } from './fatalError.js';

export class Bootstrap {
  /** @type {AppContainer} */
  #container = new AppContainer();
  /** @type {Promise<AppContainer> | null} */
  #booting = null;

  /**
   * Boot the application. Safe to call multiple times; only the first runs.
   * @returns {Promise<AppContainer>}
   */
  boot() {
    if (this.#booting) return this.#booting;
    this.#booting = this.#run();
    return this.#booting;
  }

  /** @returns {Promise<AppContainer>} */
  async #run() {
    /** @type {Array<{ name: string, fn: () => void | Promise<void> }>} */
    const stages = [
      { name: 'validate-env', fn: () => this.#validateEnv() },
      { name: 'core', fn: () => this.#initCore() },
      { name: 'services', fn: () => this.#initServices() },
      { name: 'register-events', fn: () => this.#registerEvents() },
      { name: 'mount', fn: () => this.#verifyMount() },
      { name: 'ready', fn: () => this.#finish() },
    ];

    for (const stage of stages) {
      try {
        await stage.fn();
      } catch (error) {
        this.#onFatal(stage.name, error);
        throw error;
      }
    }
    return this.#container;
  }

  #validateEnv() {
    // env is validated + frozen on import; here we only surface actionable warnings.
    if (!hasTmdbCredentials()) {
      // Logger not yet built; defer this warning until after core init.
      this.#pendingWarnings.push(
        'No TMDB credentials configured. Set them in the Blogger theme env before Phase 5.',
      );
    }
  }

  /** @type {string[]} */
  #pendingWarnings = [];

  #initCore() {
    const logger = new Logger({ prefix: APP.name, level: env.debug ? 'debug' : 'warn' });
    const bus = new EventBus();
    bus.onError = (event, error) => logger.error(`event handler "${event}" threw`, error);

    this.#container.register(SERVICES.logger, logger);
    this.#container.register(SERVICES.bus, bus);

    logger.info(`${APP.name} booting (mode: ${env.mode}, schema v${APP.storageSchemaVersion})`);
    this.#pendingWarnings.forEach((w) => logger.warn(w));
    this.#pendingWarnings = [];
  }

  #initServices() {
    const logger = /** @type {Logger} */ (this.#container.resolve(SERVICES.logger));
    this.#container.register(SERVICES.localStore, localStore);
    this.#container.register(SERVICES.sessionStore, sessionStore);
    if (!localStore.isAvailable) {
      logger.warn('localStorage unavailable — user preferences will not persist this session.');
    }
  }

  #registerEvents() {
    registerGlobalEvents(this.#container);
  }

  #verifyMount() {
    const mount = document.getElementById('showaroo-app');
    if (!mount) {
      throw new AppError('MOUNT_MISSING', 'Mount node #showaroo-app not found in the DOM');
    }
    this.#container.register('mount', mount);
  }

  #finish() {
    const logger = /** @type {Logger} */ (this.#container.resolve(SERVICES.logger));
    const bus = /** @type {EventBus} */ (this.#container.resolve(SERVICES.bus));
    this.#container.seal();
    bus.emit(EVENTS.app.ready, { mode: env.mode });
    logger.info('foundation online');
  }

  /**
   * @param {string} stage
   * @param {unknown} error
   */
  #onFatal(stage, error) {
    const bus = this.#container.has(SERVICES.bus)
      ? /** @type {EventBus} */ (this.#container.resolve(SERVICES.bus))
      : null;
    if (this.#container.has(SERVICES.logger)) {
      /** @type {Logger} */ (this.#container.resolve(SERVICES.logger))
        .error(`boot failed at stage "${stage}"`, error);
    } else {
      console.error(`[ShowAroo] boot failed at stage "${stage}"`, error);
    }
    bus?.emit(EVENTS.app.error, { stage, error });
    renderFatalError(document.getElementById('showaroo-app'));
  }
}