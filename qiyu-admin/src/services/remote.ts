import { adminRequest } from './http';
import type { Appointment, AppointmentAuditRecord, BookingOptionPayload, BookingStatus, CheckinTask, CouponCampaign, CustomerProfile, MemberAccount, RoomResource, ServiceCatalogItem, ServiceOrder, StoreProfile, TherapistProfile } from '@/types';

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

export interface BusinessReportRow {
  id: string;
  store: string;
  bookingCount: number;
  completionRate: number;
  revenue: number;
  averageTicket: number;
  topService: string;
}

interface RemoteMetric { name: string; value: number | string; comparison?: string | null; }

const toNumber = (value: number | string): number => typeof value === 'number' ? value : Number.parseFloat(value.replace(/[^\d.]/g, '')) || 0;

export const adminRemoteApi = {
  async createAppointment(appointment: Appointment): Promise<void> {
    await adminRequest('/admin/bookings', { method: 'POST', data: {
      storeId: appointment.store, serviceId: appointment.service, therapistId: appointment.therapist,
      roomId: appointment.room, date: appointment.scheduledAt.slice(0, 10), startTime: appointment.scheduledAt.slice(11, 16),
      customerName: appointment.customerName, mobile: appointment.phone
    } });
  },
  async rescheduleAppointment(appointment: Appointment): Promise<void> {
    await adminRequest(`/admin/bookings/${encodeURIComponent(appointment.id)}/reschedule`, { method: 'POST', data: {
      date: appointment.scheduledAt.slice(0, 10), startTime: appointment.scheduledAt.slice(11, 16)
    } });
  },
  async getCoupons(): Promise<CouponCampaign[]> {
    const rows = await adminRequest<Array<Record<string, unknown>>>('/admin/coupons');
    return rows.map((row) => ({ id: String(row.id), name: String(row.name || ''), discount: String(row.discount || ''), scope: '全门店通用', validUntil: String(row.valid_until || '-'), issuedCount: Number(row.issued_count || 0), usedCount: Number(row.used_count || 0), status: String(row.display_status || '草稿') as CouponCampaign['status'] }));
  },
  async getMembers(): Promise<MemberAccount[]> {
    const rows = await adminRequest<Array<Record<string, unknown>>>('/admin/members');
    return rows.map((row) => ({ id: String(row.id), customerName: String(row.customer_name || ''), level: String(row.level || 'REGULAR'), balance: Number(row.balance || 0), packageBalance: Number(row.package_balance || 0), couponCount: Number(row.coupon_count || 0), scope: '全门店通用' }));
  },
  async getCustomers(): Promise<CustomerProfile[]> {
    const rows = await adminRequest<Array<Record<string, unknown>>>('/admin/customers');
    return rows.map((row) => ({ id: String(row.id), name: String(row.name || ''), phone: String(row.phone || ''), memberLevel: String(row.member_level || 'REGULAR'), lastVisitAt: String(row.last_visit_at || '-'), totalBookings: Number(row.total_bookings || 0), totalSpend: Number(row.total_spend || 0) }));
  },
  async getServiceOrders(): Promise<ServiceOrder[]> {
    const appointments = await this.getAppointments();
    return appointments.map((item) => ({ id: `SO-${item.id}`, bookingId: item.id, customerName: item.customerName, store: item.store, service: item.service, therapist: item.therapist, room: item.room, status: item.status, paidAmount: item.amount }));
  },
  async getCheckinTasks(): Promise<CheckinTask[]> {
    const appointments = await this.getAppointments();
    return appointments.filter((item) => ['BOOKED', 'CHECKED_IN', 'WAITING_SERVICE'].includes(item.status)).map((item) => ({ id: item.id, code: item.id, customerName: item.customerName, store: item.store, service: item.service, scheduledAt: item.scheduledAt, status: item.status }));
  },
  async getAppointmentAuditLogs(bookingId: string): Promise<AppointmentAuditRecord[]> {
    const payload = await adminRequest<{ records: Array<Record<string, unknown>> }>('/admin/system/audit-logs?keyword=' + encodeURIComponent(bookingId) + '&page=1&pageSize=100');
    return payload.records.filter((row) => String(row.resourceId || '') === bookingId).map((row) => ({
      id: String(row.id), appointmentId: bookingId, action: String(row.action || 'STATUS_CHANGED') as AppointmentAuditRecord['action'],
      fromStatus: row.fromStatus as BookingStatus | undefined, toStatus: row.toStatus as BookingStatus | undefined,
      operator: String(row.operatorName || ''), detail: String(row.detail || row.action || ''), createdAt: String(row.createdAt || '')
    }));
  },
  async getBookingOptions(): Promise<BookingOptionPayload> {
    const [stores, services, therapists, rooms, dictionaries] = await Promise.all([
      adminRequest<Array<Record<string, unknown>>>('/catalog/options/stores'),
      adminRequest<Array<Record<string, unknown>>>('/catalog/options/services'),
      adminRequest<Array<Record<string, unknown>>>('/catalog/options/therapists'),
      adminRequest<Array<Record<string, unknown>>>('/catalog/options/rooms'),
      adminRequest<Record<string, Array<Record<string, unknown>>>>('/catalog/dictionaries')
    ]);
    const option = (row: Record<string, unknown>) => ({ label: String(row.label || row.name || ''), value: String(row.value || row.id || '') });
    return {
      stores: stores.map(option), services: services.map(option), therapists: therapists.map(option), rooms: rooms.map(option),
      statuses: (dictionaries.booking_status || []).map(option)
    };
  },
  async getAppointments(status?: BookingStatus): Promise<Appointment[]> {
    const payload = await adminRequest<{ list: Array<Record<string, unknown>> }>('/admin/bookings', { });
    return payload.list
      .filter((row) => !status || row.status === status)
      .map((row) => ({
        id: String(row.id), customerName: String(row.customerName || ''), phone: String(row.phone || ''),
        store: String((row.store as Record<string, unknown> | undefined)?.name || row.storeName || row.storeId || ''),
        service: String((row.service as Record<string, unknown> | undefined)?.name || row.serviceName || ''),
        therapist: String((row.therapist as Record<string, unknown> | undefined)?.name || row.therapistName || ''),
        room: String(row.roomName || row.roomId || ''), scheduledAt: String(row.scheduledAt || `${row.date || ''} ${row.startTime || ''}`).trim(),
        status: String(row.status) as BookingStatus, amount: Number(row.amount || 0)
      }));
  },
  async transitionAppointment(id: string, action: 'checkin' | 'start-service' | 'finish-service' | 'settle' | 'cancel'): Promise<void> {
    await adminRequest(`/bookings/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
  },
  async getStores(): Promise<StoreProfile[]> {
    const rows = await adminRequest<Array<Record<string, unknown>>>('/stores');
    return rows.map((row) => ({
      id: String(row.id), name: String(row.name), address: String(row.address || ''), phone: String(row.phone || ''),
      manager: '待配置', businessHours: String(row.businessHours || ''), roomCount: 0, therapistCount: 0,
      status: row.businessStatusCode === 'OPEN' ? '营业中' : '休息中'
    }));
  },
  async getServices(): Promise<ServiceCatalogItem[]> {
    const rows = await adminRequest<Array<Record<string, unknown>>>('/services');
    return rows.map((row) => ({
      id: String(row.id), name: String(row.name), category: String(row.category || ''),
      durationMinutes: Number(row.durationMinutes || 0), price: Number(row.price || 0),
      memberPrice: Number(row.memberPrice || 0), status: '上架', bookingCount: Number(row.salesCount || 0)
    }));
  },
  async getTherapists(): Promise<TherapistProfile[]> {
    const rows = await adminRequest<Array<Record<string, unknown>>>('/therapists');
    return rows.map((row) => ({
      id: String(row.id), name: String(row.name), store: String(row.storeId || ''), level: String(row.level || ''),
      skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
      status: row.status === 'AVAILABLE' ? '可预约' : row.status === 'ON_LEAVE' ? '休假' : '服务中',
      rating: Number(row.rating || 0), todayBookings: 0
    }));
  },
  async getRooms(): Promise<RoomResource[]> {
    const rows = await adminRequest<Array<Record<string, unknown>>>('/catalog/options/rooms');
    return rows.map((row) => ({
      id: String(row.value || row.id), name: String(row.label || row.name), type: String(row.type || ''),
      status: row.status === 'AVAILABLE' ? 'FREE' : row.status === 'IN_USE' ? 'IN_USE' : row.status === 'CLEANING' ? 'CLEANING' : 'BOOKED',
      nextTime: String(row.note || '当前可安排服务')
    }));
  },
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
  async getBusinessReports(): Promise<BusinessReportRow[]> {
    // The dashboard endpoint is the existing server contract that exposes
    // store-level operating metrics. Keep unavailable report dimensions
    // explicit instead of inventing values on the client.
    const dashboard = await this.getDashboard();
    return dashboard.ranking.map((item, index) => ({
      id: `remote-report-${index}`,
      store: item.store,
      bookingCount: 0,
      completionRate: item.rate,
      revenue: item.revenue,
      averageTicket: 0,
      topService: '暂无数据'
    }));
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
