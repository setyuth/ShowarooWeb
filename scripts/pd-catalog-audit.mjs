#!/usr/bin/env node
/**
 * scripts/pd-catalog-audit.mjs
 *
 * Automates the RESEARCH legwork for PublicDomainCatalog.js — does NOT
 * write to the catalog. Given a list of TMDB IDs, it:
 *   1. Fetches title/year from TMDB (needs TMDB_V4_TOKEN env var).
 *   2. Searches Internet Archive for candidate items.
 *   3. Fetches each candidate's metadata, keeps ones that (a) have an
 *      actual video file and (b) are tagged Public Domain licensing.
 *   4. Prints a ranked report for a human to glance at and pick from —
 *      it does not decide FOR you which upload is "the" correct one.
 *
 * Why this stops short of full automation: IA commonly has several
 * uploads of the same famous film (different cuts, re-encodes, fan
 * uploads occasionally mislabeled as PD). A script can check "does a
 * PD tag exist" and "does a video file exist" — it can't verify the
 * upload is actually the right cut, or that the uploader's PD claim is
 * correct. That last check needs a human. This script exists so that
 * check takes 10 seconds instead of 10 minutes.
 *
 * Usage:
 *   TMDB_V4_TOKEN=xxx node scripts/pd-catalog-audit.mjs 10331 3085
 *
 * Then, once you've picked a candidate, add it to PublicDomainCatalog.js
 * yourself (or ask Claude to, pasting the identifier + file you picked) —
 * that file stays hand-edited on purpose, see the comment at its top.
 */

const TMDB_TOKEN = process.env.TMDB_V4_TOKEN;
if (!TMDB_TOKEN) {
  console.error('Set TMDB_V4_TOKEN in the environment (your v4 read access token).');
  process.exit(1);
}

const ids = process.argv.slice(2).map(Number).filter(Boolean);
if (!ids.length) {
  console.error('Usage: TMDB_V4_TOKEN=xxx node scripts/pd-catalog-audit.mjs <tmdbId> [tmdbId...]');
  process.exit(1);
}

const PD_LICENSE_HINTS = ['publicdomain', 'public domain'];

async function tmdbDetail(id) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  });
  if (!res.ok) throw new Error(`TMDB ${id}: ${res.status}`);
  return res.json();
}

async function iaSearch(title, year) {
  const query = encodeURIComponent(`title:("${title}") AND mediatype:(movies)`);
  const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier&fl[]=title&fl[]=year&fl[]=licenseurl&fl[]=item_size&rows=10&output=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IA search "${title}": ${res.status}`);
  const data = await res.json();
  return data.response?.docs ?? [];
}

async function iaMetadata(identifier) {
  const res = await fetch(`https://archive.org/metadata/${identifier}`);
  if (!res.ok) return null;
  return res.json();
}

function looksLikePD(doc, metadata) {
  const licenseUrl = (doc.licenseurl || metadata?.metadata?.licenseurl || '').toLowerCase();
  return PD_LICENSE_HINTS.some((hint) => licenseUrl.includes(hint));
}

function findVideoFile(metadata) {
  const files = metadata?.files ?? [];
  // Prefer h.264 mp4/m4v over ogv/512kb previews, but report whatever exists.
  const ranked = files
    .filter((f) => /\.(mp4|m4v|ogv)$/i.test(f.name))
    .sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0));
  return ranked[0] ?? null;
}

async function auditOne(tmdbId) {
  const movie = await tmdbDetail(tmdbId);
  const title = movie.title;
  const year = (movie.release_date || '').slice(0, 4);

  console.log(`\n=== TMDB ${tmdbId}: "${title}" (${year}) ===`);

  const candidates = await iaSearch(title, year);
  if (!candidates.length) {
    console.log('  No IA candidates found for this title.');
    return;
  }

  let found = 0;
  for (const doc of candidates) {
    const metadata = await iaMetadata(doc.identifier);
    if (!metadata || metadata.is_dark) continue;

    const pd = looksLikePD(doc, metadata);
    const videoFile = findVideoFile(metadata);
    if (!pd || !videoFile) continue; // don't even report non-PD / no-video items

    found += 1;
    const sizeMB = (Number(videoFile.size) / 1_000_000).toFixed(0);
    console.log(`  [${found}] identifier: ${doc.identifier}`);
    console.log(`      file: ${videoFile.name} (${sizeMB}MB, ${videoFile.format || 'unknown format'})`);
    console.log(`      details page: https://archive.org/details/${doc.identifier}  <-- open this and eyeball it`);
  }

  if (!found) {
    console.log('  No candidates passed the PD-tag + video-file filter. Check manually.');
  } else {
    console.log(`  -> Pick ONE candidate above, open its details page, confirm it's really`);
    console.log(`     the right film/cut, then add to PublicDomainCatalog.js:`);
    console.log(`       ${tmdbId}: { identifier: '<chosen identifier>', file: '<chosen file>' },`);
  }
}

for (const id of ids) {
  try {
    await auditOne(id);
  } catch (error) {
    console.error(`  Error auditing ${id}: ${error.message}`);
  }
}
