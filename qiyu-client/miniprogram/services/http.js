"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.request = exports.clearLoginRedirectGuard = void 0;
const config_1 = require("./config");
// Guards against several in-flight requests each triggering their own login redirect.
let loginRedirected = false;
const clearLoginRedirectGuard = () => { loginRedirected = false; };
exports.clearLoginRedirectGuard = clearLoginRedirectGuard;
const redirectToLogin = () => {
    if (loginRedirected)
        return;
    loginRedirected = true;
    wx.removeStorageSync(config_1.AUTH_TOKEN_STORAGE_KEY);
    wx.removeStorageSync(config_1.AUTH_SESSION_STORAGE_KEY);
    wx.reLaunch({ url: '/pages/login/index', complete: () => { loginRedirected = false; } });
};
const NETWORK_ERROR_MESSAGE = '网络连接失败，请稍后重试';
const buildUrl = (path, query) => {
    if (!config_1.apiConfig.baseUrl)
        throw new Error('生产接口地址尚未配置');
    const url = `${config_1.apiConfig.baseUrl}${path}`;
    const entries = Object.entries(query || {}).filter(([, value]) => value);
    if (entries.length === 0)
        return url;
    const search = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
    return `${url}?${search}`;
};
const authHeader = () => {
    const token = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function' ? wx.getStorageSync(config_1.AUTH_TOKEN_STORAGE_KEY) : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
};
const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
        wx.request({
            url: buildUrl(path, options.query),
            method: options.method || 'GET',
            data: options.data,
            timeout: config_1.apiConfig.timeout,
            header: authHeader(),
            success: (response) => {
                const body = response.data;
                if (response.statusCode === 401 || body?.code === 401) {
                    redirectToLogin();
                    reject(new Error('登录状态已失效，请重新登录'));
                    return;
                }
                if (response.statusCode >= 200 && response.statusCode < 300 && body.code === 0) {
                    resolve(body.data);
                    return;
                }
                reject(new Error(body?.message || `请求失败 ${response.statusCode}`));
            },
            fail: () => reject(new Error(NETWORK_ERROR_MESSAGE))
        });
    });
};
exports.request = request;
const upload = (path, filePath, formData) => {
    return new Promise((resolve, reject) => {
        wx.uploadFile({
            url: buildUrl(path),
            filePath,
            name: 'file',
            formData,
            timeout: config_1.apiConfig.timeout,
            header: authHeader(),
            success: (response) => {
                try {
                    const body = JSON.parse(response.data);
                    if (response.statusCode === 401 || body.code === 401) {
                        redirectToLogin();
                        reject(new Error('登录状态已失效，请重新登录'));
                        return;
                    }
                    if (response.statusCode >= 200 && response.statusCode < 300 && body.code === 0) {
                        resolve(body.data);
                        return;
                    }
                    reject(new Error(body.message || `上传失败 ${response.statusCode}`));
                }
                catch (error) {
                    reject(new Error('上传响应格式异常'));
                }
            },
            fail: () => reject(new Error(NETWORK_ERROR_MESSAGE))
        });
    });
};
exports.upload = upload;
