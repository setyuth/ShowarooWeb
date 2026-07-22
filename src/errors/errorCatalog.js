/**
 * @file Error taxonomy: maps stable codes to user-facing copy + recovery hints.
 * Codes come from services (TMDB_*, STORAGE_*, provider codes) and the app.
 * This is the ONLY place user-facing error wording lives.
 */

/**
 * @typedef {object} ErrorInfo
 * @property {string} title
 * @property {string} message      Friendly, non-technical.
 * @property {boolean} retriable
 * @property {string} [hint]       Optional recovery guidance.
 */

/** @type {Record<string, ErrorInfo>} */
const CATALOG = {
  TMDB_NETWORK: { title: 'Connection problem', message: 'We couldn’t reach the catalog. Check your connection and try again.', retriable: true },
  TMDB_TIMEOUT: { title: 'This is taking a while', message: 'The request timed out. Please try again.', retriable: true },
  TMDB_HTTP_401: { title: 'Service unavailable', message: 'The catalog is temporarily unavailable. Please try later.', retriable: false },
  TMDB_HTTP_404: { title: 'Not found', message: 'We couldn’t find what you were looking for.', retriable: false },
  TMDB_HTTP_429: { title: 'Slow down a moment', message: 'Too many requests right now. Please wait a few seconds and retry.', retriable: true },
  STORAGE_QUOTA_EXCEEDED: { title: 'Storage full', message: 'Your saved items are using all available space. Remove a few to save more.', retriable: false, hint: 'Try clearing some history or favorites.' },
  STORAGE_UNAVAILABLE: { title: 'Saving is off', message: 'Your browser is blocking local storage, so preferences won’t be saved this session.', retriable: false },
  NO_PROVIDER: { title: 'No server configured', message: 'No streaming provider is set up yet.', retriable: false },
  ALL_PROVIDERS_FAILED: { title: 'Playback unavailable', message: 'We couldn’t start playback on any server. Try another server.', retriable: true },
  NO_SOURCE: { title: 'Nothing to play', message: 'No playable source was found for this title.', retriable: false },
  UNEXPECTED: { title: 'Something went wrong', message: 'An unexpected error occurred. Please try again.', retriable: true },
};

/**
 * Resolve an error code to its info, falling back to UNEXPECTED.
 * @param {string} [code]
 * @returns {ErrorInfo}
 */
export function describe(code) {
  return CATALOG[code ?? ''] ?? CATALOG.UNEXPECTED;
}