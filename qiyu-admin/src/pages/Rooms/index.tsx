import { Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import { adminApiConfig } from '@/services/config';
import { adminRemoteApi } from '@/services/remote';
import type { RoomResource, RoomStatus } from '@/types';

const statusText: Record<RoomStatus, string> = { FREE: '空闲', BOOKED: '已预约', IN_USE: '使用中', CLEANING: '清洁中' };
const statusColor: Record<RoomStatus, string> = { FREE: 'green', BOOKED: 'blue', IN_USE: 'processing', CLEANING: 'orange' };
const columns: ColumnsType<RoomResource> = [
  { title: '房间', dataIndex: 'name' },
  { title: '用途', dataIndex: 'type' },
  { title: '状态', dataIndex: 'status', render: (status: RoomStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag> },
  { title: '客户', dataIndex: 'customer', render: (value?: string) => value ?? '可安排' },
  { title: '技师', dataIndex: 'therapist', render: (value?: string) => value ?? '-' },
  { title: '下一时段', dataIndex: 'nextTime' }
];

export default function RoomsPage() {
  const [data, setData] = useState<RoomResource[]>([]);
  useEffect(() => { (adminApiConfig.mode === 'mock' ? adminMockApi.getRooms() : adminRemoteApi.getRooms()).then(setData).catch((error) => message.error(error instanceof Error ? error.message : '房间数据加载失败')); }, []);
  return <ManagementTablePage<RoomResource>
    title="房间管理"
    description="查看房间空闲、占用、服务中和清洁中状态，用于预约资源分配。"
    dataSource={data}
    columns={columns}
    searchKeys={['name', 'type', 'customer', 'therapist']}
    rowTags={(record) => [statusText[record.status]]}
  />;
}
