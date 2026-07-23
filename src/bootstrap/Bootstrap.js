/**
 * @file Ordered application startup sequence (composition root driver).
 *
 * Extends the original Phase-1 skeleton (validate-env -> core -> services ->
 * register-events -> mount -> ready) with the stages every later phase in the
 * roadmap already built modules for, but that were never actually wired up:
 * error/UX services, TMDB + repositories, app state, the player registry, SEO,
 * and finally building the AppShell + Router and registering every route.
 */

import { APP, EVENTS, env, hasTmdbCredentials } from '../config/index.js';
import { AppContainer, SERVICES } from '../core/AppContainer.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../core/Logger.js';
import { AppError } from '../core/Result.js';
import { localStore, sessionStore } from '../services/storage/index.js';
import { registerGlobalEvents } from './events.js';
import { renderFatalError } from './fatalError.js';

import { Announcer } from '../a11y/Announcer.js';
import { ToastManager } from '../components/Toast/ToastManager.js';
import { ErrorHandler } from '../errors/ErrorHandler.js';
import { renderWithBoundary } from '../errors/ErrorBoundary.js';
import { NetworkStatus } from '../errors/NetworkStatus.js';

import { TmdbService } from '../services/tmdb/index.js';
import { createRepositories } from '../repositories/index.js';
import { AppState } from '../state/index.js';
import { ProviderRegistry, OfficialTrailerProvider } from '../player/index.js';
import { ContinueWatching } from '../player/ContinueWatching.js';
import { WatchPage } from '../player/WatchPage.js';
import { HeadManager } from '../seo/HeadManager.js';

