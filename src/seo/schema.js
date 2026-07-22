/**
 * @file Pure JSON-LD builders (schema.org). Input is the app's mapped view
 * models (Phase 6), not TMDB payloads. Output is plain objects the HeadManager
 * serializes. No DOM, no I/O.
 */

/**
 * @param {any} movie @param {string} url @returns {object}
 */
export function movieSchema(movie, url) {
  return prune({
    '@context': 'https://schema.org', '@type': 'Movie',
    name: movie.title, description: movie.overview || undefined,
    image: movie.posterUrl || undefined, url,
    datePublished: movie.year || undefined,
    genre: movie.genres?.length ? movie.genres : undefined,
    aggregateRating: movie.rating ? { '@type': 'AggregateRating', ratingValue: movie.rating, bestRating: '10' } : undefined,
    actor: (movie.cast ?? []).slice(0, 8).map((c) => ({ '@type': 'Person', name: c.name })),
  });
}

/**
 * @param {any} tv @param {string} url @returns {object}
 */
export function tvSchema(tv, url) {
  return prune({
    '@context': 'https://schema.org', '@type': 'TVSeries',
    name: tv.title, description: tv.overview || undefined,
    image: tv.posterUrl || undefined, url,
    startDate: tv.year || undefined,
    numberOfSeasons: tv.numberOfSeasons || undefined,
    genre: tv.genres?.length ? tv.genres : undefined,
    aggregateRating: tv.rating ? { '@type': 'AggregateRating', ratingValue: tv.rating, bestRating: '10' } : undefined,
  });
}

/**
 * @param {any} person @param {string} url @returns {object}
 */
export function personSchema(person, url) {
  return prune({
    '@context': 'https://schema.org', '@type': 'Person',
    name: person.name, description: person.biography || undefined,
    image: person.profileUrl || undefined, url,
    birthDate: person.birthday || undefined,
    birthPlace: person.placeOfBirth || undefined,
  });
}

/**
 * Breadcrumb schema for any page's trail.
 * @param {{ name: string, url: string }[]} items @returns {object}
 */
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  };
}

/** Remove undefined/empty so JSON-LD stays clean. @param {object} obj @returns {object} */
function prune(obj) {
  return JSON.parse(JSON.stringify(obj, (_k, v) => {
    if (v === undefined || v === null) return undefined;
    if (Array.isArray(v) && v.length === 0) return undefined;
    return v;
  }));
}