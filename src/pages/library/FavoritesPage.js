/**
 * @file Favorites page (#/favorites). Thin configuration over CollectionPage.
 * All storage/toggle logic already lives in AppState (Phase 7); this wires the
 * favorites slice, the remove action, and the empty-state copy.
 */

import { CollectionPage } from './CollectionPage.js';

/**
 * @param {import('./CollectionPage.js').CollectionDeps} deps
 * @returns {CollectionPage}
 */
export function createFavoritesPage(deps) {
  return new CollectionPage(deps, {
    title: 'Favorites',
    selector: (s) => s.favorites,
    onRemove: (media) => deps.state.toggleFavorite(media), // toggle off = remove
    removeLabel: 'Remove from Favorites',
    emptyText: 'You have no favorites yet. Tap the heart on any title to save it here.',
    emptyCtaLabel: 'Browse titles',
    emptyCtaPath: '/',
  });
}