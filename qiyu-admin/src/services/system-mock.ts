import type { AuditLogRecord, DictionaryRecord, OrganizationRecord, SystemEntity, SystemMenuRecord, SystemPage, SystemQuery, SystemRoleRecord, SystemUserRecord } from '@/types/system';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const wait = <T,>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(clone(value)), 180));

let organizations: OrganizationRecord[] = [
  { id: 'org-hq', name: '栖愈总部', type: 'HEADQUARTERS', leader: '总部运营管理员', sort: 1, status: 'ENABLED' },
  { id: 'org-east', parentId: 'org-hq', name: '华东区域', type: 'REGION', leader: '陈经理', sort: 10, status: 'ENABLED' },
  { id: 'org-jingan', parentId: 'org-east', name: '静安寺店', type: 'STORE', leader: '李店长', sort: 20, status: 'ENABLED' },
  { id: 'dept-front', parentId: 'org-jingan', name: '前厅部', type: 'DEPARTMENT', leader: '王主管', sort: 30, status: 'ENABLED' }
];
let users: SystemUserRecord[] = [
  { id: 'u-admin', username: 'admin', displayName: '总部运营管理员', phone: '13800138000', departmentName: '栖愈总部', roleNames: ['超级管理员'], dataScope: '全部门店', status: 'ENABLED', lastLoginAt: '2026-08-27 10:26' },
  { id: 'u-manager', username: 'manager', displayName: '李店长', phone: '13800138001', departmentName: '静安寺店', roleNames: ['店长'], dataScope: '本门店', status: 'ENABLED', lastLoginAt: '2026-08-26 18:40' },
  { id: 'u-therapist', username: 'therapist', displayName: '沈安然', phone: '13800138002', departmentName: '静安寺店', roleNames: ['技师'], dataScope: '本人', status: 'ENABLED' }
];
let roles: SystemRoleRecord[] = [
  { id: 'r-admin', code: 'HQ_ADMIN', name: '超级管理员', permissionCodes: ['admin:*'], dataScope: '全部门店', userCount: 1, status: 'ENABLED' },
  { id: 'r-manager', code: 'STORE_MANAGER', name: '店长', permissionCodes: ['dashboard:read', 'booking:read', 'booking:update', 'staff:manage'], dataScope: '本门店', userCount: 3, status: 'ENABLED' },
  { id: 'r-therapist', code: 'EMPLOYEE', name: '技师', permissionCodes: ['booking:read', 'booking:update'], dataScope: '本人', userCount: 12, status: 'ENABLED' }
];
let menus: SystemMenuRecord[] = [
  { id: 'm-dashboard', name: '运营看板', path: '/dashboard', permissionCode: 'dashboard:read', type: 'MENU', sort: 10, visible: true, status: 'ENABLED' },
  { id: 'm-booking', name: '预约管理', path: '/appointments', permissionCode: 'booking:read', type: 'MENU', sort: 20, visible: true, status: 'ENABLED' },
  { id: 'm-system', name: '系统管理', path: '/system', permissionCode: 'system:access', type: 'DIRECTORY', sort: 90, visible: true, status: 'ENABLED' },
  { id: 'm-user', parentId: 'm-system', name: '用户管理', path: '/system/users', permissionCode: 'system:user:read', type: 'MENU', sort: 91, visible: true, status: 'ENABLED' }
];
let dictionaries: DictionaryRecord[] = [
  { id: 'd-booked', typeCode: 'booking_status', typeName: '预约状态', itemLabel: '已预约', itemValue: 'BOOKED', sort: 20, status: 'ENABLED' },
  { id: 'd-service', typeCode: 'booking_status', typeName: '预约状态', itemLabel: '服务中', itemValue: 'IN_SERVICE', sort: 50, status: 'ENABLED' },
  { id: 'd-store', typeCode: 'organization_type', typeName: '组织类型', itemLabel: '门店', itemValue: 'STORE', sort: 30, status: 'ENABLED' }
];
const auditLogs: AuditLogRecord[] = [
  { id: 'a-1', operatorName: '总部运营管理员', action: 'UPDATE_ROLE', resourceType: 'ROLE', resourceId: 'r-manager', organizationName: '栖愈总部', result: 'SUCCESS', ipAddress: '192.168.31.20', detail: '更新店长角色的数据权限范围', createdAt: '2026-08-27 10:18:32' },
  { id: 'a-2', operatorName: '李店长', action: 'REVEAL_PHONE', resourceType: 'CUSTOMER', resourceId: 'C10086', organizationName: '静安寺店', result: 'SUCCESS', ipAddress: '192.168.31.25', detail: '查看预约客户完整手机号', createdAt: '2026-08-27 09:42:11' },
  { id: 'a-3', operatorName: '未知账号', action: 'LOGIN', resourceType: 'AUTH', resourceId: '-', organizationName: '-', result: 'FAILURE', ipAddress: '192.168.31.99', detail: '密码校验失败', createdAt: '2026-08-27 08:12:06' }
];

