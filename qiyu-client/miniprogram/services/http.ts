import { apiConfig, AUTH_SESSION_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from './config';

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

// Guards against several in-flight requests each triggering their own login redirect.
let loginRedirected = false;

export const clearLoginRedirectGuard = (): void => { loginRedirected = false; };

const redirectToLogin = (): void => {
  if (loginRedirected) return;
  loginRedirected = true;
  wx.removeStorageSync(AUTH_TOKEN_STORAGE_KEY);
  wx.removeStorageSync(AUTH_SESSION_STORAGE_KEY);
  wx.reLaunch({ url: '/pages/login/index', complete: () => { loginRedirected = false; } });
};

const NETWORK_ERROR_MESSAGE = '网络连接失败，请稍后重试';

const buildUrl = (path: string, query?: Record<string, string | undefined>): string => {
  if (!apiConfig.baseUrl) throw new Error('生产接口地址尚未配置');
  const url = `${apiConfig.baseUrl}${path}`;
  const entries = Object.entries(query || {}).filter(([, value]) => value);
  if (entries.length === 0) return url;
  const search = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
  return `${url}?${search}`;
};

type RequestData = string | WechatMiniprogram.IAnyObject | ArrayBuffer;

const authHeader = (): Record<string, string> => {
  const token = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function' ? wx.getStorageSync(AUTH_TOKEN_STORAGE_KEY) : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const request = <T>(path: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; data?: RequestData; query?: Record<string, string | undefined> } = {}): Promise<T> => {
  return new Promise((resolve, reject) => {
    wx.request<ApiEnvelope<T>>({
      url: buildUrl(path, options.query),
      method: options.method || 'GET',
      data: options.data,
      timeout: apiConfig.timeout,
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

export const upload = <T>(path: string, filePath: string, formData: Record<string, string>): Promise<T> => {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: buildUrl(path),
      filePath,
      name: 'file',
      formData,
      timeout: apiConfig.timeout,
      header: authHeader(),
      success: (response) => {
        try {
          const body = JSON.parse(response.data) as ApiEnvelope<T>;
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
        } catch (error) {
          reject(new Error('上传响应格式异常'));
        }
      },
      fail: () => reject(new Error(NETWORK_ERROR_MESSAGE))
    });
  });
};
