import { Progress, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminRemoteApi } from '@/services/remote';
import type { BusinessReportRow } from '@/types';

const columns: ColumnsType<BusinessReportRow> = [
  { title: '门店', dataIndex: 'store' },
  { title: '预约数', dataIndex: 'bookingCount', render: (value: number) => `${value} 单` },
  { title: '完成率', dataIndex: 'completionRate', render: (value: number) => <Progress percent={value} size="small" strokeColor="#5d806d" /> },
  { title: '营业额', dataIndex: 'revenue', render: (value: number) => `¥${value.toLocaleString()}` },
  { title: '客单价', dataIndex: 'averageTicket', render: (value: number) => `¥${value}` },
  { title: '热门项目', dataIndex: 'topService', render: (value: string | null) => value || '-' }
];

export default function ReportsPage() {
  const [data, setData] = useState<BusinessReportRow[]>([]);
  useEffect(() => {
    adminRemoteApi.getBusinessReports().then(setData)
      .catch((error) => message.error(error instanceof Error ? error.message : '经营报表加载失败'));
  }, []);
  return <ManagementTablePage<BusinessReportRow>
    title="经营报表"
    description="查看统一品牌门店预约、完成率、营业额和热门项目，深度分析后续扩展。"
    dataSource={data}
    columns={columns}
    searchKeys={['store', 'topService']}
    rowTags={(record) => record.topService ? [record.topService] : []}
  />;
}
