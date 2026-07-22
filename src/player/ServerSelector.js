/**
 * @file Manual server selector (spec: Manual Server Selection). Radiogroup of
 * providers with full live stats. Built on Phase 3 patterns for keyboard/ARIA.
 */

import { Component } from '../components/Component.js';
import { createElement } from '../utils/dom.js';

/** @param {number|null} ts @returns {string} */
function ago(ts) {
  if (!ts) return 'never';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export class ServerSelector extends Component {
  /** @param {object} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const { registry, stats, activeId, preferredId, onSelect, onSetPreferred } = this.props;
    const root = createElement('details', { className: 'server-selector' });
    root.append(createElement('summary', { className: 'server-selector__summary', text: 'Server options' }));

    const list = createElement('div', { className: 'server-selector__list', attrs: { role: 'radiogroup', 'aria-label': 'Streaming server' } });
    for (const provider of registry.list()) {
      const s = stats.get(provider.id);
      const reliability = (s.success + s.failure) === 0 ? null : Math.round((s.success / (s.success + s.failure)) * 100);
      const isActive = provider.id === activeId;

      const row = createElement('div', { className: `server-selector__item${isActive ? ' is-active' : ''}` });
      const radio = createElement('button', {
        className: 'server-selector__radio',
        attrs: { type: 'button', role: 'radio', 'aria-checked': String(isActive) },
      });
      radio.append(createElement('span', { className: `server-selector__dot server-selector__dot--${s.online ? 'ok' : 'down'}`, attrs: { 'aria-hidden': 'true' } }));
      radio.append(createElement('span', { className: 'server-selector__name', text: provider.name }));
      radio.append(createElement('span', { className: 'server-selector__status', text: s.online ? 'Online' : 'Offline' }));
      radio.append(createElement('span', { className: 'server-selector__stat', text: s.avgLatency ? `${s.avgLatency}ms` : '—' }));
      radio.append(createElement('span', { className: 'server-selector__stat', text: reliability === null ? 'new' : `${reliability}%` }));
      radio.append(createElement('span', { className: 'server-selector__checked', text: `checked ${ago(s.lastCheckAt)}` }));
      if (isActive) radio.append(createElement('span', { className: 'server-selector__current', text: 'Current' }));
      this.on(radio, 'click', () => onSelect(provider.id));

      const pref = createElement('button', {
        className: `server-selector__pref${provider.id === preferredId ? ' is-preferred' : ''}`,
        attrs: { type: 'button', 'aria-pressed': String(provider.id === preferredId), 'aria-label': `Prefer ${provider.name}` },
        dataset: { icon: 'pin' },
      });
      this.on(pref, 'click', () => onSetPreferred(provider.id));

      row.append(radio, pref);
      list.append(row);
    }
    root.append(list);
    return root;
  }
}