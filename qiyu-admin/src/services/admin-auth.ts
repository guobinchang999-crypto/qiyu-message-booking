export type AdminRole = 'HQ_ADMIN' | 'STORE_MANAGER';

export interface AdminSession {
  token: string;
  role: AdminRole;
  displayName: string;
  storeScope: string[];
  expiresAt: number;
}

export const ADMIN_AUTH_STORAGE_KEY = 'qiyu-admin-auth';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const REMEMBERED_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const isRole = (value: unknown): value is AdminRole => value === 'HQ_ADMIN' || value === 'STORE_MANAGER';

export const createMockSession = (role: AdminRole, remember: boolean): AdminSession => ({
  token: `mock-session-${Date.now()}`,
  role,
  displayName: role === 'HQ_ADMIN' ? '总部运营管理员' : '静安寺店店长',
  storeScope: role === 'HQ_ADMIN' ? ['ALL_STORES'] : ['静安寺店'],
  expiresAt: Date.now() + (remember ? REMEMBERED_SESSION_DURATION_MS : SESSION_DURATION_MS)
});

export const saveAdminSession = (session: AdminSession): void => {
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const readAdminSession = (): AdminSession | null => {
  const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    const expiresAt = parsed.expiresAt;
    if (!parsed.token || !isRole(parsed.role) || !parsed.displayName || !Array.isArray(parsed.storeScope) || typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) return null;
    if (expiresAt <= Date.now()) {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      return null;
    }
    return parsed as AdminSession;
  } catch (error) {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    return null;
  }
};

export const clearAdminSession = (): void => {
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
};

export const roleMenuPaths: Record<AdminRole, string[]> = {
  HQ_ADMIN: ['/dashboard', '/stores', '/appointments', '/checkin', '/service-orders', '/schedule', '/therapists', '/services', '/rooms', '/customers', '/members', '/coupons', '/reports'],
  STORE_MANAGER: ['/dashboard', '/appointments', '/checkin', '/service-orders', '/schedule', '/therapists', '/services', '/rooms', '/customers']
};
