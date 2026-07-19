/** @file Storage service barrel and pre-wired singletons. */

import { StorageService } from './StorageService.js';
import { APP } from '../../config/index.js';

export { StorageService };

export const localStore = new StorageService({
  backend: typeof localStorage !== 'undefined' ? localStorage : undefined,
  namespace: APP.namespace,
  schemaVersion: APP.storageSchemaVersion,
});

export const sessionStore = new StorageService({
  backend: typeof sessionStorage !== 'undefined' ? sessionStorage : undefined,
  namespace: APP.namespace,
  schemaVersion: APP.storageSchemaVersion,
});