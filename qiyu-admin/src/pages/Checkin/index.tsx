import { Button, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import BookingStatusTag from '@/components/BookingStatusTag';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminMockApi } from '@/services/mock';
import { adminRemoteApi } from '@/services/remote';
import { adminApiConfig } from '@/services/config';
import { can, canAccessStore, readAdminSession } from '@/services/admin-auth';
import type { CheckinTask } from '@/types';

export default function CheckinPage() {
  const session = readAdminSession();
  const [data, setData] = useState<CheckinTask[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const isMock = adminApiConfig.mode === 'mock';
  const reload = async () => setData((await (isMock ? adminMockApi.getCheckinTasks() : adminRemoteApi.getCheckinTasks())).filter((item) => canAccessStore(session, 'booking', 'CHECKIN', item.store)));
  useEffect(() => { reload(); }, [isMock]);
  const checkIn = async (record: CheckinTask) => {
    if (isMock) await adminMockApi.checkInAppointment(record.id); else await adminRemoteApi.transitionAppointment(record.id, 'checkin');
    await reload();
    message.success('客户已签到');
  };
  const markWaiting = async (record: CheckinTask) => {
    if (isMock) await adminMockApi.markWaitingService(record.id); else await adminRemoteApi.transitionAppointment(record.id, 'start-service');
    await reload();
    message.success('已安排进入待服务');
  };
  const batchCheckIn = async () => {
    await Promise.all(selectedRowKeys.map((key) => isMock ? adminMockApi.checkInAppointment(String(key)) : adminRemoteApi.transitionAppointment(String(key), 'checkin')));
    setSelectedRowKeys([]);
    await reload();
    message.success(`已批量签到 ${selectedRowKeys.length} 位客户`);
  };
  const columns: ColumnsType<CheckinTask> = [
    { title: '核销码', dataIndex: 'code' },
    { title: '客户', dataIndex: 'customerName' },
    { title: '门店', dataIndex: 'store' },
    { title: '服务项目', dataIndex: 'service' },
    { title: '预约时间', dataIndex: 'scheduledAt' },
    { title: '状态', dataIndex: 'status', render: (status) => <BookingStatusTag status={status} /> },
    { title: '核销', key: 'checkin', render: (_, record) => <Space>{can(session, 'booking:checkin') && <Button size="small" type="primary" disabled={record.status !== 'BOOKED'} onClick={() => checkIn(record)}>确认签到</Button>}{can(session, 'booking:update') && <Button size="small" disabled={record.status !== 'CHECKED_IN'} onClick={() => markWaiting(record)}>安排待服务</Button>}</Space> }
  ];
  return <ManagementTablePage<CheckinTask>
    title="到店核销"
    description="前台按核销码确认客户到店，签到后进入待服务履约流程。"
    dataSource={data}
    toolbar={can(session, 'booking:checkin') ? <Button type="primary" disabled={!selectedRowKeys.length} onClick={batchCheckIn}>批量签到</Button> : undefined}
    rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, getCheckboxProps: (record) => ({ disabled: record.status !== 'BOOKED' }) }}
    columns={columns}
    searchKeys={['code', 'customerName', 'store', 'service']}
    rowTags={(record) => [record.store]}
  />;
}
