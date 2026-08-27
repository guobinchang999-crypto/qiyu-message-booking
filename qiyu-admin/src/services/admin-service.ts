import { adminApiConfig } from './config';
import { adminRequest } from './http';
import { adminMockApi } from './mock';
import { adminRemoteApi, type DashboardData, type ResourceData } from './remote';
import type { AdminAuthResponse } from './admin-auth';

const mockAdminLogin = async (identifier: string, credential: string): Promise<AdminAuthResponse> => {
  if (!identifier || !credential) throw new Error('请输入账号和密码');
  const isManager = identifier === 'manager';
  const isEmployee = identifier === 'employee';
  const role = isEmployee ? 'EMPLOYEE' : isManager ? 'STORE_MANAGER' : 'HQ_ADMIN';
  const permissions = isEmployee ? ['booking:read', 'booking:update'] : isManager
    ? ['dashboard:read', 'booking:read', 'booking:update', 'booking:checkin', 'service_order:read', 'schedule:read', 'therapist:read', 'service:read', 'room:read', 'customer:read']
    : ['admin:*'];
  return {
    accessToken: `mock-admin-token-${Date.now()}`, tokenType: 'Bearer', expiresIn: 7200,
    principal: { userId: isEmployee ? 'mock-employee' : isManager ? 'mock-manager' : 'mock-admin', userType: 'STAFF', displayName: isEmployee ? '沈安然' : isManager ? '静安寺店店长' : '总部运营管理员', therapistId: isEmployee ? 'therapist-anran' : undefined, roles: [role], permissions, storeScopes: [{ resourceCode: 'booking', actionCode: '*', scopeType: isEmployee ? 'SELF' : isManager ? 'PRIMARY_STORE' : 'ALL_STORES', storeIds: isManager ? ['静安寺店'] : [] }] }
  };
};

export const adminApi = {
  login: async (identifier: string, credential: string): Promise<AdminAuthResponse> => {
    if (adminApiConfig.mode === 'mock') return mockAdminLogin(identifier, credential);
    return adminRequest<AdminAuthResponse>('/auth/login', { method: 'POST', data: { clientType: 'ADMIN_WEB', grantType: 'PASSWORD', identifier, credential } });
  },
  getDashboard: async (): Promise<DashboardData> => {
    if (adminApiConfig.mode !== 'mock') return adminRemoteApi.getDashboard();
    const data = await adminMockApi.getDashboard();
    return {
      ...data,
      alerts: data.alerts.map((item) => ({ ...item, type: item.type as DashboardData['alerts'][number]['type'] }))
    };
  },
  getResources: (): Promise<ResourceData> => adminApiConfig.mode === 'mock' ? adminMockApi.getResources() : adminRemoteApi.getResources()
};
