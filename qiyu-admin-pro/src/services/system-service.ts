import { adminRequest } from './http';
import type { AuditLogRecord, DataScopeOptions, DictionaryRecord, OrganizationRecord, PermissionOption, SystemMenuRecord, SystemPage, SystemQuery, SystemRoleRecord, SystemUserRecord, UserDataScope, UserPermissionCommand, UserPermissionGrant } from '@/types/system';

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
  navigation: () => adminRequest<SystemMenuRecord[]>('/admin/system/navigation'),
  organizations: {
    ...organizationsRemote,
    tree: () => adminRequest<OrganizationRecord[]>('/admin/system/organizations/tree'),
    impact: (id:string) => adminRequest<{userCount:number}>(`/admin/system/organizations/${id}/impact`),
    members: (id:string, descendants:boolean, page:number) => adminRequest<SystemPage<{id:string;username:string;displayName:string;departmentName:string;status:string}>>(`/admin/system/organizations/${id}/members?descendants=${descendants}&page=${page}&pageSize=20`),
  },
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
    getPermissions: (id: string) => adminRequest<UserPermissionGrant[]>(`/admin/system/users/${id}/permissions`),
    savePermissions: (id: string, payload: UserPermissionCommand) => adminRequest<UserPermissionGrant[]>(
      `/admin/system/users/${id}/permissions`,
      { method: 'PUT', data: payload },
    ),
    clearPermissions: (id: string) => adminRequest<UserPermissionGrant[]>(
      `/admin/system/users/${id}/permissions`,
      { method: 'DELETE' },
    ),
    permissionOptions: () => adminRequest<PermissionOption[]>(`/admin/system/permission-options`),
  },
  roles: rolesRemote,
  menus: {
    ...menusRemote,
    tree: () => adminRequest<SystemMenuRecord[]>('/admin/system/menus/tree'),
    routes: () => adminRequest<Array<{id:string;name:string}>>('/admin/system/menus/routes'),
  },
  dictionaries: {
    ...dictionariesRemote,
    types: () => adminRequest<Array<{code:string;name:string;description:string;itemCount:number}>>('/admin/system/dictionaries/types'),
    items: (typeCode:string, query:SystemQuery) => adminRequest<SystemPage<DictionaryRecord>>(`/admin/system/dictionaries/items?typeCode=${encodeURIComponent(typeCode)}&${queryString(query)}`),
  },
  auditLogs: {
    list: (query: SystemQuery) => adminRequest<SystemPage<AuditLogRecord>>(
      `/admin/system/audit-logs?${queryString(query)}`,
    ),
  },
};
