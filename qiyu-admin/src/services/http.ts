import { adminApiConfig } from './config';

interface ApiEnvelope<T> { code: number; message: string; data: T; }

export const adminRequest = async <T>(path: string): Promise<T> => {
  const session = typeof localStorage === 'undefined' ? '' : localStorage.getItem('qiyu-admin-auth');
  const token = session ? (() => { try { return JSON.parse(session).token || ''; } catch (error) { return ''; } })() : '';
  const response = await fetch(`${adminApiConfig.baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  const body = await response.json() as ApiEnvelope<T>;
  if (!response.ok || body.code !== 0) throw new Error(body.message || `请求失败 ${response.status}`);
  return body.data;
};
