import { adminApiConfig } from './config';

interface ApiEnvelope<T> { code: number; message: string; data: T; }

export const adminRequest = async <T>(path: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; data?: unknown } = {}): Promise<T> => {
  if (!adminApiConfig.baseUrl) throw new Error('生产接口地址尚未配置');
  const session = typeof localStorage === 'undefined' ? '' : localStorage.getItem('qiyu-admin-auth');
  const token = session ? (() => { try { const parsed = JSON.parse(session); return parsed.accessToken || parsed.token || ''; } catch (error) { return ''; } })() : '';
  const response = await fetch(`${adminApiConfig.baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.data ? { 'Content-Type': 'application/json' } : {}) },
    body: options.data ? JSON.stringify(options.data) : undefined
  });
  const body = await response.json() as ApiEnvelope<T>;
  if (response.status === 401 || body.code === 401) {
    localStorage.removeItem('qiyu-admin-auth');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') window.location.assign('/login');
    throw new Error('登录状态已失效，请重新登录');
  }
  if (!response.ok || body.code !== 0) throw new Error(body.message || `请求失败 ${response.status}`);
  return body.data;
};
