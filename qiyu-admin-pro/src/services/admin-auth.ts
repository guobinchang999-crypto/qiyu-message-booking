export type AdminRole = 'HQ_ADMIN' | 'STORE_MANAGER' | 'EMPLOYEE';
export type AdminScopeType = 'NONE' | 'SELF' | 'PRIMARY_STORE' | 'ASSIGNED_STORES' | 'REGION_STORES' | 'STORE' | 'ALL_STORES';

export interface AdminStoreScope {
  resourceCode?: string;
  actionCode?: string;
  scopeType?: AdminScopeType;
  scopeTypes?: AdminScopeType[];
  storeIds: string[];
  regionIds?: string[];
}
export interface AdminPrincipal {
  userId: string | number;
  userType: 'CUSTOMER' | 'STAFF';
  displayName?: string;
  customerId?: string;
  therapistId?: string;
  roles: string[];
  permissions: string[];
  deniedPermissionCodes?: string[];
  storeScopes: AdminStoreScope[];
}
export interface AdminAuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  principal: AdminPrincipal;
}
export interface AdminSession extends AdminAuthResponse {
  token: string;
  role: AdminRole;
  displayName: string;
  storeScope: string[];
  expiresAt: number;
}

export const ADMIN_AUTH_STORAGE_KEY = 'qiyu-admin-auth';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const REMEMBERED_SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const isRole = (value: unknown): value is AdminRole => value === 'HQ_ADMIN' || value === 'STORE_MANAGER' || value === 'EMPLOYEE';
const toRole = (principal: AdminPrincipal): AdminRole => {
  const role = principal.roles.find((item): item is AdminRole => isRole(item));
  return role || 'EMPLOYEE';
};
const hasScopeType = (scope: AdminStoreScope, type: AdminScopeType): boolean => scope.scopeType === type || !!scope.scopeTypes?.includes(type);
const toStoreScope = (principal: AdminPrincipal): string[] => principal.storeScopes.flatMap((scope) => hasScopeType(scope, 'ALL_STORES') ? ['ALL_STORES'] : scope.storeIds);

export const createAdminSession = (response: AdminAuthResponse, remember: boolean): AdminSession => ({
  ...response,
  token: response.accessToken,
  role: toRole(response.principal),
  displayName: response.principal.displayName || '栖愈运营人员',
  storeScope: toStoreScope(response.principal),
  expiresAt: Date.now() + Math.min(
    remember ? REMEMBERED_SESSION_DURATION_MS : SESSION_DURATION_MS,
    response.expiresIn * 1000
  )
});

// Kept for Mock consumers that used the old helper; role is still represented by a server-shaped principal.
export const createMockSession = (role: AdminRole, remember: boolean): AdminSession => createAdminSession({
  accessToken: `mock-admin-token-${Date.now()}`,
  tokenType: 'Bearer',
  expiresIn: 43_200,
  principal: {
    userId: `mock-${role.toLowerCase()}`,
    userType: 'STAFF',
    displayName: role === 'HQ_ADMIN' ? '总部运营管理员' : role === 'STORE_MANAGER' ? '静安寺店店长' : '值班员工',
    roles: [role],
    permissions: role === 'HQ_ADMIN' ? ['admin:*'] : ['dashboard:read', 'booking:read', 'booking:update', 'booking:cancel', 'booking:checkin', 'schedule:read'],
    storeScopes: [{ resourceCode: 'booking', actionCode: '*', scopeType: role === 'HQ_ADMIN' ? 'ALL_STORES' : role === 'STORE_MANAGER' ? 'PRIMARY_STORE' : 'SELF', storeIds: role === 'HQ_ADMIN' ? [] : ['静安寺店'] }]
  }
}, remember);

export const saveAdminSession = (session: AdminSession): void => localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session));

export const readAdminSession = (): AdminSession | null => {
  const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (!parsed.accessToken || !parsed.token || !isRole(parsed.role) || !parsed.principal || !Array.isArray(parsed.principal.roles) || !Array.isArray(parsed.principal.permissions) || !Array.isArray(parsed.storeScope) || typeof parsed.expiresAt !== 'number') return null;
    if (parsed.expiresAt <= Date.now()) { clearAdminSession(); return null; }
    return parsed as AdminSession;
  } catch (error) {
    clearAdminSession();
    return null;
  }
};

export const clearAdminSession = (): void => localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);

export const can = (session: AdminSession | null, permissionCode: string): boolean => !!session
  && !session.principal.deniedPermissionCodes?.includes(permissionCode)
  && (session.principal.permissions.includes('admin:*') || session.principal.permissions.includes(permissionCode));

export const canAccessStore = (session: AdminSession | null, resourceCode: string, actionCode: string, storeId: string): boolean => {
  if (!session) return false;
  const scopes = session.principal.storeScopes.filter((scope) => !scope.resourceCode || scope.resourceCode === resourceCode)
    .filter((scope) => !scope.actionCode || scope.actionCode === actionCode || scope.actionCode === '*');
  return scopes.some((scope) => hasScopeType(scope, 'ALL_STORES') || scope.storeIds.includes(storeId));
};

export const isSelfScope = (session: AdminSession | null, resourceCode: string, actionCode: string): boolean => !!session
  && session.principal.storeScopes.some((scope) => (!scope.resourceCode || scope.resourceCode === resourceCode)
    && (!scope.actionCode || scope.actionCode === actionCode || scope.actionCode === '*')
    && hasScopeType(scope, 'SELF'));

export const maskPhone = (value: string, session: AdminSession | null): string => can(session, 'customer:reveal_phone') || can(session, 'admin:*')
  ? value
  : value.length < 7 ? value : `${value.slice(0, 3)}****${value.slice(-4)}`;
