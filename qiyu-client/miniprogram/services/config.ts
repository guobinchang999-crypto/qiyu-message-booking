import { deploymentConfig } from './deployment';

export type ApiMode = 'dev' | 'prod';

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
  timeout: number;
}

export const API_MODE_STORAGE_KEY = 'qiyu-api-mode';
export const API_BASE_URL_STORAGE_KEY = 'qiyu-api-base-url';
export const AUTH_TOKEN_STORAGE_KEY = 'qiyu-auth-token';
export const AUTH_SESSION_STORAGE_KEY = 'qiyu-auth-session';
export const DEFAULT_API_MODE: ApiMode = 'dev';

export const apiConfigs: Record<ApiMode, ApiConfig> = {
  dev: { mode: 'dev', baseUrl: 'http://localhost:8080', timeout: 8000 },
  prod: { mode: 'prod', baseUrl: '', timeout: 8000 }
};

const isApiMode = (value: unknown): value is ApiMode => value === 'dev' || value === 'prod';

const readStoredApiMode = (): ApiMode => {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return DEFAULT_API_MODE;
  try {
    const storedMode = wx.getStorageSync(API_MODE_STORAGE_KEY);
    return isApiMode(storedMode) ? storedMode : DEFAULT_API_MODE;
  } catch (error) {
    return DEFAULT_API_MODE;
  }
};

const hasDeploymentConfig = deploymentConfig.mode === 'prod' && /^https:\/\//.test(deploymentConfig.baseUrl);
export const apiMode: ApiMode = hasDeploymentConfig ? 'prod' : readStoredApiMode();
const storedBaseUrl = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function'
  ? String(wx.getStorageSync(API_BASE_URL_STORAGE_KEY) || '').replace(/\/$/, '') : '';
export const apiConfig: ApiConfig = hasDeploymentConfig
  ? { ...apiConfigs.prod, baseUrl: deploymentConfig.baseUrl.replace(/\/$/, '') }
  : (apiMode === 'prod' && storedBaseUrl ? { ...apiConfigs.prod, baseUrl: storedBaseUrl } : apiConfigs[apiMode]);

/**
 * Stores the selected real API environment. The caller must relaunch the Mini Program after
 * changing this setting because configuration is resolved during application initialization.
 */
export const setApiMode = (mode: ApiMode): void => {
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
    throw new Error('当前运行环境不支持切换接口模式');
  }
  wx.setStorageSync(API_MODE_STORAGE_KEY, mode);
};

/** Stores the HTTPS API origin supplied by the production deployment configuration. */
export const setApiBaseUrl = (baseUrl: string): void => {
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') throw new Error('当前运行环境不支持配置接口地址');
  if (!/^https:\/\//.test(baseUrl)) throw new Error('生产接口地址必须使用 HTTPS');
  wx.setStorageSync(API_BASE_URL_STORAGE_KEY, baseUrl.replace(/\/$/, ''));
};
