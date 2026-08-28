export type AdminApiMode = 'mock' | 'dev' | 'prod';

export const ADMIN_API_MODE_STORAGE_KEY = 'qiyu-admin-api-mode';
const configs: Record<AdminApiMode, { mode: AdminApiMode; baseUrl: string }> = {
  mock: { mode: 'mock', baseUrl: '' },
  dev: { mode: 'dev', baseUrl: 'http://localhost:8080' },
  prod: { mode: 'prod', baseUrl: 'https://api.qiyu.example.com' }
};
const isMode = (value: unknown): value is AdminApiMode => value === 'mock' || value === 'dev' || value === 'prod';
const storedMode = typeof localStorage === 'undefined' ? '' : localStorage.getItem(ADMIN_API_MODE_STORAGE_KEY);
export const adminApiConfig = configs[isMode(storedMode) ? storedMode : 'dev'];
