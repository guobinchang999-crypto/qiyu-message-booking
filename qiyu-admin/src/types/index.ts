export type BookingStatus = 'PENDING_PAYMENT' | 'BOOKED' | 'CHECKED_IN' | 'WAITING_SERVICE' | 'IN_SERVICE' | 'PENDING_SETTLEMENT' | 'COMPLETED' | 'CANCELLED';
export type RoomStatus = 'FREE' | 'BOOKED' | 'IN_USE' | 'CLEANING';

export interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  store: string;
  service: string;
  therapist: string;
  room: string;
  scheduledAt: string;
  status: BookingStatus;
  amount: number;
}

export interface AppointmentConflict {
  field: 'therapist' | 'room' | 'scheduledAt';
  message: string;
  appointmentId: string;
}

export interface AppointmentConflictResult {
  hasConflict: boolean;
  conflicts: AppointmentConflict[];
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface BookingOptionPayload {
  stores: SelectOption[];
  services: SelectOption[];
  therapists: SelectOption[];
  rooms: SelectOption[];
  statuses: SelectOption[];
}

export interface RoomResource {
  id: string;
  name: string;
  type: string;
  status: RoomStatus;
  customer?: string;
  therapist?: string;
  nextTime: string;
}

export interface ScheduleRow {
  therapist: string;
  skill: string;
  slots: Array<{ day: string; kind: 'WORK' | 'BOOKED' | 'LEAVE' | 'REST'; label: string }>;
}

export interface StoreProfile {
  id: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  businessHours: string;
  roomCount: number;
  therapistCount: number;
  status: '营业中' | '休息中';
}

export interface TherapistProfile {
  id: string;
  name: string;
  store: string;
  level: string;
  skills: string[];
  status: '可预约' | '服务中' | '休假';
  rating: number;
  todayBookings: number;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  memberPrice: number;
  status: '上架' | '下架';
  bookingCount: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  memberLevel: string;
  lastVisitAt: string;
  totalBookings: number;
  totalSpend: number;
}

export interface MemberAccount {
  id: string;
  customerName: string;
  level: string;
  balance: number;
  packageBalance: number;
  couponCount: number;
  scope: '全门店通用';
}

export interface CouponCampaign {
  id: string;
  name: string;
  discount: string;
  scope: '全门店通用';
  validUntil: string;
  issuedCount: number;
  usedCount: number;
  status: '投放中' | '已结束' | '草稿';
}

export interface CheckinTask {
  id: string;
  code: string;
  customerName: string;
  store: string;
  service: string;
  scheduledAt: string;
  status: BookingStatus;
}

export interface ServiceOrder {
  id: string;
  bookingId: string;
  customerName: string;
  store: string;
  service: string;
  therapist: string;
  room: string;
  status: BookingStatus;
  paidAmount: number;
}

export interface AppointmentAuditRecord {
  id: string;
  appointmentId: string;
  action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED';
  fromStatus?: BookingStatus;
  toStatus?: BookingStatus;
  operator: string;
  detail: string;
  createdAt: string;
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
