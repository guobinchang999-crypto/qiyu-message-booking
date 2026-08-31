import { adminRequest } from './http';
import type { AuditLogRecord, DataScopeOptions, DictionaryRecord, OrganizationRecord, SystemMenuRecord, SystemPage, SystemQuery, SystemRoleRecord, SystemUserRecord, UserDataScope } from '@/types/system';

type SavePayload<T> = Partial<T> & { id?: string };
const queryString = (query: SystemQuery): string => {
  const params = new URLSearchParams();
  if (query.keyword) params.set('keyword', query.keyword);
  params.set('page', String(query.page || 1));
  params.set('pageSize', String(query.pageSize || 20));
  return params.toString();
};
const remoteCrud = <T,>(path: string) => ({
  list: (query: SystemQuery) => adminRequest<SystemPage<T>>(`${path}?${queryString(query)}`),
  save: (payload: SavePayload<T>) => adminRequest<T>(payload.id ? `${path}/${payload.id}` : path, { method: payload.id ? 'PUT' : 'POST', data: payload }),
  remove: (id: string) => adminRequest<void>(`${path}/${id}`, { method: 'DELETE' })
});

const organizationsRemote = remoteCrud<OrganizationRecord>('/admin/system/organizations');
const usersRemote = remoteCrud<SystemUserRecord>('/admin/system/users');
const rolesRemote = remoteCrud<SystemRoleRecord>('/admin/system/roles');
const menusRemote = remoteCrud<SystemMenuRecord>('/admin/system/menus');
const dictionariesRemote = remoteCrud<DictionaryRecord>('/admin/system/dictionaries');
export const systemAdminApi = {
  organizations: organizationsRemote,
  users: {
    ...usersRemote,
    resetPassword: (id: string, newPassword: string) => adminRequest<void>(
      `/admin/system/users/${id}/password`,
      { method: 'POST', data: { newPassword } },
    ),
    getDataScope: (id: string) => adminRequest<UserDataScope>(`/admin/system/users/${id}/data-scope`),
    saveDataScope: (id: string, payload: Omit<UserDataScope, 'userId' | 'inherited'>) => adminRequest<UserDataScope>(
      `/admin/system/users/${id}/data-scope`,
      { method: 'PUT', data: payload },
    ),
    clearDataScope: (id: string) => adminRequest<UserDataScope>(
      `/admin/system/users/${id}/data-scope`,
      { method: 'DELETE' },
    ),
    dataScopeOptions: () => adminRequest<DataScopeOptions>('/admin/system/data-scope-options'),
  },
  roles: rolesRemote,
  menus: menusRemote,
  dictionaries: dictionariesRemote,
  auditLogs: {
    list: (query: SystemQuery) => adminRequest<SystemPage<AuditLogRecord>>(
      `/admin/system/audit-logs?${queryString(query)}`,
    ),
  },
};
