/**
 * @file TV browse-all page (#/tv). Thin configuration over BrowsePage: no new
 * loading/pagination/error logic, just the category list wired to
 * TvRepository's existing list endpoints.
 */

import { BrowsePage } from './BrowsePage.js';

/**
 * @param {object} deps
 * @param {import('../../repositories/index.js').TvRepository} deps.tv
 * @param {import('../../state/AppState.js').AppState} deps.state
 * @param {import('../../layout/Router.js').Router} deps.router
 * @returns {BrowsePage}
 */
export function createTvPage({ tv, state, router }) {
  return new BrowsePage({ state, router }, {
    title: 'TV Shows',
    categories: [
      { id: 'popular', label: 'Popular', load: (page) => tv.popular(page) },
      { id: 'top_rated', label: 'Top Rated', load: (page) => tv.topRated(page) },
      { id: 'on_the_air', label: 'On The Air', load: (page) => tv.onTheAir(page) },
      { id: 'airing_today', label: 'Airing Today', load: (page) => tv.airingToday(page) },
    ],
  });
}