/**
 * @file src/test/smoke.js — minimal ESM assertion harness. Import and call run()
 * in a browser/devtools ESM context. Not shipped to production; excluded from
 * the Blogger bundle. Zero dependencies.
 */

let passed = 0, failed = 0;
/** @param {string} name @param {boolean} cond */
function assert(name, cond) { cond ? passed++ : (failed++, console.error('FAIL:', name)); }

import { formatRuntime, formatYear, formatRating, truncate } from '../utils/format.js';
import { LruCache } from '../perf/LruCache.js';
import { describe } from '../errors/errorCatalog.js';
import { ScoringEngine } from '../player/ScoringEngine.js';

export function run() {
  // formatters
  assert('runtime 90 → 1h 30m', formatRuntime(90) === '1h 30m');
  assert('runtime 0 → empty', formatRuntime(0) === '');
  assert('year from ISO', formatYear('2021-06-01') === '2021');
  assert('rating rounds', formatRating(8.437) === '8.4');
  assert('truncate word-boundary', truncate('the quick brown fox', 9).length <= 10);
  // LRU eviction
  const lru = new LruCache(2);
  lru.set('a', 1); lru.set('b', 2); lru.get('a'); lru.set('c', 3);
  assert('LRU evicts b', !lru.has('b') && lru.has('a') && lru.has('c'));
  // error catalog fallback
  assert('unknown code → UNEXPECTED', describe('NOPE').title === describe('UNEXPECTED').title);
  assert('404 not retriable', describe('TMDB_HTTP_404').retriable === false);
  // scoring: ineligible scores 0
  const s = new ScoringEngine();
  assert('ineligible → 0', s.score({ stat: { online: true, success: 9, failure: 0, avgLatency: 100, avgStartup: 500 }, eligible: false, priorityRank: 0, priorityCount: 3, isPreferred: false }) === 0);
  console.info(`smoke: ${passed} passed, ${failed} failed`);
  return failed === 0;
}