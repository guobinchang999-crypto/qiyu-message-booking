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

const authHeader = (): Record<string, string> => {
  const token = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function' ? wx.getStorageSync(AUTH_TOKEN_STORAGE_KEY) : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const request = <T>(path: string, options: { method?: 'GET' | 'POST'; data?: RequestData; query?: Record<string, string | undefined> } = {}): Promise<T> => {
  return new Promise((resolve, reject) => {
    wx.request<ApiEnvelope<T>>({
      url: buildUrl(path, options.query),
      method: options.method || 'GET',
      data: options.data,
      timeout: apiConfig.timeout,
      header: authHeader(),
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
          if (response.statusCode >= 200 && response.statusCode < 300 && body.code === 0) {
            resolve(body.data);
            return;
          }
          reject(new Error(body.message || `上传失败 ${response.statusCode}`));
        } catch (error) {
          reject(new Error('上传响应格式异常'));
        }
      },
      fail: reject
    });
  });
};
