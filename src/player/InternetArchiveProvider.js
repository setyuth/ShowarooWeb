/**
 * @file Public-domain provider backed by Internet Archive. Registered
 * alongside OfficialTrailerProvider in Bootstrap.js#initPlayer(). Only
 * serves titles in PublicDomainCatalog.js — a hand-vetted TMDB-id ->
 * IA-identifier map, never a live title/text search against IA (too easy
 * to resolve to the wrong cut or a non-PD upload).
 */

import { StreamProvider } from './StreamProvider.js';
import { ok, err } from '../core/Result.js';
import { lookupMovie, lookupEpisode } from './PublicDomainCatalog.js';

const IA_METADATA_URL = (identifier) => `https://archive.org/metadata/${identifier}`;
const IA_DOWNLOAD_URL = (identifier, file) =>
  `https://archive.org/download/${identifier}/${encodeURIComponent(file)}`;
const IA_EMBED_URL = (identifier) => `https://archive.org/embed/${identifier}`;

export class InternetArchiveProvider extends StreamProvider {
  get id() { return 'internet-archive'; }
  get name() { return 'Public Domain (Internet Archive)'; }

  /**
   * @param {import('./StreamProvider.js').MediaRequest} request
   * @returns {Promise<import('../core/Result.js').Result<import('./StreamProvider.js').PlayableSource>>}
   */
  async resolve(request) {
    const entry = request.type === 'tv'
      ? lookupEpisode(request.id, request.season, request.episode)
      : lookupMovie(request.id);

    if (!entry) {
      return err('NO_SOURCE', 'No public-domain catalog entry for this title.');
    }

    let metadata;
    try {
      const res = await fetch(IA_METADATA_URL(entry.identifier));
      if (!res.ok) return err('IA_UNAVAILABLE', `Internet Archive lookup failed (${res.status}).`);
      metadata = await res.json();
    } catch (error) {
      return err('IA_UNAVAILABLE', 'Internet Archive lookup failed.', error);
    }

    if (!metadata || metadata.is_dark || !Array.isArray(metadata.files)) {
      return err('IA_UNAVAILABLE', 'Internet Archive item unavailable.');
    }

    if (entry.file) {
      const fileExists = metadata.files.some((f) => f.name === entry.file);
      if (fileExists) {
        return ok({
          kind: 'video',
          url: IA_DOWNLOAD_URL(entry.identifier, entry.file),
          title: metadata.metadata?.title,
        });
      }
      // Item's live but the cached filename moved — fall back to the embed
      // rather than fail outright.
    }

    return ok({
      kind: 'iframe',
      url: IA_EMBED_URL(entry.identifier),
      title: metadata.metadata?.title,
      sandbox: true,
    });
  }

  /** @returns {Promise<import('./StreamProvider.js').ProviderHealth>} */
  async health() {
    const start = performance.now();
    try {
      const res = await fetch('https://archive.org/metadata/', { method: 'HEAD' });
      return { ok: res.ok || res.status === 405, latencyMs: performance.now() - start };
    } catch {
      return { ok: false, latencyMs: performance.now() - start };
    }
  }
}