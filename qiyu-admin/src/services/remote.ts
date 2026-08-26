import { adminRequest } from './http';

export interface DashboardData {
  statistics: Array<{ label: string; value: number | string; suffix: string; change: string }>;
  revenue: number[];
  ranking: Array<{ store: string; revenue: number; rate: number }>;
  utilization: Array<{ name: string; rate: number; text: string }>;
  alerts: Array<{ id: string; type: 'warning' | 'error' | 'processing'; title: string; description: string }>;
}

export interface ResourceData {
  schedules: Array<{ therapist: string; skill: string; slots: Array<{ day: string; kind: 'WORK' | 'BOOKED' | 'LEAVE' | 'REST'; label: string }> }>;
  rooms: Array<{ id: string; name: string; type: string; status: 'FREE' | 'BOOKED' | 'IN_USE' | 'CLEANING'; customer?: string; therapist?: string; nextTime: string }>;
}

interface RemoteMetric { name: string; value: number | string; comparison?: string | null; }

const toNumber = (value: number | string): number => typeof value === 'number' ? value : Number.parseFloat(value.replace(/[^\d.]/g, '')) || 0;

export const adminRemoteApi = {
  async getDashboard(): Promise<DashboardData> {
    const payload = await adminRequest<{
      statistics: RemoteMetric[];
      revenueTrend: RemoteMetric[];
      storeRanking: RemoteMetric[];
      therapistUtilization: Array<{ name: string; rate: number; text: string }>;
      alerts: Array<{ level: string; message: string }>;
    }>('/admin/dashboard');
    return {
      statistics: payload.statistics.map((item) => ({ label: item.name, value: item.value, suffix: typeof item.value === 'number' ? '单' : '', change: item.comparison || '-' })),
      revenue: payload.revenueTrend.map((item) => Math.round(toNumber(item.value) / 100)),
      ranking: payload.storeRanking.map((item) => ({ store: item.name, revenue: toNumber(item.value), rate: Number.parseFloat(item.comparison || '0') || 0 })),
      utilization: payload.therapistUtilization,
      alerts: payload.alerts.map((item, index) => {
        const type: DashboardData['alerts'][number]['type'] = item.level === 'error' ? 'error' : item.level === 'processing' ? 'processing' : 'warning';
        return { id: `remote-alert-${index}`, type, title: item.message, description: item.message };
      })
    };
  },
  async getResources(): Promise<ResourceData> {
    const payload = await adminRequest<{
      therapistSchedules: Array<{ name?: string; skills?: string[]; week: string[] }>;
      rooms: Array<{ id: string; name: string; type: string; status: string; note?: string | null }>;
    }>('/admin/schedule-resources');
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const toKind = (label: string): ResourceData['schedules'][number]['slots'][number]['kind'] => label.includes('请假') ? 'LEAVE' : label.includes('休息') ? 'REST' : label.includes('预约') ? 'BOOKED' : 'WORK';
    return {
      schedules: payload.therapistSchedules.map((item) => ({
        therapist: item.name || '未命名技师',
        skill: item.skills?.join(' / ') || '综合服务',
        slots: item.week.map((label, index) => ({ day: weekdays[index] || `周${index + 1}`, kind: toKind(label), label }))
      })),
      rooms: payload.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        status: room.status === 'AVAILABLE' ? 'FREE' : room.status === 'BOOKED' ? 'BOOKED' : room.status === 'IN_USE' ? 'IN_USE' : 'CLEANING',
        nextTime: room.note || '当前可安排服务'
      }))
    };
  }
};
