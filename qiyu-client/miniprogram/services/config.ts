export type ApiMode = 'mock' | 'dev' | 'prod';

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  timeout: number;
}

export const API_MODE_STORAGE_KEY = 'qiyu-api-mode';
export const AUTH_TOKEN_STORAGE_KEY = 'qiyu-auth-token';
export const AUTH_SESSION_STORAGE_KEY = 'qiyu-auth-session';
export const DEFAULT_API_MODE: ApiMode = 'dev';

export const apiConfigs: Record<ApiMode, ApiConfig> = {
  mock: { mode: 'mock', baseUrl: '', timeout: 8000 },
  dev: { mode: 'dev', baseUrl: 'http://localhost:8080', timeout: 8000 },
  prod: { mode: 'prod', baseUrl: 'https://api.qiyu.example.com', timeout: 8000 }
};

const isApiMode = (value: unknown): value is ApiMode => value === 'mock' || value === 'dev' || value === 'prod';

const readStoredApiMode = (): ApiMode => {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return DEFAULT_API_MODE;
  try {
    const storedMode = wx.getStorageSync(API_MODE_STORAGE_KEY);
    return isApiMode(storedMode) ? storedMode : DEFAULT_API_MODE;
  } catch (error) {
    return DEFAULT_API_MODE;
  }
};

export const apiMode: ApiMode = readStoredApiMode();
export const apiConfig: ApiConfig = apiConfigs[apiMode];

/**
 * Mock mode is intentionally opt-in. The caller must relaunch the Mini Program after changing
 * this setting because service selection happens while the application module is initialized.
 */
export const setApiMode = (mode: ApiMode): void => {
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
    throw new Error('当前运行环境不支持切换接口模式');
  }
  wx.setStorageSync(API_MODE_STORAGE_KEY, mode);
};
