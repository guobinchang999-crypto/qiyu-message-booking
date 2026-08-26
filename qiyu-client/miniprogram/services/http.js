"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = void 0;
const config_1 = require("./config");
const buildUrl = (path, query) => {
    const url = `${config_1.apiConfig.baseUrl}${path}`;
    const entries = Object.entries(query || {}).filter(([, value]) => value);
    if (entries.length === 0)
        return url;
    const search = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
    return `${url}?${search}`;
};
const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
        const token = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function' ? wx.getStorageSync(config_1.AUTH_TOKEN_STORAGE_KEY) : '';
        wx.request({
            url: buildUrl(path, options.query),
            method: options.method || 'GET',
            data: options.data,
            timeout: config_1.apiConfig.timeout,
            header: token ? { Authorization: `Bearer ${token}` } : undefined,
            success: (response) => {
                const body = response.data;
                if (response.statusCode >= 200 && response.statusCode < 300 && body.code === 0) {
                    resolve(body.data);
                    return;
                }
                reject(new Error(body?.message || `请求失败 ${response.statusCode}`));
            },
            fail: reject
        });
    });
};
exports.request = request;
