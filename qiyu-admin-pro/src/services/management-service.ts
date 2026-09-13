import { adminRequest } from './http';

export interface ManagementPage<T> { list: T[]; total: number; pageNum: number; pageSize: number }
export type ManagementQuery = Record<string, string | number | boolean | undefined>;
export const queryString = (query: ManagementQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  return params.toString();
};
export const managementApi = {
  page: <T>(resource: string, query: ManagementQuery) => adminRequest<ManagementPage<T>>('/admin/management/' + resource + '?' + queryString(query)),
  stores: (resource: string) => adminRequest<Array<{ value: string; label: string }>>('/admin/management/store-options?resource=' + resource),
};
