import { adminRequest } from './http';
import type { Appointment, BookingStatus } from '@/types';

export interface ReceptionBooking extends Appointment {
  customerId: string; verificationCode: string; paidAmount: number; endTime: string;
  durationMinutes: number; occupiedStartAt: string; occupiedEndAt: string; version: number;
  actions: string[]; depositDue: number; therapistFee: number; discountAmount: number;
}
export interface ReceptionOption { value: string; label: string; storeId?: string; price?: number; durationMinutes?: number }
export interface ReceptionOptions { stores: ReceptionOption[]; services: ReceptionOption[]; therapists: ReceptionOption[]; rooms: ReceptionOption[] }
interface RawBooking {
  id: string; customerName: string; mobile: string; customerId: string;
  store: { id: string; name: string }; service: { id: string; name: string; durationMinutes: number };
  therapist?: { id: string; name: string }; roomId: string; appointmentDate: string; startTime: string; endTime: string;
  status: BookingStatus; statusLabel: string; amount: number; paidAmount: number; verificationCode: string;
  depositDueAmount: number; therapistFeeAmount: number; discountAmount: number;
}
interface Entry { booking: RawBooking; roomName: string; occupiedStartAt: string; occupiedEndAt: string; version: number; actions: string[] }
export interface ReceptionQuery { storeId?: string; startDate?: string; endDate?: string; keyword?: string; customerId?: string; therapistId?: string; roomId?: string; serviceId?: string; status?: string; pageNum?: number; pageSize?: number }
export interface ReceptionPageData { list: ReceptionBooking[]; total: number; pageNum: number; pageSize: number; counts: Partial<Record<BookingStatus, number>> }
export interface Placement { storeId: string; serviceId: string; therapistId: string; roomId: string; date: string; startTime: string; bookingId?: string }
export interface Availability { available: boolean; message: string; occupiedStartAt?: string; occupiedEndAt?: string }
export interface ReceptionCustomer { id: string; name: string; mobile: string }
export interface BookingHistory { id: string; operator: string; action: string; beforeData: string; afterData: string; createdAt: string }
const prefix = '/admin/reception';
const queryString = (query: ReceptionQuery) => new URLSearchParams(Object.entries(query).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k,String(v)])).toString();
export const toReceptionBooking = (entry: Entry): ReceptionBooking => {
  const b = entry.booking;
  return { id: b.id, customerName: b.customerName, phone: b.mobile, customerId: b.customerId,
    storeId: b.store.id, store: b.store.name, serviceId: b.service.id, service: b.service.name,
    therapistId: b.therapist?.id, therapist: b.therapist?.name || '待安排', roomId: b.roomId, room: entry.roomName,
    scheduledAt: b.appointmentDate + ' ' + b.startTime.slice(0,5), endTime: b.endTime.slice(0,5),
    status: b.status, statusLabel: b.statusLabel, amount: Number(b.amount) + Number(b.therapistFeeAmount || 0) - Number(b.discountAmount || 0),
    paidAmount: Number(b.paidAmount), depositDue: Number(b.depositDueAmount), therapistFee: Number(b.therapistFeeAmount || 0),
    discountAmount: Number(b.discountAmount || 0), verificationCode: b.verificationCode,
    durationMinutes: b.service.durationMinutes, occupiedStartAt: entry.occupiedStartAt, occupiedEndAt: entry.occupiedEndAt,
    version: entry.version, actions: entry.actions };
};
export const receptionApi = {
  options: () => adminRequest<ReceptionOptions>(prefix + '/options'),
  async list(query: ReceptionQuery): Promise<ReceptionPageData> {
    const page = await adminRequest<Omit<ReceptionPageData,'list'> & { list: Entry[] }>(prefix + '/bookings?' + queryString(query));
    return { ...page, list: page.list.map(toReceptionBooking) };
  },
  async all(query: ReceptionQuery): Promise<ReceptionBooking[]> {
    let page = await this.list({ ...query, pageNum: 1, pageSize: 200 });
    const rows = [...page.list];
    while (rows.length < page.total && page.list.length) {
      page = await this.list({ ...query, pageNum: page.pageNum + 1, pageSize: 200 }); rows.push(...page.list);
    }
    return rows;
  },
  async detail(id: string) { return toReceptionBooking(await adminRequest<Entry>(prefix + '/bookings/' + encodeURIComponent(id))); },
  history: (id: string) => adminRequest<BookingHistory[]>(prefix + '/bookings/' + encodeURIComponent(id) + '/history'),
  async action(b: ReceptionBooking, action: string) {
    return toReceptionBooking(await adminRequest<Entry>(prefix + '/bookings/' + encodeURIComponent(b.id) + '/actions', { method: 'POST', data: { action, version: b.version } }));
  },
  async change(b: ReceptionBooking, data: Partial<Placement>) {
    return toReceptionBooking(await adminRequest<Entry>(prefix + '/bookings/' + encodeURIComponent(b.id), { method: 'PUT', data: { ...data, version: b.version } }));
  },
  availability: (data: Placement) => adminRequest<Availability>(prefix + '/availability', { method: 'POST', data }),
  lookupCustomer: (storeId: string, mobile: string) => adminRequest<ReceptionCustomer | null>(prefix + '/customers/lookup', { method: 'POST', data: { storeId, mobile } }),
  createCustomer: (storeId: string, mobile: string, name: string) => adminRequest<ReceptionCustomer>(prefix + '/customers', { method: 'POST', data: { storeId, mobile, name } }),
  async create(data: Placement & { customerName: string; mobile: string; requestId: string }) {
    const booking = await adminRequest<RawBooking>('/admin/bookings', { method: 'POST', data });
    return this.detail(booking.id);
  },
  async resolve(storeId: string, code: string) {
    return toReceptionBooking(await adminRequest<Entry>(prefix + '/checkin/resolve', { method: 'POST', data: { storeId, code } }));
  },
  async confirm(b: ReceptionBooking, storeId: string, code: string) {
    return toReceptionBooking(await adminRequest<Entry>(prefix + '/checkin/confirm', { method: 'POST', data: { storeId, code, bookingId: b.id, version: b.version } }));
  }
};
