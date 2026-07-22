/**
 * @file AppState facade. Wraps the Store with typed, intent-named action methods
 * so the rest of the app never crafts raw actions/updaters. Bridges commits to
 * the EventBus and applies capacity caps (history lists are bounded).
 */

import { Store } from './Store.js';
import { initialState, select } from './shape.js';
import { hydrate, persistenceMiddleware } from './persistence.js';

const HISTORY_LIMIT = 50;
const SEARCH_HISTORY_LIMIT = 10;

export class AppState {
  /** @type {Store<import('./shape.js').AppStateShape>} */ #store;
  /** @type {import('../core/EventBus.js').EventBus} */ #bus;

  /**
   * @param {object} deps
   * @param {import('../services/storage/StorageService.js').StorageService} deps.store
   * @param {import('../core/EventBus.js').EventBus} deps.bus
   */
  constructor({ store, bus }) {
    this.#bus = bus;
    this.#store = new Store(hydrate(store, initialState()));
    this.#store.use(persistenceMiddleware(store));
    // Bridge: mirror every action onto the event bus for decoupled listeners.
    this.#store.use((action) => bus.emit(`state:${action.type}`, action.payload));
  }

  /** Direct read + subscribe passthroughs. */
  get select() { return select; }
  getState() { return this.#store.getState(); }
  subscribe(selector, cb) { return this.#store.subscribe(selector, cb); }

  /** @param {import('./shape.js').MediaRef} media */
  toggleFavorite(media) {
    this.#store.commit({ type: 'favorite:toggle', payload: media }, (s) => {
      const exists = s.favorites.some((m) => m.id === media.id && m.mediaType === media.mediaType);
      return { favorites: exists
        ? s.favorites.filter((m) => !(m.id === media.id && m.mediaType === media.mediaType))
        : [media, ...s.favorites] };
    });
  }

  /** @param {import('./shape.js').MediaRef} media */
  toggleWatchLater(media) {
    this.#store.commit({ type: 'watchLater:toggle', payload: media }, (s) => {
      const exists = s.watchLater.some((m) => m.id === media.id && m.mediaType === media.mediaType);
      return { watchLater: exists
        ? s.watchLater.filter((m) => !(m.id === media.id && m.mediaType === media.mediaType))
        : [media, ...s.watchLater] };
    });
  }

  /** @param {import('./shape.js').MediaRef} media */
  recordView(media) {
    this.#store.commit({ type: 'history:view', payload: media }, (s) => {
      const deduped = s.recentlyViewed.filter((m) => !(m.id === media.id && m.mediaType === media.mediaType));
      return { recentlyViewed: [media, ...deduped].slice(0, HISTORY_LIMIT) };
    });
  }

  /** @param {string} query */
  recordSearch(query) {
    const q = query.trim();
    if (!q) return;
    this.#store.commit({ type: 'search:record', payload: q }, (s) => ({
      searchHistory: [q, ...s.searchHistory.filter((x) => x !== q)].slice(0, SEARCH_HISTORY_LIMIT),
    }));
  }

  /** @param {import('./shape.js').ContinueEntry} entry */
  updateProgress(entry) {
    const key = `${entry.media.mediaType}:${entry.media.id}`;
    this.#store.commit({ type: 'continue:update', payload: entry }, (s) => ({
      continueWatching: { ...s.continueWatching, [key]: { ...entry, updatedAt: Date.now() } },
    }));
  }

  /** @param {Partial<import('./shape.js').Preferences>} patch */
  setPreferences(patch) {
    this.#store.commit({ type: 'preferences:set', payload: patch }, (s) => ({
      preferences: { ...s.preferences, ...patch },
    }));
  }
}