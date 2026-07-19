/** @file Type guards and input validation helpers. */

export const isString = (v) => typeof v === 'string';
export const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
export const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
export const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isNonEmptyArray = (v) => Array.isArray(v) && v.length > 0;

/** @param {number} value @param {number} min @param {number} max @returns {number} */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);