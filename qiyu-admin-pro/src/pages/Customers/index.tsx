import { SearchOutlined } from '@ant-design/icons';
import { Input, message } from 'antd';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useEffect, useMemo, useState } from 'react';
import { adminRemoteApi } from '@/services/remote';
import { can, maskPhone, readAdminSession } from '@/services/admin-auth';
import type { CustomerProfile } from '@/types';
import { stringifyValue } from '@/utils/filter';

const searchKeys: Array<keyof CustomerProfile> = ['name', 'phone', 'memberLevel'];

export default function CustomersPage() {
  const session = readAdminSession();
  const [data, setData] = useState<CustomerProfile[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    adminRemoteApi.getCustomers().then(setData)
      .catch((error) => message.error(error instanceof Error ? error.message : '客户数据加载失败'))
      .finally(() => setLoading(false));
  }, []);
  const rows = useMemo(() => {
    const value = keyword.trim();
    return value ? data.filter((record) => searchKeys.some((key) => stringifyValue(record[key]).includes(value))) : data;
  }, [keyword, data]);
  const columns: ProColumns<CustomerProfile>[] = [
    { title: '客户', dataIndex: 'name' },
    { title: '手机号', dataIndex: 'phone', render: (_, record) => maskPhone(record.phone, session) },
    { title: '会员等级', dataIndex: 'memberLevel' },
    { title: '最近到店', dataIndex: 'lastVisitAt' },
    { title: '累计预约', dataIndex: 'totalBookings', render: (_, record) => `${record.totalBookings} 次` },
    ...(can(session, 'finance:view') ? [{ title: '累计消费', dataIndex: 'totalSpend', render: (_: unknown, record: CustomerProfile) => `¥${record.totalSpend}` } as ProColumns<CustomerProfile>] : [])
  ];
  return (
    <PageContainer header={{ title: '客户管理', subTitle: '查看客户预约历史、消费概况和会员等级，支撑门店服务跟进。' }}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索客户、手机号或会员等级" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </div>
        <ProTable<CustomerProfile> rowKey="id" loading={loading} columns={columns} dataSource={rows} search={false} scroll={{ x: 900 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 位客户` }} />
      </ProCard>
    </PageContainer>
  );
}
