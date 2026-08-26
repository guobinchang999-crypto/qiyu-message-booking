import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const configSource = readFileSync(join(rootDir, 'miniprogram/services/config.ts'), 'utf8');
const serviceSource = readFileSync(join(rootDir, 'miniprogram/services/booking-service.ts'), 'utf8');
const readmeSource = readFileSync(join(rootDir, 'README.md'), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(configSource.includes("export type ApiMode = 'mock' | 'dev' | 'prod'"), 'api mode union should include mock/dev/prod');
assert(configSource.includes("export const API_MODE_STORAGE_KEY = 'qiyu-api-mode'"), 'api mode storage key should be centralized');
assert(configSource.includes('wx.getStorageSync(API_MODE_STORAGE_KEY)'), 'api mode should be resolved from Mini Program storage');
assert(configSource.includes("return isApiMode(storedMode) ? storedMode : 'mock'"), 'invalid or missing mode should fall back to mock');
assert(serviceSource.includes('apiConfig.mode === \'mock\' ? mockService : remoteService'), 'service selection should consume resolved api mode');
assert(readmeSource.includes('qiyu-api-mode'), 'README should document runtime api mode switching');

console.log('API mode smoke passed.');
