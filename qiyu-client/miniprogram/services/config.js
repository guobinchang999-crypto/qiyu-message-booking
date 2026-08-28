"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setApiMode = exports.apiConfig = exports.apiMode = exports.apiConfigs = exports.DEFAULT_API_MODE = exports.AUTH_SESSION_STORAGE_KEY = exports.AUTH_TOKEN_STORAGE_KEY = exports.API_MODE_STORAGE_KEY = void 0;
exports.API_MODE_STORAGE_KEY = 'qiyu-api-mode';
exports.AUTH_TOKEN_STORAGE_KEY = 'qiyu-auth-token';
exports.AUTH_SESSION_STORAGE_KEY = 'qiyu-auth-session';
exports.DEFAULT_API_MODE = 'dev';
exports.apiConfigs = {
    mock: { mode: 'mock', baseUrl: '', timeout: 8000 },
    dev: { mode: 'dev', baseUrl: 'http://localhost:8080', timeout: 8000 },
    prod: { mode: 'prod', baseUrl: 'https://api.qiyu.example.com', timeout: 8000 }
};
const isApiMode = (value) => value === 'mock' || value === 'dev' || value === 'prod';
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
exports.apiConfig = exports.apiConfigs[exports.apiMode];
/**
 * Mock mode is intentionally opt-in. The caller must relaunch the Mini Program after changing
 * this setting because service selection happens while the application module is initialized.
 */
const setApiMode = (mode) => {
    if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
        throw new Error('当前运行环境不支持切换接口模式');
    }
    wx.setStorageSync(exports.API_MODE_STORAGE_KEY, mode);
};
exports.setApiMode = setApiMode;
