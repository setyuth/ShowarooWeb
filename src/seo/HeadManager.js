/**
 * @file Single owner of all SEO-related <head> tags. Pages describe their SEO
 * intent via a plain metadata object; the manager reconciles the DOM head
 * (create/update/remove) idempotently. Prevents duplicate/stale tags across
 * client-side navigations.
 */

/**
 * @typedef {object} SeoMeta
 * @property {string} title                Page title (before the site suffix).
 * @property {string} [description]
 * @property {string} [image]              Absolute URL for OG/Twitter.
 * @property {string} [canonical]          Absolute canonical URL.
 * @property {'website'|'video.movie'|'video.tv_show'|'profile'} [ogType]
 * @property {object|object[]} [jsonLd]     Structured data object(s).
 */

export class HeadManager {
  /** @type {string} */ #siteName;
  /** @type {string} */ #defaultImage;

  /** @param {{ siteName: string, defaultImage?: string }} cfg */
  constructor({ siteName, defaultImage = '' }) {
    this.#siteName = siteName;
    this.#defaultImage = defaultImage;
  }

  /**
   * Apply metadata for the current view. Missing fields fall back to sensible
   * site defaults; previously-set managed tags are cleaned up.
   * @param {SeoMeta} meta
   * @returns {void}
   */
  apply(meta) {
    const title = meta.title ? `${meta.title} – ${this.#siteName}` : this.#siteName;
    document.title = title;

    const desc = meta.description ?? '';
    const image = meta.image || this.#defaultImage;
    const canonical = meta.canonical || this.#currentUrl();

    this.#meta('name', 'description', desc);

    // Open Graph.
    this.#meta('property', 'og:title', title);
    this.#meta('property', 'og:description', desc);
    this.#meta('property', 'og:type', meta.ogType ?? 'website');
    this.#meta('property', 'og:site_name', this.#siteName);
    this.#meta('property', 'og:url', canonical);
    this.#meta('property', 'og:image', image);

    // Twitter.
    this.#meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    this.#meta('name', 'twitter:title', title);
    this.#meta('name', 'twitter:description', desc);
    this.#meta('name', 'twitter:image', image);

    this.#canonical(canonical);
    this.#jsonLd(meta.jsonLd ?? null);
  }

  /** @param {'name'|'property'} attr @param {string} key @param {string} value */
  #meta(attr, key, value) {
    const selector = `meta[${attr}="${key}"][data-seo]`;
    let el = document.head.querySelector(selector);
    if (!value) { el?.remove(); return; }
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      el.setAttribute('data-seo', '');
      document.head.append(el);
    }
    el.setAttribute('content', value);
  }

  /** @param {string} href */
  #canonical(href) {
    let link = document.head.querySelector('link[rel="canonical"][data-seo]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('data-seo', '');
      document.head.append(link);
    }
    link.setAttribute('href', href);
  }

  /** @param {object|object[]|null} data */
  #jsonLd(data) {
    document.head.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((s) => s.remove());
    if (!data) return;
    const blocks = Array.isArray(data) ? data : [data];
    for (const block of blocks) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', '');
      script.textContent = JSON.stringify(block);
      document.head.append(script);
    }
  }

  /** @returns {string} */
  #currentUrl() { return window.location.href; }
}