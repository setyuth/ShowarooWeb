/**
 * @file Domain model typedefs. These are the app's vocabulary; TMDB shapes never
 * escape the repository layer.
 *
 * @typedef {'movie'|'tv'|'person'} MediaKind
 *
 * @typedef {object} MediaSummary   Row/card-level model. Superset-compatible with
 *   the Phase 3 MediaCardModel.
 * @property {number} id
 * @property {MediaKind} kind
 * @property {string} title
 * @property {string|null} posterPath   Raw TMDB path (ImageService builds URLs).
 * @property {string|null} backdropPath
 * @property {string} year
 * @property {string} rating            Preformatted, e.g. '8.4'.
 * @property {string} overview
 *
 * @typedef {object} MediaDetail  Detail-page model; extends summary.
 * @property {MediaSummary} summary
 * @property {number} runtime            Minutes (movie) or episode avg (tv).
 * @property {string[]} genres
 * @property {string|null} tagline
 * @property {string[]} backdropUrlsHint
 */
export {};