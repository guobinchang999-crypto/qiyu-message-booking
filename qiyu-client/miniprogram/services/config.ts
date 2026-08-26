export type ApiMode = 'mock' | 'dev' | 'prod';

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  timeout: number;
}

export const API_MODE_STORAGE_KEY = 'qiyu-api-mode';
export const AUTH_TOKEN_STORAGE_KEY = 'qiyu-auth-token';

export const apiConfigs: Record<ApiMode, ApiConfig> = {
  mock: { mode: 'mock', baseUrl: '', timeout: 8000 },
  dev: { mode: 'dev', baseUrl: 'http://localhost:8080/api/v1', timeout: 8000 },
  prod: { mode: 'prod', baseUrl: 'https://api.qiyu.example.com/api/v1', timeout: 8000 }
};

const isApiMode = (value: unknown): value is ApiMode => value === 'mock' || value === 'dev' || value === 'prod';

const readStoredApiMode = (): ApiMode => {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return 'mock';
  try {
    const storedMode = wx.getStorageSync(API_MODE_STORAGE_KEY);
    return isApiMode(storedMode) ? storedMode : 'mock';
  } catch (error) {
    return 'mock';
  }
};

export const apiMode: ApiMode = readStoredApiMode();
export const apiConfig: ApiConfig = apiConfigs[apiMode];
