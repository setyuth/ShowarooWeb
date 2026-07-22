/**
 * @file Builds TMDB image URLs and responsive srcsets from stored size configs.
 * Isolated so components request semantic sizes ('poster', 'backdrop') without
 * knowing TMDB's size tokens (master plan §12 isolation).
 */

import { TMDB, TMDB_IMAGE_SIZES } from '../../config/index.js';
import { isNonEmptyString } from '../../utils/guards.js';

export class ImageService {
  /**
   * Build a single image URL.
   * @param {string | null | undefined} path  TMDB file path, e.g. '/abc.jpg'.
   * @param {keyof typeof TMDB_IMAGE_SIZES} kind
   * @param {string} [size]  Explicit TMDB size token; defaults to a sensible mid.
   * @returns {string | null}
   */
  url(path, kind, size) {
    if (!isNonEmptyString(path)) return null;
    const sizes = TMDB_IMAGE_SIZES[kind];
    const chosen = size && sizes.includes(size) ? size : sizes[Math.floor(sizes.length / 2)];
    return `${TMDB.imageBaseUrl}/${chosen}${path}`;
  }

  /**
   * Build a responsive srcset across all sizes for a kind (widths from tokens).
   * @param {string | null | undefined} path
   * @param {keyof typeof TMDB_IMAGE_SIZES} kind
   * @returns {string}  srcset string, or '' when no path.
   */
  srcset(path, kind) {
    if (!isNonEmptyString(path)) return '';
    return TMDB_IMAGE_SIZES[kind]
      .filter((s) => s.startsWith('w'))
      .map((s) => `${TMDB.imageBaseUrl}/${s}${path} ${s.slice(1)}w`)
      .join(', ');
  }
}