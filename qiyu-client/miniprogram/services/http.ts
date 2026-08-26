import { apiConfig, AUTH_TOKEN_STORAGE_KEY } from './config';

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

const buildUrl = (path: string, query?: Record<string, string | undefined>): string => {
  const url = `${apiConfig.baseUrl}${path}`;
  const entries = Object.entries(query || {}).filter(([, value]) => value);
  if (entries.length === 0) return url;
  const search = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
  return `${url}?${search}`;
};

type RequestData = string | WechatMiniprogram.IAnyObject | ArrayBuffer;

export const request = <T>(path: string, options: { method?: 'GET' | 'POST'; data?: RequestData; query?: Record<string, string | undefined> } = {}): Promise<T> => {
  return new Promise((resolve, reject) => {
    const token = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function' ? wx.getStorageSync(AUTH_TOKEN_STORAGE_KEY) : '';
    wx.request<ApiEnvelope<T>>({
      url: buildUrl(path, options.query),
      method: options.method || 'GET',
      data: options.data,
      timeout: apiConfig.timeout,
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
