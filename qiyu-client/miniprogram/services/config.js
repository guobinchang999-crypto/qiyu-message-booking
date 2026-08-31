"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setApiBaseUrl = exports.setApiMode = exports.apiConfig = exports.apiMode = exports.apiConfigs = exports.DEFAULT_API_MODE = exports.AUTH_SESSION_STORAGE_KEY = exports.AUTH_TOKEN_STORAGE_KEY = exports.API_BASE_URL_STORAGE_KEY = exports.API_MODE_STORAGE_KEY = void 0;
exports.API_MODE_STORAGE_KEY = 'qiyu-api-mode';
exports.API_BASE_URL_STORAGE_KEY = 'qiyu-api-base-url';
exports.AUTH_TOKEN_STORAGE_KEY = 'qiyu-auth-token';
exports.AUTH_SESSION_STORAGE_KEY = 'qiyu-auth-session';
exports.DEFAULT_API_MODE = 'dev';
exports.apiConfigs = {
    dev: { mode: 'dev', baseUrl: 'http://localhost:8080', timeout: 8000 },
    prod: { mode: 'prod', baseUrl: '', timeout: 8000 }
};
const isApiMode = (value) => value === 'dev' || value === 'prod';
const readStoredApiMode = () => {
    if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function')
        return exports.DEFAULT_API_MODE;
    try {
        const storedMode = wx.getStorageSync(exports.API_MODE_STORAGE_KEY);
        return isApiMode(storedMode) ? storedMode : exports.DEFAULT_API_MODE;
    }
    catch (error) {
        return exports.DEFAULT_API_MODE;
    }
};
exports.apiMode = readStoredApiMode();
const storedBaseUrl = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function'
    ? String(wx.getStorageSync(exports.API_BASE_URL_STORAGE_KEY) || '').replace(/\/$/, '') : '';
exports.apiConfig = exports.apiMode === 'prod' && storedBaseUrl
    ? { ...exports.apiConfigs.prod, baseUrl: storedBaseUrl } : exports.apiConfigs[exports.apiMode];
/**
 * Stores the selected real API environment. The caller must relaunch the Mini Program after
 * changing this setting because configuration is resolved during application initialization.
 */
const setApiMode = (mode) => {
    if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
        throw new Error('当前运行环境不支持切换接口模式');
    }
    wx.setStorageSync(exports.API_MODE_STORAGE_KEY, mode);
};
exports.setApiMode = setApiMode;
/** Stores the HTTPS API origin supplied by the production deployment configuration. */
const setApiBaseUrl = (baseUrl) => {
    if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function')
        throw new Error('当前运行环境不支持配置接口地址');
    if (!/^https:\/\//.test(baseUrl))
        throw new Error('生产接口地址必须使用 HTTPS');
    wx.setStorageSync(exports.API_BASE_URL_STORAGE_KEY, baseUrl.replace(/\/$/, ''));
};
exports.setApiBaseUrl = setApiBaseUrl;
