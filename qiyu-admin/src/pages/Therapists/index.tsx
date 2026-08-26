import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import type { TherapistProfile } from '@/types';

const columns: ColumnsType<TherapistProfile> = [
  { title: '技师', dataIndex: 'name' },
  { title: '所属门店', dataIndex: 'store' },
  { title: '等级', dataIndex: 'level' },
  { title: '擅长项目', dataIndex: 'skills', render: (skills: string[]) => skills.map((skill) => <Tag key={skill}>{skill}</Tag>) },
  { title: '状态', dataIndex: 'status', render: (status: TherapistProfile['status']) => <Tag color={status === '可预约' ? 'green' : status === '服务中' ? 'blue' : 'orange'}>{status}</Tag> },
  { title: '评分', dataIndex: 'rating' },
  { title: '今日预约', dataIndex: 'todayBookings', render: (value: number) => `${value} 单` }
];

export default function TherapistsPage() {
  const [data, setData] = useState<TherapistProfile[]>([]);
  useEffect(() => { adminMockApi.getTherapists().then(setData); }, []);
  return <ManagementTablePage<TherapistProfile>
    title="技师管理"
    description="统一维护技师状态、技能标签、所属门店和今日预约负载。"
    dataSource={data}
    columns={columns}
    searchKeys={['name', 'store', 'level', 'skills']}
    primaryActionText="新增技师"
    rowTags={(record) => [record.store, record.status]}
  />;
}
