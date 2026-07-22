/**
 * @file Pure mappers: TMDB payloads → app view models. No I/O, no side effects.
 * These are the ONLY place TMDB field names appear outside the service layer.
 */

import { formatYear, formatRating, formatRuntime } from '../utils/format.js';

/**
 * @typedef {import('../components/Card/MediaCard.js').MediaCardModel} MediaCardModel
 */

/**
 * Map a TMDB movie/TV list item to the card view model the UI expects.
 * Handles both movie (`title`,`release_date`) and TV (`name`,`first_air_date`).
 * @param {any} item
 * @param {import('../services/tmdb/ImageService.js').ImageService} images
 * @returns {MediaCardModel}
 */
export function toCardModel(item, images) {
  const isTv = 'name' in item && !('title' in item);
  return {
    id: item.id,
    mediaType: item.media_type ?? (isTv ? 'tv' : 'movie'),
    title: item.title ?? item.name ?? 'Untitled',
    posterUrl: images.url(item.poster_path, 'poster', 'w342'),
    year: formatYear(item.release_date ?? item.first_air_date),
    rating: formatRating(item.vote_average),
    genres: [], // Genre names are resolved on detail views; lists carry only IDs.
  };
}

/**
 * Map a paginated TMDB list response to a normalized page of card models.
 * @param {any} raw
 * @param {import('../services/tmdb/ImageService.js').ImageService} images
 * @returns {{ page: number, totalPages: number, totalResults: number, items: MediaCardModel[] }}
 */
export function toCardPage(raw, images) {
  return {
    page: raw.page ?? 1,
    totalPages: raw.total_pages ?? 1,
    totalResults: raw.total_results ?? (raw.results?.length ?? 0),
    items: (raw.results ?? []).map((r) => toCardModel(r, images)),
  };
}

/**
 * Map a full TMDB movie detail payload to the movie detail view model.
 * @param {any} raw
 * @param {import('../services/tmdb/ImageService.js').ImageService} images
 * @returns {object}
 */
export function toMovieDetail(raw, images) {
  return {
    id: raw.id,
    mediaType: 'movie',
    title: raw.title ?? 'Untitled',
    tagline: raw.tagline ?? '',
    overview: raw.overview ?? '',
    year: formatYear(raw.release_date),
    runtime: formatRuntime(raw.runtime),
    rating: formatRating(raw.vote_average),
    genres: (raw.genres ?? []).map((g) => g.name),
    posterUrl: images.url(raw.poster_path, 'poster', 'w500'),
    backdropUrl: images.url(raw.backdrop_path, 'backdrop', 'w1280'),
    backdropSrcset: images.srcset(raw.backdrop_path, 'backdrop'),
    logoUrl: images.url((raw.images?.logos ?? [])[0]?.file_path, 'logo', 'w300'),
    cast: (raw.credits?.cast ?? []).slice(0, 12).map((c) => toPersonCredit(c, images)),
    videos: (raw.videos?.results ?? []).filter((v) => v.site === 'YouTube'),
    recommendations: (raw.recommendations?.results ?? []).map((r) => toCardModel(r, images)),
  };
}

/**
 * Map a TMDB TV detail payload to the TV detail view model.
 * @param {any} raw
 * @param {import('../services/tmdb/ImageService.js').ImageService} images
 * @returns {object}
 */
export function toTvDetail(raw, images) {
  return {
    id: raw.id,
    mediaType: 'tv',
    title: raw.name ?? 'Untitled',
    tagline: raw.tagline ?? '',
    overview: raw.overview ?? '',
    year: formatYear(raw.first_air_date),
    rating: formatRating(raw.vote_average),
    genres: (raw.genres ?? []).map((g) => g.name),
    seasons: (raw.seasons ?? []).map((s) => ({
      id: s.id, number: s.season_number, name: s.name,
      episodeCount: s.episode_count, posterUrl: images.url(s.poster_path, 'poster', 'w342'),
    })),
    numberOfSeasons: raw.number_of_seasons ?? 0,
    posterUrl: images.url(raw.poster_path, 'poster', 'w500'),
    backdropUrl: images.url(raw.backdrop_path, 'backdrop', 'w1280'),
    backdropSrcset: images.srcset(raw.backdrop_path, 'backdrop'),
    cast: (raw.credits?.cast ?? []).slice(0, 12).map((c) => toPersonCredit(c, images)),
    videos: (raw.videos?.results ?? []).filter((v) => v.site === 'YouTube'),
    recommendations: (raw.recommendations?.results ?? []).map((r) => toCardModel(r, images)),
  };
}

/** @param {any} c @param {import('../services/tmdb/ImageService.js').ImageService} images */
export function toPersonCredit(c, images) {
  return {
    id: c.id, name: c.name, character: c.character ?? c.job ?? '',
    profileUrl: images.url(c.profile_path, 'profile', 'w185'),
  };
}

/** @param {any} raw @param {import('../services/tmdb/ImageService.js').ImageService} images */
export function toPersonDetail(raw, images) {
  return {
    id: raw.id, name: raw.name ?? 'Unknown',
    biography: raw.biography ?? '', knownFor: raw.known_for_department ?? '',
    birthday: raw.birthday ?? null, placeOfBirth: raw.place_of_birth ?? '',
    profileUrl: images.url(raw.profile_path, 'profile', 'h632'),
    credits: [
      ...(raw.combined_credits?.cast ?? []),
    ].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).map((r) => toCardModel(r, images)),
  };
}

/** @param {any} raw @param {import('../services/tmdb/ImageService.js').ImageService} images */
export function toCollectionDetail(raw, images) {
  return {
    id: raw.id, name: raw.name ?? 'Collection', overview: raw.overview ?? '',
    backdropUrl: images.url(raw.backdrop_path, 'backdrop', 'w1280'),
    parts: (raw.parts ?? []).map((r) => toCardModel(r, images)),
  };
}