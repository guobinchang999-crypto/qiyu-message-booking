import { Button, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import BookingStatusTag from '@/components/BookingStatusTag';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminRemoteApi } from '@/services/remote';
import { can, canAccessStore, readAdminSession } from '@/services/admin-auth';
import type { CheckinTask } from '@/types';

export default function CheckinPage() {
  const session = readAdminSession();
  const [data, setData] = useState<CheckinTask[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const reload = async () => setData((await adminRemoteApi.getCheckinTasks())
    .filter((item) => canAccessStore(session, 'booking', 'CHECKIN', item.storeId || item.store)));
  useEffect(() => { void reload(); }, []);
  const withBusy = async (id: string, action: () => Promise<void>) => {
    if (busyIds.has(id)) return;
    setBusyIds((current) => new Set(current).add(id));
    try {
      await action();
      await reload();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败，请重试');
    } finally {
      setBusyIds((current) => { const next = new Set(current); next.delete(id); return next; });
    }
  };
  const checkIn = (record: CheckinTask) => withBusy(record.id, async () => {
    await adminRemoteApi.transitionAppointment(record.id, 'checkin');
    message.success('客户已签到');
  });
  const startService = (record: CheckinTask) => withBusy(record.id, async () => {
    await adminRemoteApi.transitionAppointment(record.id, 'start-service');
    message.success('服务已开始');
  });
  const batchCheckIn = async () => {
    if (batchBusy || !selectedRowKeys.length) return;
    setBatchBusy(true);
    const ids = [...selectedRowKeys];
    let failed = 0;
    for (const key of ids) {
      try {
        await adminRemoteApi.transitionAppointment(String(key), 'checkin');
      } catch {
        failed += 1;
      }
    }
    setSelectedRowKeys([]);
    setBatchBusy(false);
    await reload();
    if (failed === 0) message.success(`已批量签到 ${ids.length} 位客户`);
    else message.warning(`签到完成，${failed} 位失败请重试`);
  };
  const columns: ColumnsType<CheckinTask> = [
    { title: '核销码', dataIndex: 'code' },
    { title: '客户', dataIndex: 'customerName' },
    { title: '门店', dataIndex: 'store' },
    { title: '服务项目', dataIndex: 'service' },
    { title: '预约时间', dataIndex: 'scheduledAt' },
    { title: '状态', dataIndex: 'status', render: (status, record) => <BookingStatusTag status={status} label={record.statusLabel} /> },
    { title: '核销', key: 'checkin', render: (_, record) => <Space>{can(session, 'booking:checkin') && <Button size="small" type="primary" loading={busyIds.has(record.id)} disabled={record.status !== 'BOOKED'} onClick={() => checkIn(record)}>确认签到</Button>}{can(session, 'booking:update') && <Button size="small" loading={busyIds.has(record.id)} disabled={record.status !== 'CHECKED_IN'} onClick={() => startService(record)}>开始服务</Button>}</Space> }
  ];
  return <ManagementTablePage<CheckinTask>
    title="到店核销"
    description="前台按核销码确认客户到店，签到后进入待服务履约流程。"
    dataSource={data}
    toolbar={can(session, 'booking:checkin') ? <Button type="primary" loading={batchBusy} disabled={!selectedRowKeys.length || batchBusy} onClick={batchCheckIn}>批量签到</Button> : undefined}
    rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, getCheckboxProps: (record) => ({ disabled: record.status !== 'BOOKED' }) }}
    columns={columns}
    searchKeys={['code', 'customerName', 'store', 'service']}
    rowTags={(record) => [record.store]}
  />;
}
