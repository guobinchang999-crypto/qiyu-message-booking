import {
  appointments,
  businessReports,
  checkinTasks,
  couponCampaigns,
  customerProfiles,
  memberAccounts,
  roomResources,
  scheduleRows,
  serviceCatalog,
  serviceOrders,
  statusText,
  storeProfiles,
  therapistProfiles
} from '@/mock/data';
import type {
  Appointment,
  AppointmentConflict,
  AppointmentConflictResult,
  AppointmentAuditRecord,
  BookingOptionPayload,
  BookingStatus,
  BusinessReportRow,
  CheckinTask,
  CouponCampaign,
  CustomerProfile,
  MemberAccount,
  RoomResource,
  ScheduleRow,
  ServiceCatalogItem,
  ServiceOrder,
  StoreProfile,
  TherapistProfile
} from '@/types';

const delay = <T,>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), 260));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let appointmentsState: Appointment[] = clone(appointments);
let roomsState: RoomResource[] = clone(roomResources);
let auditLogsState: AppointmentAuditRecord[] = [];

const activeConflictStatuses: BookingStatus[] = ['PENDING_PAYMENT', 'BOOKED', 'CHECKED_IN', 'WAITING_SERVICE', 'IN_SERVICE', 'PENDING_SETTLEMENT'];
const serviceOrderId = (bookingId: string) => `SO-${bookingId.slice(-5)}`;
const checkinCode = (bookingId: string) => bookingId.slice(-6).replace(/\D/g, '').padEnd(6, '8').slice(0, 6);
const findAppointment = (id: string): Appointment => {
  const appointment = appointmentsState.find((item) => item.id === id);
  if (!appointment) throw new Error('预约不存在');
  return appointment;
};
const findAppointmentConflicts = (appointment: Appointment): AppointmentConflictResult => {
  const conflicts: AppointmentConflict[] = [];
  const competingAppointments = appointmentsState.filter((item) =>
    item.id !== appointment.id &&
    item.store === appointment.store &&
    item.scheduledAt === appointment.scheduledAt &&
    activeConflictStatuses.includes(item.status)
  );
  competingAppointments.forEach((item) => {
    if (item.therapist === appointment.therapist) {
      conflicts.push({
        field: 'therapist',
        appointmentId: item.id,
        message: `${appointment.therapist} 在 ${appointment.scheduledAt} 已有 ${item.customerName} 的 ${item.service} 预约`
      });
    }
    if (item.room === appointment.room) {
      conflicts.push({
        field: 'room',
        appointmentId: item.id,
        message: `${appointment.room} 在 ${appointment.scheduledAt} 已被 ${item.customerName} 占用`
      });
    }
  });
  const room = roomsState.find((item) => item.name === appointment.room);
  if (room && room.status === 'CLEANING' && room.customer !== appointment.customerName) {
    conflicts.push({
      field: 'room',
      appointmentId: appointment.id,
      message: `${appointment.room} 当前处于清洁中，请选择其他房间或稍后时段`
    });
  }
  return { hasConflict: conflicts.length > 0, conflicts };
};
const recordAudit = (entry: Omit<AppointmentAuditRecord, 'id' | 'createdAt'>) => {
  auditLogsState = [{ ...entry, id: `AUDIT-${Date.now()}-${auditLogsState.length + 1}`, createdAt: new Date().toISOString() }, ...auditLogsState];
};
const assertNoAppointmentConflicts = (appointment: Appointment) => {
  const result = findAppointmentConflicts(appointment);
  if (result.hasConflict) {
    throw new Error(result.conflicts.map((conflict) => conflict.message).join('；'));
  }
};
const updateRoomByAppointment = (appointment: Appointment, status: BookingStatus) => {
  roomsState = roomsState.map((room) => {
    if (room.name !== appointment.room) return room;
    if (status === 'CANCELLED' || status === 'COMPLETED') {
      return { ...room, status: 'FREE', customer: undefined, therapist: undefined, nextTime: appointment.scheduledAt.slice(11, 16) };
    }
    if (status === 'IN_SERVICE') {
      return { ...room, status: 'IN_USE', customer: appointment.customerName, therapist: appointment.therapist, nextTime: appointment.scheduledAt.slice(11, 16) };
    }
    if (status === 'PENDING_SETTLEMENT') {
      return { ...room, status: 'CLEANING', customer: appointment.customerName, therapist: appointment.therapist, nextTime: '清洁后释放' };
    }
    return { ...room, status: 'BOOKED', customer: appointment.customerName, therapist: appointment.therapist, nextTime: appointment.scheduledAt.slice(11, 16) };
  });
};
const releasePreviousRoomIfChanged = (appointment: Appointment) => {
  const previous = appointmentsState.find((item) => item.id === appointment.id);
  if (!previous || previous.room === appointment.room) return;
  roomsState = roomsState.map((room) => room.name === previous.room ? { ...room, status: 'FREE', customer: undefined, therapist: undefined, nextTime: previous.scheduledAt.slice(11, 16) } : room);
};
const upsertAppointment = (appointment: Appointment) => {
  assertNoAppointmentConflicts(appointment);
  const previous = appointmentsState.find((item) => item.id === appointment.id);
  releasePreviousRoomIfChanged(appointment);
  const exists = appointmentsState.some((item) => item.id === appointment.id);
  appointmentsState = exists ? appointmentsState.map((item) => item.id === appointment.id ? appointment : item) : [appointment, ...appointmentsState];
  updateRoomByAppointment(appointment, appointment.status);
  recordAudit({
    appointmentId: appointment.id,
    action: previous ? 'UPDATED' : 'CREATED',
    fromStatus: previous?.status,
    toStatus: appointment.status,
    operator: '当前运营人员',
    detail: previous ? '更新预约信息并完成资源校验' : '创建预约并完成资源占用'
  });
  return appointment;
};
const transitionAppointment = (id: string, status: BookingStatus) => {
  const current = findAppointment(id);
  const next = { ...current, status };
  upsertAppointment(next);
  recordAudit({
    appointmentId: id,
    action: 'STATUS_CHANGED',
    fromStatus: current.status,
    toStatus: status,
    operator: '当前运营人员',
    detail: `${statusText[current.status]} → ${statusText[status]}`
  });
  return next;
};
const buildCheckinTasks = (): CheckinTask[] => appointmentsState
  .filter((appointment) => ['BOOKED', 'CHECKED_IN', 'WAITING_SERVICE'].includes(appointment.status))
  .map((appointment) => ({
    id: appointment.id,
    code: checkinCode(appointment.id),
    customerName: appointment.customerName,
    store: appointment.store,
    service: appointment.service,
    scheduledAt: appointment.scheduledAt,
    status: appointment.status
  }));
