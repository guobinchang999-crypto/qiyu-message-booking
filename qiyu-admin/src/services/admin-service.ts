import { adminApiConfig } from './config';
import { adminMockApi } from './mock';
import { adminRemoteApi, type DashboardData, type ResourceData } from './remote';

export const adminApi = {
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
