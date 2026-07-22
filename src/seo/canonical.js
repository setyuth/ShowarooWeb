/**
 * @file Canonical URL builder. Uses the configured public site base so OG/
 * canonical URLs are absolute and consistent regardless of the current origin.
 */

import { env } from '../config/index.js';

/**
 * @param {string} path  App route, e.g. '/movie/123'.
 * @returns {string}
 */
export function canonicalFor(path) {
  const base = (env.siteBaseUrl || window.location.origin).replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}/#${clean}`;
}