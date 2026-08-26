import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import type { StoreProfile } from '@/types';

const columns: ColumnsType<StoreProfile> = [
  { title: '门店', dataIndex: 'name' },
  { title: '地址', dataIndex: 'address', ellipsis: true },
  { title: '店长', dataIndex: 'manager' },
  { title: '营业时间', dataIndex: 'businessHours' },
  { title: '房间', dataIndex: 'roomCount', render: (value: number) => `${value} 间` },
  { title: '技师', dataIndex: 'therapistCount', render: (value: number) => `${value} 人` },
  { title: '状态', dataIndex: 'status', render: (value: StoreProfile['status']) => <Tag color={value === '营业中' ? 'green' : 'default'}>{value}</Tag> }
];

export default function StoresPage() {
  const [data, setData] = useState<StoreProfile[]>([]);
  useEffect(() => { adminMockApi.getStores().then(setData); }, []);
  return <ManagementTablePage<StoreProfile>
    title="门店管理"
    description="统一维护品牌门店基础信息、营业时间、房间与技师规模。"
    dataSource={data}
    columns={columns}
    searchKeys={['name', 'address', 'manager']}
    primaryActionText="新增门店"
    drawerTitle="门店详情"
    rowTags={(record) => [record.status, record.businessHours]}
  />;
}
