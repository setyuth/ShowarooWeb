/**
 * @file Continue Watching page (#/continue). Grid of in-progress titles with
 * resume-on-click, per-item remove, and a clear-completed action. Standardized
 * empty state when nothing is in progress.
 */

import { Page } from '../Page.js';
import { MediaCard } from '../../components/Card/MediaCard.js';
import { createGrid } from '../../layout/Grid.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {object} CWPageDeps
 * @property {import('../../player/ContinueWatching.js').ContinueWatching} cw
 * @property {import('../../layout/Router.js').Router} router
 */

export class ContinueWatchingPage extends Page {
  /** @param {CWPageDeps} deps */
  constructor(deps) { super({}); this.deps = deps; }

  /** @returns {HTMLElement} */
  render() {
    const root = createElement('div', { className: 'library container' });
    root.append(createElement('h1', { className: 'library__title', text: 'Continue Watching' }));
    const entries = this.deps.cw.list();

    if (entries.length === 0) {
      root.append(this.#empty());
      return root;
    }

    const cards = entries.map((e) => {
      const wrap = createElement('div');
      new MediaCard({
        model: {
          ...e.media,
          progress: e.progress, progressKnown: e.progressKnown, inProgress: !e.progressKnown,
          onRemove: () => { this.deps.cw.remove(e.type, e.media.id); wrap.remove(); },
        },
        onOpen: () => this.#resume(e),
      }).mount(wrap);
      return wrap;
    });
    root.append(createGrid({ min: '160px', children: cards }));
    return root;
  }

  /** @param {import('../../state/shape.js').ContinueEntry} e */
  #resume(e) {
    const target = this.deps.cw.resume(e.type, e.media.id);
    this.deps.router.navigate(target ? target.path : `/watch/${e.type}/${e.media.id}`);
  }

  #empty() {
    const box = createElement('div', { className: 'library__empty' });
    box.append(createElement('p', { text: 'Nothing in progress yet.' }));
    const browse = createElement('button', { className: 'ui-btn ui-btn--primary', text: 'Browse titles', attrs: { type: 'button' } });
    this.on(browse, 'click', () => this.deps.router.navigate('/'));
    box.append(browse);
    return box;
  }
}