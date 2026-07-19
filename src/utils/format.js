/** @file Pure formatting helpers for display values. */

import { isFiniteNumber, isNonEmptyString } from './guards.js';

/** @param {number} minutes @returns {string} */
export function formatRuntime(minutes) {
  if (!isFiniteNumber(minutes) || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** @param {unknown} dateString @returns {string} */
export function formatYear(dateString) {
  if (!isNonEmptyString(dateString)) return '';
  const match = dateString.match(/^(\d{4})/);
  return match ? match[1] : '';
}

/** @param {number} vote @returns {string} */
export function formatRating(vote) {
  if (!isFiniteNumber(vote) || vote <= 0) return '';
  return (Math.round(vote * 10) / 10).toFixed(1);
}

/** @param {string} text @param {number} maxLength @returns {string} */
export function truncate(text, maxLength) {
  if (!isNonEmptyString(text) || text.length <= maxLength) return text ?? '';
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}