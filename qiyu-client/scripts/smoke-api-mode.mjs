import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const configSource = readFileSync(join(rootDir, 'miniprogram/services/config.ts'), 'utf8');
const serviceSource = readFileSync(join(rootDir, 'miniprogram/services/booking-service.ts'), 'utf8');
const remoteServiceSource = readFileSync(join(rootDir, 'miniprogram/services/remote-service.ts'), 'utf8');
const readmeSource = readFileSync(join(rootDir, 'README.md'), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(configSource.includes("export type ApiMode = 'mock' | 'dev' | 'prod'"), 'api mode union should include mock/dev/prod');
assert(configSource.includes("export const API_MODE_STORAGE_KEY = 'qiyu-api-mode'"), 'api mode storage key should be centralized');
assert(configSource.includes("export const DEFAULT_API_MODE: ApiMode = 'dev'"), 'a fresh install must default to the non-Mock dev mode');
assert(configSource.includes('wx.getStorageSync(API_MODE_STORAGE_KEY)'), 'api mode should be resolved from Mini Program storage');
assert(configSource.includes('return isApiMode(storedMode) ? storedMode : DEFAULT_API_MODE'), 'invalid or missing mode should fall back to dev');
assert(configSource.includes('export const setApiMode'), 'Mock mode must remain an explicit configuration option');
assert(serviceSource.includes('apiConfig.mode === \'mock\' ? mockService : remoteService'), 'service selection should consume resolved api mode');
assert(!remoteServiceSource.includes("from './mock-service'"), 'remote service must not import Mock data');
assert(!remoteServiceSource.includes('withMockFallback'), 'remote service must not recover API failures with Mock data');
assert(!remoteServiceSource.includes('toRemoteId'), 'remote service must pass the selected resource IDs through unchanged');
assert(!/store-jingan|service-neck|therapist-anran|BK-202/.test(remoteServiceSource), 'remote service must not contain fixture identifiers');
assert(readmeSource.includes('qiyu-api-mode'), 'README should document runtime api mode switching');

console.log('API mode smoke passed.');
