import { Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import { adminRemoteApi } from '@/services/remote';
import { adminApiConfig } from '@/services/config';
import type { CouponCampaign } from '@/types';

const columns: ColumnsType<CouponCampaign> = [
  { title: '券名称', dataIndex: 'name' },
  { title: '优惠', dataIndex: 'discount' },
  { title: '适用范围', dataIndex: 'scope' },
  { title: '有效期至', dataIndex: 'validUntil' },
  { title: '发放', dataIndex: 'issuedCount', render: (value: number) => `${value} 张` },
  { title: '已使用', dataIndex: 'usedCount', render: (value: number) => `${value} 张` },
  { title: '状态', dataIndex: 'status', render: (status: CouponCampaign['status']) => <Tag color={status === '投放中' ? 'green' : status === '草稿' ? 'blue' : 'default'}>{status}</Tag> }
];

export default function CouponsPage() {
  const [data, setData] = useState<CouponCampaign[]>([]);
  useEffect(() => { (adminApiConfig.mode === 'mock' ? adminMockApi.getCoupons() : adminRemoteApi.getCoupons()).then(setData).catch((error) => message.error(error instanceof Error ? error.message : '优惠券数据加载失败')); }, []);
  return <ManagementTablePage<CouponCampaign>
    title="优惠券"
    description="维护优惠券投放和核销统计，当前仅保留 Mock 入口，不接入真实营销规则。"
    dataSource={data}
    columns={columns}
    searchKeys={['name', 'discount', 'scope', 'status']}
    primaryActionText="创建优惠券"
    rowTags={(record) => [record.scope, record.status]}
  />;
}
