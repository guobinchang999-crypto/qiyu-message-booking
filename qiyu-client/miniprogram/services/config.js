"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiConfig = exports.apiMode = exports.apiConfigs = exports.AUTH_TOKEN_STORAGE_KEY = exports.API_MODE_STORAGE_KEY = void 0;
exports.API_MODE_STORAGE_KEY = 'qiyu-api-mode';
exports.AUTH_TOKEN_STORAGE_KEY = 'qiyu-auth-token';
exports.apiConfigs = {
    mock: { mode: 'mock', baseUrl: '', timeout: 8000 },
    dev: { mode: 'dev', baseUrl: 'http://localhost:8080/api/v1', timeout: 8000 },
    prod: { mode: 'prod', baseUrl: 'https://api.qiyu.example.com/api/v1', timeout: 8000 }
};
const isApiMode = (value) => value === 'mock' || value === 'dev' || value === 'prod';
const readStoredApiMode = () => {
    if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function')
        return 'mock';
    try {
        const storedMode = wx.getStorageSync(exports.API_MODE_STORAGE_KEY);
        return isApiMode(storedMode) ? storedMode : 'mock';
    }
    catch (error) {
        return 'mock';
    }
};
exports.apiMode = readStoredApiMode();
exports.apiConfig = exports.apiConfigs[exports.apiMode];
