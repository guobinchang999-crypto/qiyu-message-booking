export type AdminApiMode = 'dev' | 'prod';

export const ADMIN_API_MODE_STORAGE_KEY = 'qiyu-admin-api-mode';
export const ADMIN_API_BASE_URL_STORAGE_KEY = 'qiyu-admin-api-base-url';

declare global {
  interface Window {
    __QIYU_RUNTIME_CONFIG__?: { apiBaseUrl?: string };
  }
}

const configs: Record<AdminApiMode, { mode: AdminApiMode; baseUrl: string }> = {
  dev: { mode: 'dev', baseUrl: 'http://localhost:8080' },
  prod: { mode: 'prod', baseUrl: '' }
};
const isMode = (value: unknown): value is AdminApiMode => value === 'dev' || value === 'prod';
const deploymentBaseUrl = typeof window === 'undefined'
  ? '' : String(window.__QIYU_RUNTIME_CONFIG__?.apiBaseUrl || '').replace(/\/$/, '');
const storedMode = typeof localStorage === 'undefined' ? '' : localStorage.getItem(ADMIN_API_MODE_STORAGE_KEY);
const mode: AdminApiMode = deploymentBaseUrl ? 'prod' : (isMode(storedMode) ? storedMode : 'dev');
const storedBaseUrl = typeof localStorage === 'undefined' ? '' : (localStorage.getItem(ADMIN_API_BASE_URL_STORAGE_KEY) || '').replace(/\/$/, '');
export const adminApiConfig = deploymentBaseUrl
  ? { mode: 'prod' as const, baseUrl: deploymentBaseUrl }
  : (mode === 'prod' && storedBaseUrl ? { mode, baseUrl: storedBaseUrl } : configs[mode]);