type MutableKey = 'organizations' | 'users' | 'roles' | 'menus' | 'dictionaries';
const read = (key: MutableKey): SystemEntity[] => ({ organizations, users, roles, menus, dictionaries }[key]);
const write = (key: MutableKey, rows: SystemEntity[]) => {
  if (key === 'organizations') organizations = rows as OrganizationRecord[];
  if (key === 'users') users = rows as SystemUserRecord[];
  if (key === 'roles') roles = rows as SystemRoleRecord[];
  if (key === 'menus') menus = rows as SystemMenuRecord[];
  if (key === 'dictionaries') dictionaries = rows as DictionaryRecord[];
};
const matches = (row: SystemEntity | AuditLogRecord, keyword = '') => !keyword || JSON.stringify(row).toLowerCase().includes(keyword.toLowerCase());
const list = async <T,>(key: MutableKey, query: SystemQuery): Promise<SystemPage<T>> => {
  const rows = read(key).filter((row) => matches(row, query.keyword));
  return wait({ records: rows as T[], total: rows.length });
};
const save = async <T extends SystemEntity>(key: MutableKey, payload: Partial<T> & { id?: string }): Promise<T> => {
  const rows = read(key);
  const item = { ...payload, id: payload.id || `${key}-${Date.now()}` } as T;
  write(key, payload.id ? rows.map((row) => row.id === payload.id ? item : row) : [item, ...rows]);
  return wait(item);
};
const remove = async (key: MutableKey, id: string): Promise<void> => { write(key, read(key).filter((row) => row.id !== id)); await wait(undefined); };

export const systemMockApi = {
  listOrganizations: (query: SystemQuery) => list<OrganizationRecord>('organizations', query),
  saveOrganization: (payload: Partial<OrganizationRecord> & { id?: string }) => save('organizations', payload),
  deleteOrganization: (id: string) => remove('organizations', id),
  listUsers: (query: SystemQuery) => list<SystemUserRecord>('users', query),
  saveUser: (payload: Partial<SystemUserRecord> & { id?: string }) => save('users', payload),
  deleteUser: (id: string) => remove('users', id),
  listRoles: (query: SystemQuery) => list<SystemRoleRecord>('roles', query),
  saveRole: (payload: Partial<SystemRoleRecord> & { id?: string }) => save('roles', payload),
  deleteRole: (id: string) => remove('roles', id),
  listMenus: (query: SystemQuery) => list<SystemMenuRecord>('menus', query),
  saveMenu: (payload: Partial<SystemMenuRecord> & { id?: string }) => save('menus', payload),
  deleteMenu: (id: string) => remove('menus', id),
  listDictionaries: (query: SystemQuery) => list<DictionaryRecord>('dictionaries', query),
  saveDictionary: (payload: Partial<DictionaryRecord> & { id?: string }) => save('dictionaries', payload),
  deleteDictionary: (id: string) => remove('dictionaries', id),
  listAuditLogs: async (query: SystemQuery): Promise<SystemPage<AuditLogRecord>> => {
    const rows = auditLogs.filter((row) => matches(row, query.keyword));
    return wait({ records: rows, total: rows.length });
  }
};
