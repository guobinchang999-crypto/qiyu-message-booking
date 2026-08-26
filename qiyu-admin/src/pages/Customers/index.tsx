import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import type { CustomerProfile } from '@/types';

const columns: ColumnsType<CustomerProfile> = [
  { title: '客户', dataIndex: 'name' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '会员等级', dataIndex: 'memberLevel' },
  { title: '最近到店', dataIndex: 'lastVisitAt' },
  { title: '累计预约', dataIndex: 'totalBookings', render: (value: number) => `${value} 次` },
  { title: '累计消费', dataIndex: 'totalSpend', render: (value: number) => `¥${value}` }
];

export default function CustomersPage() {
  const [data, setData] = useState<CustomerProfile[]>([]);
  useEffect(() => { adminMockApi.getCustomers().then(setData); }, []);
  return <ManagementTablePage<CustomerProfile>
    title="客户管理"
    description="查看客户预约历史、消费概况和会员等级，支撑门店服务跟进。"
    dataSource={data}
    columns={columns}
    searchKeys={['name', 'phone', 'memberLevel']}
    rowTags={(record) => [record.memberLevel]}
  />;
}
