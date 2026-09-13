export type AdminApiMode = 'dev' | 'prod';

export const ADMIN_API_MODE_STORAGE_KEY = 'qiyu-admin-api-mode';
export const ADMIN_API_BASE_URL_STORAGE_KEY = 'qiyu-admin-api-base-url';
const configs: Record<AdminApiMode, { mode: AdminApiMode; baseUrl: string }> = {
  dev: { mode: 'dev', baseUrl: 'http://localhost:8080' },
  prod: { mode: 'prod', baseUrl: '' }
};
const isMode = (value: unknown): value is AdminApiMode => value === 'dev' || value === 'prod';
const storedMode = typeof localStorage === 'undefined' ? '' : localStorage.getItem(ADMIN_API_MODE_STORAGE_KEY);
const mode = isMode(storedMode) ? storedMode : 'dev';
const storedBaseUrl = typeof localStorage === 'undefined' ? '' : (localStorage.getItem(ADMIN_API_BASE_URL_STORAGE_KEY) || '').replace(/\/$/, '');
export const adminApiConfig = mode === 'prod' && storedBaseUrl ? { mode, baseUrl: storedBaseUrl } : configs[mode];