const buildServiceOrders = (): ServiceOrder[] => appointmentsState.map((appointment) => ({
  id: serviceOrderId(appointment.id),
  bookingId: appointment.id,
  customerName: appointment.customerName,
  store: appointment.store,
  service: appointment.service,
  therapist: appointment.therapist,
  room: appointment.room,
  status: appointment.status,
  paidAmount: appointment.amount
}));

export const adminMockApi = {
  getDashboard: () => delay({
    statistics: [
      { label: '今日预约', value: 86, suffix: '单', change: '+12.6%' },
      { label: '待到店', value: 18, suffix: '人', change: '+4.2%' },
      { label: '服务中', value: 11, suffix: '单', change: '+2.8%' },
      { label: '今日营业额', value: 23860, suffix: '元', change: '+16.1%' }
    ],
    revenue: [42, 55, 46, 68, 62, 82, 75],
    ranking: [
      { store: '静安寺店', revenue: 9820, rate: 92 },
      { store: '徐家汇店', revenue: 8040, rate: 86 },
      { store: '陆家嘴店', revenue: 6000, rate: 78 }
    ],
    utilization: [
      { name: '林知夏', rate: 92, text: '7 单服务中 / 已排 8 单' },
      { name: '沈安然', rate: 86, text: '6 单服务中 / 已排 7 单' },
      { name: '周语宁', rate: 74, text: '5 单服务中 / 已排 7 单' }
    ],
    alerts: [
      { id: 'a1', type: 'warning', title: '徐家汇店 · 14:00 房间资源紧张', description: '调和房 02 与芳疗房 01 均已被连续预约，请关注延时风险。' },
      { id: 'a2', type: 'error', title: '静安寺店 · 技师请假影响 2 个预约', description: '周语宁今日 15:00 后请假，建议在预约管理中安排替代技师。' }
    ]
  }),
  getAppointments: () => delay(clone(appointmentsState)),
  getAppointmentAuditLogs: (appointmentId?: string): Promise<AppointmentAuditRecord[]> => delay(clone(auditLogsState.filter((item) => !appointmentId || item.appointmentId === appointmentId))),
  getBookingOptions: (): Promise<BookingOptionPayload> => delay({
    stores: storeProfiles.map((store) => ({ label: store.name, value: store.name })),
    services: serviceCatalog.map((service) => ({ label: `${service.name} ${service.durationMinutes}分钟`, value: `${service.name} ${service.durationMinutes}分钟` })),
    therapists: therapistProfiles.map((therapist) => ({ label: `${therapist.name} · ${therapist.level}`, value: therapist.name })),
    rooms: roomsState.map((room) => ({ label: `${room.name} · ${room.type}`, value: room.name })),
    statuses: Object.entries(statusText).map(([value, label]) => ({ label, value }))
  }),
  checkAppointmentConflicts: (appointment: Appointment): Promise<AppointmentConflictResult> => delay(findAppointmentConflicts(appointment)),
  createAppointment: (appointment: Appointment) => delay(upsertAppointment(appointment)),
  updateAppointment: (appointment: Appointment) => delay(upsertAppointment(appointment)),
  cancelAppointment: (id: string) => delay(transitionAppointment(id, 'CANCELLED')),
  getResources: () => delay({ rooms: clone(roomsState), schedules: scheduleRows }),
  getStores: (): Promise<StoreProfile[]> => delay([...storeProfiles]),
  getCheckinTasks: (): Promise<CheckinTask[]> => delay(buildCheckinTasks()),
  getServiceOrders: (): Promise<ServiceOrder[]> => delay(buildServiceOrders()),
  getRooms: (): Promise<RoomResource[]> => delay(clone(roomsState)),
  getTherapists: (): Promise<TherapistProfile[]> => delay([...therapistProfiles]),
  getServiceCatalog: (): Promise<ServiceCatalogItem[]> => delay([...serviceCatalog]),
  getCustomers: (): Promise<CustomerProfile[]> => delay([...customerProfiles]),
  getMembers: (): Promise<MemberAccount[]> => delay([...memberAccounts]),
  getCoupons: (): Promise<CouponCampaign[]> => delay([...couponCampaigns]),
  getBusinessReports: (): Promise<BusinessReportRow[]> => delay([...businessReports]),
  checkInAppointment: (id: string) => delay(transitionAppointment(id, 'CHECKED_IN')),
  markWaitingService: (id: string) => delay(transitionAppointment(id, 'WAITING_SERVICE')),
  startService: (id: string) => delay(transitionAppointment(id, 'IN_SERVICE')),
  finishService: (id: string) => delay(transitionAppointment(id, 'PENDING_SETTLEMENT')),
  completeSettlement: (id: string) => delay(transitionAppointment(id, 'COMPLETED'))
};
