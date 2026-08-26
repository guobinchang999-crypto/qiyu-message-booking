import type {
  Appointment,
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

export const statusText: Record<BookingStatus, string> = {
  PENDING_PAYMENT: '待支付', BOOKED: '已预约', CHECKED_IN: '已签到', WAITING_SERVICE: '待服务',
  IN_SERVICE: '服务中', PENDING_SETTLEMENT: '待结算', COMPLETED: '已完成', CANCELLED: '已取消'
};

export const stores = ['静安寺店', '徐家汇店', '陆家嘴店'];
export const therapists = ['林知夏', '沈安然', '周语宁', '陈念'];
export const serviceNames = ['肩颈舒缓', '中式推拿', '精油 SPA'];

export const appointments: Appointment[] = [
  { id: 'QY20260804001', customerName: '张女士', phone: '138****2231', store: '静安寺店', service: '肩颈舒缓 60分钟', therapist: '林知夏', room: '静心房 01', scheduledAt: '2026-08-04 10:00', status: 'CHECKED_IN', amount: 198 },
  { id: 'QY20260804002', customerName: '王先生', phone: '139****6782', store: '徐家汇店', service: '中式推拿 90分钟', therapist: '沈安然', room: '调和房 02', scheduledAt: '2026-08-04 10:30', status: 'IN_SERVICE', amount: 298 },
  { id: 'QY20260804003', customerName: '李女士', phone: '136****3019', store: '静安寺店', service: '精油 SPA 90分钟', therapist: '周语宁', room: '芳疗房 01', scheduledAt: '2026-08-04 13:30', status: 'BOOKED', amount: 398 },
  { id: 'QY20260804004', customerName: '陈先生', phone: '137****8802', store: '陆家嘴店', service: '肩颈舒缓 60分钟', therapist: '陈念', room: '静心房 03', scheduledAt: '2026-08-04 14:00', status: 'PENDING_PAYMENT', amount: 198 },
  { id: 'QY20260803021', customerName: '赵女士', phone: '135****2918', store: '徐家汇店', service: '中式推拿 90分钟', therapist: '林知夏', room: '调和房 01', scheduledAt: '2026-08-03 18:30', status: 'COMPLETED', amount: 298 },
  { id: 'QY20260803018', customerName: '孙女士', phone: '186****2006', store: '静安寺店', service: '精油 SPA 90分钟', therapist: '沈安然', room: '芳疗房 02', scheduledAt: '2026-08-03 16:00', status: 'CANCELLED', amount: 398 }
];

export const roomResources: RoomResource[] = [
  { id: 'r1', name: '静心房 01', type: '单人理疗房', status: 'IN_USE', customer: '王女士', therapist: '林知夏', nextTime: '12:00' },
  { id: 'r2', name: '静心房 02', type: '单人理疗房', status: 'FREE', nextTime: '14:30' },
  { id: 'r3', name: '调和房 01', type: '双人理疗房', status: 'BOOKED', customer: '李女士', therapist: '周语宁', nextTime: '13:30' },
  { id: 'r4', name: '芳疗房 01', type: '精油 SPA 房', status: 'CLEANING', therapist: '沈安然', nextTime: '11:30' },
  { id: 'r5', name: '芳疗房 02', type: '精油 SPA 房', status: 'FREE', nextTime: '15:00' },
  { id: 'r6', name: '静心房 03', type: '单人理疗房', status: 'BOOKED', customer: '陈先生', therapist: '陈念', nextTime: '14:00' }
];

const week = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const scheduleRows: ScheduleRow[] = therapists.map((therapist, therapistIndex) => ({
  therapist, skill: therapistIndex % 2 === 0 ? '推拿 / 肩颈' : '精油 / SPA',
  slots: week.map((day, dayIndex) => ({
    day,
    kind: dayIndex === 2 && therapistIndex === 2 ? 'LEAVE' : dayIndex === 6 ? 'REST' : (dayIndex + therapistIndex) % 3 === 0 ? 'BOOKED' : 'WORK',
    label: dayIndex === 2 && therapistIndex === 2 ? '请假' : dayIndex === 6 ? '休息' : (dayIndex + therapistIndex) % 3 === 0 ? '已预约 3 单' : '10:00–20:00'
  }))
}));

export const storeProfiles: StoreProfile[] = [
  { id: 'store-jingan', name: '静安寺店', address: '上海市静安区愚园路 168 号', manager: '顾清', phone: '021-6000 1001', businessHours: '10:00-22:00', roomCount: 8, therapistCount: 12, status: '营业中' },
  { id: 'store-xujiahui', name: '徐家汇店', address: '上海市徐汇区天钥桥路 328 号', manager: '沈岚', phone: '021-6000 1002', businessHours: '10:00-22:00', roomCount: 7, therapistCount: 10, status: '营业中' },
  { id: 'store-lujiazui', name: '陆家嘴店', address: '上海市浦东新区世纪大道 88 号', manager: '许宁', phone: '021-6000 1003', businessHours: '11:00-22:30', roomCount: 6, therapistCount: 9, status: '营业中' }
];

export const therapistProfiles: TherapistProfile[] = [
  { id: 'th-001', name: '林知夏', store: '静安寺店', level: '高级技师', skills: ['肩颈舒缓', '中式推拿'], status: '可预约', rating: 4.9, todayBookings: 7 },
  { id: 'th-002', name: '沈安然', store: '徐家汇店', level: '资深技师', skills: ['精油 SPA', '中式推拿'], status: '服务中', rating: 4.8, todayBookings: 6 },
  { id: 'th-003', name: '周语宁', store: '静安寺店', level: '专业技师', skills: ['肩颈舒缓'], status: '休假', rating: 4.7, todayBookings: 2 },
  { id: 'th-004', name: '陈念', store: '陆家嘴店', level: '高级技师', skills: ['中式推拿', '精油 SPA'], status: '可预约', rating: 4.9, todayBookings: 5 }
];

export const serviceCatalog: ServiceCatalogItem[] = [
  { id: 'svc-neck', name: '肩颈舒缓', category: '调理', durationMinutes: 60, price: 198, memberPrice: 178, status: '上架', bookingCount: 3280 },
  { id: 'svc-tuina', name: '中式推拿', category: '推拿', durationMinutes: 90, price: 298, memberPrice: 268, status: '上架', bookingCount: 1890 },
  { id: 'svc-spa', name: '精油 SPA', category: 'SPA', durationMinutes: 90, price: 398, memberPrice: 358, status: '上架', bookingCount: 960 }
];

export const customerProfiles: CustomerProfile[] = [
  { id: 'cus-001', name: '张女士', phone: '138****2231', memberLevel: '栖愈金卡', lastVisitAt: '2026-08-04', totalBookings: 12, totalSpend: 2860 },
  { id: 'cus-002', name: '王先生', phone: '139****6782', memberLevel: '栖愈银卡', lastVisitAt: '2026-08-04', totalBookings: 8, totalSpend: 1880 },
  { id: 'cus-003', name: '赵女士', phone: '135****2918', memberLevel: '栖愈金卡', lastVisitAt: '2026-08-03', totalBookings: 16, totalSpend: 4380 }
];

export const memberAccounts: MemberAccount[] = [
  { id: 'mem-001', customerName: '张女士', level: '栖愈金卡', balance: 680, packageBalance: 2, couponCount: 3, scope: '全门店通用' },
  { id: 'mem-002', customerName: '王先生', level: '栖愈银卡', balance: 320, packageBalance: 1, couponCount: 1, scope: '全门店通用' },
  { id: 'mem-003', customerName: '赵女士', level: '栖愈金卡', balance: 1280, packageBalance: 4, couponCount: 2, scope: '全门店通用' }
];

export const couponCampaigns: CouponCampaign[] = [
  { id: 'coupon-001', name: '新人体验券', discount: '满198减20', scope: '全门店通用', validUntil: '2026-09-30', issuedCount: 1200, usedCount: 386, status: '投放中' },
  { id: 'coupon-002', name: '工作日舒缓券', discount: '满298减30', scope: '全门店通用', validUntil: '2026-08-31', issuedCount: 800, usedCount: 214, status: '投放中' },
  { id: 'coupon-003', name: '会员复购礼', discount: '满398减50', scope: '全门店通用', validUntil: '2026-07-31', issuedCount: 500, usedCount: 318, status: '已结束' }
];

export const checkinTasks: CheckinTask[] = appointments
  .filter((appointment) => ['BOOKED', 'CHECKED_IN', 'WAITING_SERVICE'].includes(appointment.status))
  .map((appointment, index) => ({
    id: appointment.id,
    code: `8${index + 2}6${index + 4}1${index + 6}`,
    customerName: appointment.customerName,
    store: appointment.store,
    service: appointment.service,
    scheduledAt: appointment.scheduledAt,
    status: appointment.status
  }));

export const serviceOrders: ServiceOrder[] = appointments.map((appointment) => ({
  id: `SO-${appointment.id.slice(-5)}`,
  bookingId: appointment.id,
  customerName: appointment.customerName,
  store: appointment.store,
  service: appointment.service,
  therapist: appointment.therapist,
  room: appointment.room,
  status: appointment.status,
  paidAmount: appointment.amount
}));

export const businessReports: BusinessReportRow[] = [
  { id: 'report-jingan', store: '静安寺店', bookingCount: 32, completionRate: 94, revenue: 9820, averageTicket: 307, topService: '肩颈舒缓' },
  { id: 'report-xujiahui', store: '徐家汇店', bookingCount: 27, completionRate: 91, revenue: 8040, averageTicket: 298, topService: '中式推拿' },
  { id: 'report-lujiazui', store: '陆家嘴店', bookingCount: 20, completionRate: 88, revenue: 6000, averageTicket: 300, topService: '精油 SPA' }
];
