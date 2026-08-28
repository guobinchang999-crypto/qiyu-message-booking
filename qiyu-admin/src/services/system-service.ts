import { adminApiConfig } from './config';
import { adminRequest } from './http';
import { systemMockApi } from './system-mock';
import type { AuditLogRecord, DictionaryRecord, OrganizationRecord, SystemMenuRecord, SystemPage, SystemQuery, SystemRoleRecord, SystemUserRecord } from '@/types/system';

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
const useMock = adminApiConfig.mode === 'mock';

export const systemAdminApi = {
  organizations: { list: (query: SystemQuery) => useMock ? systemMockApi.listOrganizations(query) : organizationsRemote.list(query), save: (payload: SavePayload<OrganizationRecord>) => useMock ? systemMockApi.saveOrganization(payload) : organizationsRemote.save(payload), remove: (id: string) => useMock ? systemMockApi.deleteOrganization(id) : organizationsRemote.remove(id) },
  users: { list: (query: SystemQuery) => useMock ? systemMockApi.listUsers(query) : usersRemote.list(query), save: (payload: SavePayload<SystemUserRecord>) => useMock ? systemMockApi.saveUser(payload) : usersRemote.save(payload), remove: (id: string) => useMock ? systemMockApi.deleteUser(id) : usersRemote.remove(id) },
  roles: { list: (query: SystemQuery) => useMock ? systemMockApi.listRoles(query) : rolesRemote.list(query), save: (payload: SavePayload<SystemRoleRecord>) => useMock ? systemMockApi.saveRole(payload) : rolesRemote.save(payload), remove: (id: string) => useMock ? systemMockApi.deleteRole(id) : rolesRemote.remove(id) },
  menus: { list: (query: SystemQuery) => useMock ? systemMockApi.listMenus(query) : menusRemote.list(query), save: (payload: SavePayload<SystemMenuRecord>) => useMock ? systemMockApi.saveMenu(payload) : menusRemote.save(payload), remove: (id: string) => useMock ? systemMockApi.deleteMenu(id) : menusRemote.remove(id) },
  dictionaries: { list: (query: SystemQuery) => useMock ? systemMockApi.listDictionaries(query) : dictionariesRemote.list(query), save: (payload: SavePayload<DictionaryRecord>) => useMock ? systemMockApi.saveDictionary(payload) : dictionariesRemote.save(payload), remove: (id: string) => useMock ? systemMockApi.deleteDictionary(id) : dictionariesRemote.remove(id) },
  auditLogs: { list: (query: SystemQuery) => useMock ? systemMockApi.listAuditLogs(query) : adminRequest<SystemPage<AuditLogRecord>>(`/admin/system/audit-logs?${queryString(query)}`) }
};
