/** @file TMDB configuration: base URLs and image size mappings. Static config only. */

export const TMDB = Object.freeze({
  apiBaseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
  defaultLanguage: 'en-US',
  defaultRegion: 'US',
});

export const TMDB_IMAGE_SIZES = Object.freeze({
  poster: Object.freeze(['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original']),
  backdrop: Object.freeze(['w300', 'w780', 'w1280', 'original']),
  profile: Object.freeze(['w45', 'w185', 'h632', 'original']),
  logo: Object.freeze(['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original']),
  still: Object.freeze(['w92', 'w185', 'w300', 'original']),
});