import { Router, AppShell } from '../layout/index.js';
import { HomePage } from '../pages/home/HomePage.js';
import { createMoviesPage } from '../pages/browse/MoviesPage.js';
import { createTvPage } from '../pages/browse/TvPage.js';
import { SearchPage } from '../search/SearchPage.js';
import { MovieDetailPage } from '../pages/detail/MovieDetailPage.js';
import { TvDetailPage } from '../pages/detail/TvDetailPage.js';
import { PersonDetailPage } from '../pages/detail/PersonDetailPage.js';
import {
  CollectionDetailPage, CompanyDetailPage, NetworkDetailPage,
} from '../pages/detail/CollectionDetailPage.js';
import { createFavoritesPage } from '../pages/library/FavoritesPage.js';
import { createWatchLaterPage } from '../pages/library/WatchLaterPage.js';
import { HistoryPage } from '../pages/library/HistoryPage.js';
import { ContinueWatchingPage } from '../pages/library/ContinueWatchingPage.js';

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
      { name: 'errors', fn: () => this.#initErrorHandling() },
      { name: 'tmdb', fn: () => this.#initTmdb() },
      { name: 'repositories', fn: () => this.#initRepositories() },
      { name: 'state', fn: () => this.#initState() },
      { name: 'player', fn: () => this.#initPlayer() },
      { name: 'seo', fn: () => this.#initSeo() },
      { name: 'register-events', fn: () => this.#registerEvents() },
      { name: 'mount', fn: () => this.#verifyMount() },
      { name: 'shell', fn: () => this.#initShell() },
      { name: 'routes', fn: () => this.#registerRoutes() },
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
        'No TMDB credentials configured. Set tmdbApiKey or tmdbAccessToken in the Blogger theme env.',
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

  #initErrorHandling() {
    const logger = /** @type {Logger} */ (this.#container.resolve(SERVICES.logger));
    const announcer = new Announcer();
    const toasts = new ToastManager();
    const errors = new ErrorHandler({ logger, toasts, announcer });
    new NetworkStatus({ bus: this.#container.resolve(SERVICES.bus), toasts, announcer });

    this.#container.register('announcer', announcer);
    this.#container.register('toasts', toasts);
    this.#container.register('errors', errors);
  }

  #initTmdb() {
    const tmdb = new TmdbService({ store: this.#container.resolve(SERVICES.localStore) });
    this.#container.register('tmdb', tmdb);
  }

  #initRepositories() {
    const tmdb = this.#container.resolve('tmdb');
    const repos = createRepositories(tmdb);
    this.#container.register('repos', repos);
  }

  #initState() {
    const state = new AppState({
      store: this.#container.resolve(SERVICES.localStore),
      bus: this.#container.resolve(SERVICES.bus),
    });
    this.#container.register('state', state);
  }

  #initPlayer() {
    const repos = this.#container.resolve('repos');
    // Lawful default only: the official-trailer provider. Operators register
    // additional LICENSED providers on this registry themselves.
    const registry = new ProviderRegistry().register(
      new OfficialTrailerProvider({ movie: repos.movie, tv: repos.tv }),
    );
    const cw = new ContinueWatching(this.#container.resolve('state'));
    this.#container.register('registry', registry);
    this.#container.register('cw', cw);
  }

  #initSeo() {
    const head = new HeadManager({ siteName: APP.name });
    this.#container.register('head', head);
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

  #initShell() {
    const bus = /** @type {EventBus} */ (this.#container.resolve(SERVICES.bus));
    const router = new Router(bus);
    const shell = new AppShell({
      onNavigate: (path) => router.navigate(path),
      onSearch: (query) => router.navigate(`/search?q=${encodeURIComponent(query)}`),
    });
    shell.mount(this.#container.resolve('mount'));

    this.#container.register('router', router);
    this.#container.register('shell', shell);
  }

  #registerRoutes() {
    /** @type {Router} */ const router = this.#container.resolve('router');
    /** @type {ReturnType<typeof createRepositories>} */ const repos = this.#container.resolve('repos');
    const state = this.#container.resolve('state');
    const errors = this.#container.resolve('errors');
    const registry = this.#container.resolve('registry');
    const cw = this.#container.resolve('cw');
    const head = this.#container.resolve('head');
    const outlet = this.#container.resolve('shell').outlet;

    /** @param {import('../pages/Page.js').Page} page @param {string} title */
    const mountPage = (page, title) => {
      const doRender = () => renderWithBoundary(
        () => page.render(),
        errors,
        () => mountPage(page, title),
      );

      const swap = () => {
        outlet.replaceChildren(doRender());
        head.apply({ title });
        window.scrollTo({ top: 0 });
        document.getElementById('main')?.focus();
      };

      // Prefer the native View Transitions API for a smooth cross-fade between
      // routes; fall back to the enter/exit classes from motion.css on browsers
      // that lack it. Both paths honor prefers-reduced-motion automatically
      // (native via the UA, fallback via the @media block in motion.css).
      if (document.startViewTransition) {
        document.startViewTransition(swap);
      } else {
        outlet.classList.add('route-fade-out');
        window.setTimeout(() => {
          outlet.classList.remove('route-fade-out');
          swap();
          outlet.classList.add('route-fade-in');
          window.setTimeout(() => outlet.classList.remove('route-fade-in'), 260);
        }, 90);
      }
    };

    router.on('/', () =>
      mountPage(new HomePage({ movie: repos.movie, tv: repos.tv, state, router }), ''));

    router.on('/movies', () =>
      mountPage(createMoviesPage({ movie: repos.movie, state, router }), 'Movies'));
    router.on('/tv', () =>
      mountPage(createTvPage({ tv: repos.tv, state, router }), 'TV Shows'));

    router.on('/search', ({ query }) =>
      mountPage(new SearchPage({ search: repos.search, state, router }, query.get('q') ?? ''), 'Search'));

    router.on('/movie/:id', ({ params }) =>
      mountPage(new MovieDetailPage({ movie: repos.movie, state, router }, params.id), 'Movie'));
    router.on('/tv/:id', ({ params }) =>
      mountPage(new TvDetailPage({ tv: repos.tv, state, router }, params.id), 'TV Show'));
    router.on('/person/:id', ({ params }) =>
      mountPage(new PersonDetailPage({ person: repos.person, state, router }, params.id), 'Person'));
    router.on('/collection/:id', ({ params }) =>
      mountPage(new CollectionDetailPage({ collection: repos.collection, state, router }, params.id), 'Collection'));
    router.on('/company/:id', ({ params }) =>
      mountPage(new CompanyDetailPage({ company: repos.company, state, router }, params.id), 'Studio'));
    router.on('/network/:id', ({ params }) =>
      mountPage(new NetworkDetailPage({ network: repos.network, state, router }, params.id), 'Network'));

    router.on('/watch/:type/:id', ({ params }) =>
      mountPage(
        new WatchPage(
          { registry, movie: repos.movie, tv: repos.tv, state },
          { type: /** @type {'movie'|'tv'} */ (params.type), id: params.id },
        ),
        'Watch',
      ));

    router.on('/favorites', () => mountPage(createFavoritesPage({ state, router }), 'Favorites'));
    router.on('/watch-later', () => mountPage(createWatchLaterPage({ state, router }), 'Watch Later'));
    router.on('/history', () => mountPage(new HistoryPage({ state, router }), 'History'));
    router.on('/continue', () => mountPage(new ContinueWatchingPage({ cw, router }), 'Continue Watching'));

    // Anything else unmatched falls back to home rather than a dead page.
    router.fallback(() => router.navigate('/'));

    this.#container.register('mountPage', mountPage);
  }

  #finish() {
    const logger = /** @type {Logger} */ (this.#container.resolve(SERVICES.logger));
    const bus = /** @type {EventBus} */ (this.#container.resolve(SERVICES.bus));
    /** @type {Router} */ (this.#container.resolve('router')).start();
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