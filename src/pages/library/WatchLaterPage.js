/**
 * @file Watch Later page (#/watch-later). Thin configuration over CollectionPage.
 * No new list/persistence logic: reuses the watchLater slice + toggle from
 * AppState (Phase 7) and the shared collection grid/empty/remove UI (Phase 14).
 */

import { CollectionPage } from './CollectionPage.js';

/**
 * @param {import('./CollectionPage.js').CollectionDeps} deps
 * @returns {CollectionPage}
 */
export function createWatchLaterPage(deps) {
  return new CollectionPage(deps, {
    title: 'Watch Later',
    selector: (s) => s.watchLater,
    onRemove: (media) => deps.state.toggleWatchLater(media), // toggle off = remove
    removeLabel: 'Remove from Watch Later',
    emptyText: 'Your Watch Later list is empty. Tap the bookmark on any title to save it for later.',
    emptyCtaLabel: 'Browse titles',
    emptyCtaPath: '/',
  });
}