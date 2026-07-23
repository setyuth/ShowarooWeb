/**
 * @file TMDB watch-provider IDs are stable across their whole catalog, but the
 * `/watch/providers` payload only gives an aggregate link back to TMDB's own
 * watch page — never a deep link to the title on the actual streaming service
 * (that's a JustWatch licensing limit on the free data, not something this
 * app controls). This maps the common provider IDs to the service's real
 * homepage, so a click lands on Netflix/Prime/etc. instead of always TMDB.
 * Unlisted providers fall back to the TMDB watch-page link.
 */

export const PROVIDER_HOMEPAGES = Object.freeze({
  8: 'https://www.netflix.com/',
  9: 'https://www.amazon.com/gp/video/storefront',
  119: 'https://www.primevideo.com/',
  337: 'https://www.disneyplus.com/',
  15: 'https://www.hulu.com/',
  2: 'https://tv.apple.com/',
  350: 'https://tv.apple.com/',
  384: 'https://www.max.com/',
  1899: 'https://www.max.com/',
  531: 'https://www.paramountplus.com/',
  386: 'https://www.peacocktv.com/',
  283: 'https://www.crunchyroll.com/',
  192: 'https://www.youtube.com/',
  188: 'https://www.youtube.com/',
  10: 'https://www.amazon.com/',
  68: 'https://www.microsoft.com/en-us/store/movies-and-tv',
  7: 'https://www.vudu.com/',
  1968: 'https://www.fandangoatgame.com/',
  1770: 'https://www.plex.tv/',
});

/**
 * @param {number} providerId
 * @returns {string|null}
 */
export function providerHomepage(providerId) {
  return PROVIDER_HOMEPAGES[providerId] ?? null;
}