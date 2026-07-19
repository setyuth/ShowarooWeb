/**
 * @file Runtime environment configuration.
 *
 * Because Blogger has no build step and no server, environment values that vary
 * between deployments (or that should not live in the CDN-served source) are
 * injected inline by the Blogger theme as `window.__SHOWAROO_ENV__`.
 *
 * SECURITY NOTE: A TMDB API key used from the browser is inherently public.
 * With a no-backend architecture it cannot be hidden. Use a read-only TMDB key
 * and treat it as exposed.
 */

/** @typedef {'development' | 'production'} AppMode */

const raw = (typeof window !== 'undefined' && window.__SHOWAROO_ENV__) || {};

/** @param {unknown} value @returns {AppMode} */
function resolveMode(value) {
  return value === 'production' ? 'production' : 'development';
}

const mode = resolveMode(raw.mode);
const isProduction = mode === 'production';

export const env = Object.freeze({
  mode,
  isProduction,
  isDevelopment: !isProduction,
  debug: raw.debug === true || !isProduction,
  tmdbApiKey: typeof raw.tmdbApiKey === 'string' ? raw.tmdbApiKey : '',
  tmdbAccessToken: typeof raw.tmdbAccessToken === 'string' ? raw.tmdbAccessToken : '',
  cdnBaseUrl: typeof raw.cdnBaseUrl === 'string' ? raw.cdnBaseUrl : '',
});

/** @returns {boolean} */
export function hasTmdbCredentials() {
  return env.tmdbApiKey.length > 0 || env.tmdbAccessToken.length > 0;
}