// src/player/PublicDomainCatalog.js
//
// Hand-curated map of TMDB IDs -> verified public-domain Internet Archive
// items. This is intentionally NOT a live text-search against IA — title
// matching against a free-text index is how you end up serving the wrong
// cut, a fan re-upload, or a mislabeled non-PD item. Every entry here must
// be manually verified (public-domain status + correct IA identifier +
// correct file) before being added.
//
// How to add an entry:
//   1. Find the title on TMDB, copy its numeric id.
//   2. Find the corresponding item on archive.org, copy the identifier
//      (the slug in the URL: archive.org/details/<identifier>).
//   3. Open https://archive.org/metadata/<identifier> and confirm a
//      video file exists in `files` with format "512Kb MPEG4" / "h.264"
//      etc. Note its `name` (exact filename) for `file`.
//   4. Sanity-check the film is actually public domain in the US (lapsed
//      copyright, no renewal, etc.) — IA hosting something is not itself
//      proof of PD status.
//
// `file` is optional: if omitted, the provider uses IA's embed player
// (https://archive.org/embed/<identifier>) instead of a direct file URL,
// which is more robust to IA re-encoding/renaming files over time.

export const MOVIE_CATALOG = {
  // Night of the Living Dead (1968, dir. George A. Romero) — TMDB id 10331.
  // Public Domain Mark 1.0 on IA; published 1968 without a copyright
  // notice, lapsed under pre-1978 US copyright law.
  10331: {
    identifier: 'NightOfTheLivingDead1968-Restored',
    file: 'Notld1968Restoration-desktop.mp4',
  },
  // His Girl Friday (1940, dir. Howard Hawks) — Public Domain Mark 1.0 on IA;
  // Columbia Pictures let the copyright lapse without renewal.
  3085: {
    identifier: 'his-girl-friday-1940_202109',
    file: 'His Girl Friday (1940).ia.mp4',
  },
};

export const TV_CATALOG = {
  // TMDB tv id -> { [seasonNumber]: { [episodeNumber]: { identifier, file? } } }
};

export function lookupMovie(tmdbId) {
  return MOVIE_CATALOG[tmdbId] ?? null;
}

export function lookupEpisode(tmdbId, season, episode) {
  const entry = TV_CATALOG[tmdbId]?.[season]?.[episode];
  return entry ?? null;
}