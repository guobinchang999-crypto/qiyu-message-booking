import { adminRequest } from './http';
import type { Appointment, AppointmentAuditRecord, BookingOptionPayload, BookingStatus, BusinessReportRow, CheckinTask, CouponCampaign, CustomerProfile, MemberAccount, RoomResource, ServiceCatalogItem, ServiceOrder, StoreProfile, TherapistProfile } from '@/types';

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

interface RemoteCoupon {
  id: string;
  name: string;
  discount: string;
  scope: string;
  validUntil: string;
  issuedCount: number;
  usedCount: number;
  displayStatus: CouponCampaign['status'];
}

interface RemoteMember {
  id: string;
  customerName: string;
  level: string;
  balance: number;
  packageBalance: number;
  couponCount: number;
  scope: string;
}

interface RemoteCustomer {
  id: string;
  name: string;
  phone: string;
  memberLevel: string;
  lastVisitAt: string;
  totalBookings: number;
  totalSpend: number;
}

interface RemoteCatalogOption {
  value: string;
  label: string;
  storeId?: string | null;
  status?: string | null;
  statusLabel?: string | null;
}

interface RemoteDictionaryCollection {
  bookingStatus: RemoteCatalogOption[];
  paymentStatus: RemoteCatalogOption[];
  roomStatus: RemoteCatalogOption[];
  therapistStatus: RemoteCatalogOption[];
  timeSlotStatus: RemoteCatalogOption[];
}

interface RemoteCatalogStore {
  id: string;
  name: string;
}

interface RemoteCatalogService {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  memberPrice: number;
  salesCount: number;
}

interface RemoteCatalogTherapist {
  id: string;
  name: string;
  storeId: string;
  level: string;
  skills: string[];
  status: string;
  rating: number;
  serviceCount: number;
}

interface RemoteAdminTherapist {
  id: string;
  name: string;
  store: string;
  level: string;
  skills: string[];
  status: TherapistProfile['status'];
  rating: number;
  todayBookings: number;
}

interface RemoteBooking {
  id: string;
  status: BookingStatus;
  statusLabel: string;
  store: RemoteCatalogStore;
  service: RemoteCatalogService;
  therapist: RemoteCatalogTherapist | null;
  roomId: string;
  customerName: string;
  mobile: string;
  appointmentDate: string;
  startTime: string;
  amount: number;
}

interface RemoteBookingPage {
  list: RemoteBooking[];
  total: number;
  pageNum: number;
  pageSize: number;
}

interface RemoteAuditLog {
  id: string;
  action: string;
  resourceId: string;
  operatorName: string;
  detail: string;
  createdAt: string;
}

interface RemoteStoreProfile {
  id: string;
  name: string;
  address: string;
  manager: string | null;
  phone: string;
  businessHours: string;
  roomCount: number;
  therapistCount: number;
  status: StoreProfile['status'];
}

interface RemoteBusinessReport {
  id: string;
  store: string;
  bookingCount: number;
  completionRate: number;
  revenue: number;
  averageTicket: number;
  topService: string | null;
}

const toNumber = (value: number | string): number => typeof value === 'number' ? value : Number.parseFloat(value.replace(/[^\d.]/g, '')) || 0;

