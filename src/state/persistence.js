/**
 * @file Persistence: hydrate initial state from storage, and a middleware that
 * writes changed slices back. Slice→key mapping keeps writes targeted so we
 * only touch what changed (master plan §16: centralized keys).
 */

import { STORAGE_KEYS } from '../config/index.js';

/** Map each persisted slice to its storage key. */
const SLICE_KEYS = Object.freeze({
  favorites: STORAGE_KEYS.favorites,
  watchLater: STORAGE_KEYS.watchLater,
  recentlyViewed: STORAGE_KEYS.viewingHistory,
  searchHistory: STORAGE_KEYS.searchHistory,
  continueWatching: STORAGE_KEYS.continueWatching,
});

/**
 * Read persisted slices and merge over defaults.
 * @param {import('../services/storage/StorageService.js').StorageService} store
 * @param {import('./shape.js').AppStateShape} defaults
 * @returns {import('./shape.js').AppStateShape}
 */
export function hydrate(store, defaults) {
  const hydrated = { ...defaults };
  for (const [slice, key] of Object.entries(SLICE_KEYS)) {
    const saved = store.get(key, null);
    if (saved !== null) hydrated[slice] = saved;
  }
  hydrated.preferences = {
    theme: store.get(STORAGE_KEYS.theme, defaults.preferences.theme),
    language: store.get(STORAGE_KEYS.language, defaults.preferences.language),
  };
  return hydrated;
}

/**
 * Create persistence middleware. Writes only slices whose reference changed.
 * @param {import('../services/storage/StorageService.js').StorageService} store
 * @returns {(action: any, prev: any, next: any) => void}
 */
export function persistenceMiddleware(store) {
  return (_action, prev, next) => {
    for (const [slice, key] of Object.entries(SLICE_KEYS)) {
      if (prev[slice] !== next[slice]) store.set(key, next[slice]);
    }
    if (prev.preferences !== next.preferences) {
      store.set(STORAGE_KEYS.theme, next.preferences.theme);
      store.set(STORAGE_KEYS.language, next.preferences.language);
    }
  };
}