import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import type { ServiceCatalogItem } from '@/types';

const columns: ColumnsType<ServiceCatalogItem> = [
  { title: '项目名称', dataIndex: 'name' },
  { title: '分类', dataIndex: 'category' },
  { title: '时长', dataIndex: 'durationMinutes', render: (value: number) => `${value} 分钟` },
  { title: '标准价', dataIndex: 'price', render: (value: number) => `¥${value}` },
  { title: '会员价', dataIndex: 'memberPrice', render: (value: number) => `¥${value}` },
  { title: '状态', dataIndex: 'status', render: (status: ServiceCatalogItem['status']) => <Tag color={status === '上架' ? 'green' : 'default'}>{status}</Tag> },
  { title: '累计预约', dataIndex: 'bookingCount', render: (value: number) => `${value} 次` }
];

export default function ServicesPage() {
  const [data, setData] = useState<ServiceCatalogItem[]>([]);
  useEffect(() => { adminMockApi.getServiceCatalog().then(setData); }, []);
  return <ManagementTablePage<ServiceCatalogItem>
    title="服务项目"
    description="维护项目时长、价格、会员价和上下架状态，客户端预约使用同一项目语义。"
    dataSource={data}
    columns={columns}
    searchKeys={['name', 'category', 'status']}
    primaryActionText="新增项目"
    rowTags={(record) => [record.category, record.status]}
  />;
}
