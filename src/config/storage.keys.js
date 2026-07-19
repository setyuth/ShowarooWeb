/** @file Single source of truth for every storage key used by the app. */

export const STORAGE_KEYS = Object.freeze({
  favorites: 'favorites',
  watchLater: 'watch-later',
  continueWatching: 'continue-watching',
  viewingHistory: 'viewing-history',
  searchHistory: 'search-history',
  preferredProvider: 'preferred-provider',
  recentServers: 'recent-servers',
  providerAnalytics: 'provider-analytics',
  theme: 'theme',
  language: 'language',
  tmdbCache: 'cache:tmdb',
  configCache: 'cache:config',
  providerHealth: 'cache:provider-health',
});

export const SESSION_KEYS = Object.freeze({
  currentPlayback: 'session:current-playback',
  scrollPositions: 'session:scroll-positions',
});