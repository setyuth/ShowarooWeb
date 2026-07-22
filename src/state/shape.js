/**
 * @file Initial application state shape + selectors. One typed place describing
 * every persisted user slice (master plan §16).
 */

/**
 * @typedef {object} MediaRef  Minimal snapshot to render a card without refetch.
 * @property {string|number} id
 * @property {'movie'|'tv'} mediaType
 * @property {string} title
 * @property {string|null} posterUrl
 * @property {string} [year]
 * @property {string} [rating]
 *
 * @typedef {object} ContinueEntry
 * @property {MediaRef} media
 * @property {number} progress     0–100
 * @property {number} updatedAt    epoch ms
 * @property {number} [season]
 * @property {number} [episode]
 *
 * @typedef {object} Preferences
 * @property {string} theme
 * @property {string} language
 *
 * @typedef {object} AppStateShape
 * @property {MediaRef[]} favorites
 * @property {MediaRef[]} watchLater
 * @property {MediaRef[]} recentlyViewed
 * @property {string[]} searchHistory
 * @property {Record<string, ContinueEntry>} continueWatching  Keyed by `${type}:${id}`.
 * @property {Preferences} preferences
 */

import { APP } from '../config/index.js';

/** @returns {AppStateShape} */
export function initialState() {
  return {
    favorites: [],
    watchLater: [],
    recentlyViewed: [],
    searchHistory: [],
    continueWatching: {},
    preferences: { theme: APP.defaultTheme, language: APP.defaultLanguage },
  };
}

/** Selectors — the only sanctioned way to read slices. */
export const select = Object.freeze({
  favorites: (s) => s.favorites,
  watchLater: (s) => s.watchLater,
  recentlyViewed: (s) => s.recentlyViewed,
  searchHistory: (s) => s.searchHistory,
  continueWatching: (s) => s.continueWatching,
  preferences: (s) => s.preferences,
  isFavorite: (id, type) => (s) => s.favorites.some((m) => m.id === id && m.mediaType === type),
  isWatchLater: (id, type) => (s) => s.watchLater.some((m) => m.id === id && m.mediaType === type),
});