export const adminRemoteApi = {
  async createAppointment(appointment: Appointment): Promise<void> {
    await adminRequest('/admin/bookings', { method: 'POST', data: {
      storeId: appointment.storeId || appointment.store, serviceId: appointment.serviceId || appointment.service,
      therapistId: appointment.therapistId || appointment.therapist,
      roomId: appointment.roomId || appointment.room, date: appointment.scheduledAt.slice(0, 10), startTime: appointment.scheduledAt.slice(11, 16),
      customerName: appointment.customerName, mobile: appointment.phone
    } });
  },
  async rescheduleAppointment(appointment: Appointment): Promise<void> {
    await adminRequest(`/admin/bookings/${encodeURIComponent(appointment.id)}/reschedule`, { method: 'POST', data: {
      date: appointment.scheduledAt.slice(0, 10), startTime: appointment.scheduledAt.slice(11, 16)
    } });
  },
  async getCoupons(): Promise<CouponCampaign[]> {
    const rows = await adminRequest<RemoteCoupon[]>('/admin/coupons');
    return rows.map((row) => ({ id: row.id, name: row.name, discount: row.discount, scope: '全门店通用', validUntil: row.validUntil, issuedCount: row.issuedCount, usedCount: row.usedCount, status: row.displayStatus }));
  },
  async getMembers(): Promise<MemberAccount[]> {
    const rows = await adminRequest<RemoteMember[]>('/admin/members');
    return rows.map((row) => ({ id: row.id, customerName: row.customerName, level: row.level, balance: row.balance, packageBalance: row.packageBalance, couponCount: row.couponCount, scope: '全门店通用' }));
  },
  async getCustomers(): Promise<CustomerProfile[]> {
    const rows = await adminRequest<RemoteCustomer[]>('/admin/customers');
    return rows.map((row) => ({ id: row.id, name: row.name, phone: row.phone, memberLevel: row.memberLevel, lastVisitAt: row.lastVisitAt, totalBookings: row.totalBookings, totalSpend: row.totalSpend }));
  },
  async getServiceOrders(): Promise<ServiceOrder[]> {
    const appointments = await this.getAppointments();
    return appointments.map((item) => ({ id: `SO-${item.id}`, bookingId: item.id, customerName: item.customerName, store: item.store, service: item.service, therapist: item.therapist, room: item.room, status: item.status, statusLabel: item.statusLabel, paidAmount: item.amount }));
  },
  async getCheckinTasks(): Promise<CheckinTask[]> {
    const appointments = await this.getAppointments();
    return appointments.filter((item) => ['BOOKED', 'CHECKED_IN', 'WAITING_SERVICE'].includes(item.status)).map((item) => ({ id: item.id, storeId: item.storeId, code: item.id, customerName: item.customerName, store: item.store, service: item.service, scheduledAt: item.scheduledAt, status: item.status, statusLabel: item.statusLabel }));
  },
  async getAppointmentAuditLogs(bookingId: string): Promise<AppointmentAuditRecord[]> {
    const payload = await adminRequest<{ records: RemoteAuditLog[] }>('/admin/system/audit-logs?keyword=' + encodeURIComponent(bookingId) + '&page=1&pageSize=100');
    return payload.records.filter((row) => row.resourceId === bookingId).map((row) => ({
      id: row.id, appointmentId: bookingId, action: 'STATUS_CHANGED',
      operator: row.operatorName, detail: row.detail || row.action, createdAt: row.createdAt
    }));
  },
  async getBookingOptions(): Promise<BookingOptionPayload> {
    const [stores, services, therapists, rooms, dictionaries] = await Promise.all([
      adminRequest<RemoteCatalogOption[]>('/catalog/options/stores'),
      adminRequest<RemoteCatalogOption[]>('/catalog/options/services'),
      adminRequest<RemoteCatalogOption[]>('/catalog/options/therapists'),
      adminRequest<RemoteCatalogOption[]>('/catalog/options/rooms'),
      adminRequest<RemoteDictionaryCollection>('/catalog/dictionaries')
    ]);
    const option = (row: RemoteCatalogOption) => ({ label: row.label, value: row.value });
    return {
      stores: stores.map(option), services: services.map(option), therapists: therapists.map(option), rooms: rooms.map(option),
      statuses: dictionaries.bookingStatus.map(option)
    };
  },
  async getAppointments(status?: BookingStatus): Promise<Appointment[]> {
    const payload = await adminRequest<RemoteBookingPage>('/admin/bookings');
    return payload.list
      .filter((row) => !status || row.status === status)
      .map((row) => ({
        id: row.id, storeId: row.store.id, serviceId: row.service.id,
        therapistId: row.therapist?.id, roomId: row.roomId,
        customerName: row.customerName, phone: row.mobile,
        store: row.store.name, service: row.service.name, therapist: row.therapist?.name || '待分配',
        room: row.roomId, scheduledAt: `${row.appointmentDate} ${row.startTime}`,
        status: row.status, statusLabel: row.statusLabel, amount: row.amount
      }));
  },
  async transitionAppointment(id: string, action: 'checkin' | 'start-service' | 'finish-service' | 'settle' | 'cancel'): Promise<void> {
    await adminRequest(`/bookings/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
  },
  async getStores(): Promise<StoreProfile[]> {
    const rows = await adminRequest<RemoteStoreProfile[]>('/admin/stores');
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      manager: row.manager,
      businessHours: row.businessHours,
      roomCount: row.roomCount,
      therapistCount: row.therapistCount,
      status: row.status
    }));
  },
  async getServices(): Promise<ServiceCatalogItem[]> {
    const rows = await adminRequest<RemoteCatalogService[]>('/services');
    return rows.map((row) => ({
      id: row.id, name: row.name, category: row.category,
      durationMinutes: row.durationMinutes, price: row.price,
      memberPrice: row.memberPrice, status: '上架', bookingCount: row.salesCount
    }));
  },
  async getTherapists(): Promise<TherapistProfile[]> {
    return adminRequest<RemoteAdminTherapist[]>('/admin/therapists');
  },
  async getRooms(): Promise<RoomResource[]> {
    const payload = await adminRequest<{ rooms: Array<{ id: string; name: string; type: string; status: string; note: string | null }> }>('/admin/schedule-resources');
    return payload.rooms.map((row) => ({
      id: row.id, name: row.name, type: row.type,
      status: row.status === 'AVAILABLE' ? 'FREE' : row.status === 'IN_USE' ? 'IN_USE' : row.status === 'CLEANING' ? 'CLEANING' : 'BOOKED',
      nextTime: row.note || '-'
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
    return adminRequest<RemoteBusinessReport[]>('/admin/reports');
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
