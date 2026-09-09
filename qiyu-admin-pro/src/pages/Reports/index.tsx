import { SearchOutlined } from '@ant-design/icons';
import { Input, Progress, message } from 'antd';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useEffect, useMemo, useState } from 'react';
import { adminRemoteApi } from '@/services/remote';
import type { BusinessReportRow } from '@/types';
import { stringifyValue } from '@/utils/filter';
import { QIYU_PRIMARY } from '@/theme';

const searchKeys: Array<keyof BusinessReportRow> = ['store', 'topService'];

export default function ReportsPage() {
  const [data, setData] = useState<BusinessReportRow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    adminRemoteApi.getBusinessReports().then(setData)
      .catch((error) => message.error(error instanceof Error ? error.message : '经营报表加载失败'))
      .finally(() => setLoading(false));
  }, []);
  const rows = useMemo(() => {
    const value = keyword.trim();
    return value ? data.filter((record) => searchKeys.some((key) => stringifyValue(record[key]).includes(value))) : data;
  }, [keyword, data]);
  const columns: ProColumns<BusinessReportRow>[] = [
    { title: '门店', dataIndex: 'store' },
    { title: '预约数', dataIndex: 'bookingCount', render: (_, record) => `${record.bookingCount} 单` },
    { title: '完成率', dataIndex: 'completionRate', render: (_, record) => <Progress percent={record.completionRate} size="small" strokeColor={QIYU_PRIMARY} /> },
    { title: '营业额', dataIndex: 'revenue', render: (_, record) => `¥${record.revenue.toLocaleString()}` },
    { title: '客单价', dataIndex: 'averageTicket', render: (_, record) => `¥${record.averageTicket}` },
    { title: '热门项目', dataIndex: 'topService', render: (_, record) => record.topService || '-' }
  ];
  return (
    <PageContainer header={{ title: '经营报表', subTitle: '查看统一品牌门店预约、完成率、营业额和热门项目，深度分析后续扩展。' }}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索门店或热门项目" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </div>
        <ProTable<BusinessReportRow> rowKey="id" loading={loading} columns={columns} dataSource={rows} search={false} scroll={{ x: 900 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }} />
      </ProCard>
    </PageContainer>
  );
}
