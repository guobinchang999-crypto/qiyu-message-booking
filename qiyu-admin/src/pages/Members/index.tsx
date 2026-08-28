import { message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import { adminRemoteApi } from '@/services/remote';
import { adminApiConfig } from '@/services/config';
import type { MemberAccount } from '@/types';

const columns: ColumnsType<MemberAccount> = [
  { title: '客户', dataIndex: 'customerName' },
  { title: '等级', dataIndex: 'level' },
  { title: '余额', dataIndex: 'balance', render: (value: number) => `¥${value}` },
  { title: '套餐余量', dataIndex: 'packageBalance', render: (value: number) => `${value} 次` },
  { title: '优惠券', dataIndex: 'couponCount', render: (value: number) => `${value} 张` },
  { title: '权益范围', dataIndex: 'scope' }
];

export default function MembersPage() {
  const [data, setData] = useState<MemberAccount[]>([]);
  useEffect(() => { (adminApiConfig.mode === 'mock' ? adminMockApi.getMembers() : adminRemoteApi.getMembers()).then(setData).catch((error) => message.error(error instanceof Error ? error.message : '会员数据加载失败')); }, []);
  return <ManagementTablePage<MemberAccount>
    title="会员管理"
    description="会员余额、套餐权益和优惠券均以全门店通用语义展示。"
    dataSource={data}
    columns={columns}
    searchKeys={['customerName', 'level', 'scope']}
    rowTags={(record) => [record.scope, record.level]}
  />;
}
