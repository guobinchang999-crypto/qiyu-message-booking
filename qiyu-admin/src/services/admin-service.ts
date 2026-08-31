import { adminRequest } from './http';
import { adminRemoteApi, type DashboardData, type ResourceData } from './remote';
import type { AdminAuthResponse } from './admin-auth';

export const adminApi = {
  login: async (identifier: string, credential: string): Promise<AdminAuthResponse> => {
    return adminRequest<AdminAuthResponse>('/auth/login', { method: 'POST', data: { clientType: 'ADMIN_WEB', grantType: 'PASSWORD', identifier, credential } });
  },
  getDashboard: (): Promise<DashboardData> => adminRemoteApi.getDashboard(),
  getResources: (): Promise<ResourceData> => adminRemoteApi.getResources(),
};
