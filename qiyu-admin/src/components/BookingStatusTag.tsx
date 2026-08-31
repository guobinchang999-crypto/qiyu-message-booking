import { Tag } from 'antd';
import type { BookingStatus } from '@/types';

const colorMap: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'gold', BOOKED: 'blue', CHECKED_IN: 'cyan', WAITING_SERVICE: 'geekblue',
  IN_SERVICE: 'processing', PENDING_SETTLEMENT: 'orange', COMPLETED: 'green', CANCELLED: 'default'
};

export default function BookingStatusTag({ status, label }: { status: BookingStatus; label?: string }) {
  return <Tag color={colorMap[status]}>{label || status}</Tag>;
}
