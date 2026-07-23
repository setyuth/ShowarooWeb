/**
 * @file Movies browse-all page (#/movies). Thin configuration over BrowsePage:
 * no new loading/pagination/error logic, just the category list wired to
 * MovieRepository's existing list endpoints.
 */

import { BrowsePage } from './BrowsePage.js';

/**
 * @param {object} deps
 * @param {import('../../repositories/index.js').MovieRepository} deps.movie
 * @param {import('../../state/AppState.js').AppState} deps.state
 * @param {import('../../layout/Router.js').Router} deps.router
 * @returns {BrowsePage}
 */
export function createMoviesPage({ movie, state, router }) {
  return new BrowsePage({ state, router }, {
    title: 'Movies',
    categories: [
      { id: 'popular', label: 'Popular', load: (page) => movie.popular(page) },
      { id: 'top_rated', label: 'Top Rated', load: (page) => movie.topRated(page) },
      { id: 'now_playing', label: 'Now Playing', load: (page) => movie.nowPlaying(page) },
      { id: 'upcoming', label: 'Upcoming', load: (page) => movie.upcoming(page) },
    ],
  });
}