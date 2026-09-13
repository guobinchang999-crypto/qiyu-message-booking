import type { BookingStatus } from '@/types';
export const statusLabels: Record<BookingStatus,string> = {
  PENDING_PAYMENT: '待支付', BOOKED: '待到店', CHECKED_IN: '已签到', WAITING_SERVICE: '待服务',
  IN_SERVICE: '服务中', PENDING_SETTLEMENT: '待结算', COMPLETED: '已完成', CANCELLED: '已取消'
};
export const actionLabels: Record<string,string> = { checkin: '确认到店', 'start-service': '开始服务', 'finish-service': '完成服务', settle: '确认结算', cancel: '取消预约', reschedule: '改期', therapist: '换技师', room: '换房间' };
export const primaryActions = ['checkin', 'start-service', 'finish-service', 'settle'];
export const receptionStages = [
  { key: 'BOOKED', label: '待到店', statuses: ['BOOKED'] },
  { key: 'CHECKED_IN,WAITING_SERVICE', label: '待服务', statuses: ['CHECKED_IN','WAITING_SERVICE'] },
  { key: 'IN_SERVICE', label: '服务中', statuses: ['IN_SERVICE'] },
  { key: 'PENDING_SETTLEMENT', label: '待结算', statuses: ['PENDING_SETTLEMENT'] }
];
export const money = (value: number | undefined | null) => value == null ? '—' : '¥' + Number(value).toFixed(2);
export const errorText = (error: unknown) => error instanceof Error ? error.message : '操作失败，请稍后重试';
