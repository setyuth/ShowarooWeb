/** @file Application-level constants. No secrets, no environment-specific values. */

export const APP = Object.freeze({
  name: 'ShowAroo',
  version: '0.0.0',
  namespace: 'showaroo',
  storageSchemaVersion: 1,
  defaultLanguage: 'en-US',
  defaultTheme: 'dark',
});

export const CACHE_TTL = Object.freeze({
  short: 5 * 60 * 1000,
  medium: 30 * 60 * 1000,
  long: 6 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
});

export const EVENTS = Object.freeze({
  app: { ready: 'app:ready', error: 'app:error' },
  storage: { changed: 'storage:changed', quotaExceeded: 'storage:quota-exceeded' },
});