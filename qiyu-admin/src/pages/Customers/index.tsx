import { message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminRemoteApi } from '@/services/remote';
import { can, maskPhone, readAdminSession } from '@/services/admin-auth';
import type { CustomerProfile } from '@/types';

export default function CustomersPage() {
  const session = readAdminSession();
  const [data, setData] = useState<CustomerProfile[]>([]);
  useEffect(() => {
    adminRemoteApi.getCustomers().then(setData)
      .catch((error) => message.error(error instanceof Error ? error.message : '客户数据加载失败'));
  }, []);
  const columns: ColumnsType<CustomerProfile> = [
    { title: '客户', dataIndex: 'name' },
    { title: '手机号', dataIndex: 'phone', render: (value: string) => maskPhone(value, session) },
    { title: '会员等级', dataIndex: 'memberLevel' },
    { title: '最近到店', dataIndex: 'lastVisitAt' },
    { title: '累计预约', dataIndex: 'totalBookings', render: (value: number) => `${value} 次` },
    ...(can(session, 'finance:view') ? [{ title: '累计消费', dataIndex: 'totalSpend', render: (value: number) => `¥${value}` }] : [])
  ];
  return <ManagementTablePage<CustomerProfile>
    title="客户管理"
    description="查看客户预约历史、消费概况和会员等级，支撑门店服务跟进。"
    dataSource={data}
    columns={columns}
    searchKeys={['name', 'phone', 'memberLevel']}
    rowTags={(record) => [record.memberLevel]}
  />;
}
