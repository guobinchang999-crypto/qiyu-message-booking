import { Tag } from 'antd';
import { statusText } from '@/mock/data';
import type { BookingStatus } from '@/types';

const colorMap: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'gold', BOOKED: 'blue', CHECKED_IN: 'cyan', WAITING_SERVICE: 'geekblue',
  IN_SERVICE: 'processing', PENDING_SETTLEMENT: 'orange', COMPLETED: 'green', CANCELLED: 'default'
};

export default function BookingStatusTag({ status }: { status: BookingStatus }) {
  return <Tag color={colorMap[status]}>{statusText[status]}</Tag>;
}
