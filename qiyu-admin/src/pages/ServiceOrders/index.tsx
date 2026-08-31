import { Button, Drawer, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import BookingStatusTag from '@/components/BookingStatusTag';
import ManagementTablePage from '@/components/ManagementTablePage';
import { adminRemoteApi } from '@/services/remote';
import type { AppointmentAuditRecord, ServiceOrder } from '@/types';

export default function ServiceOrdersPage() {
  const [data, setData] = useState<ServiceOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AppointmentAuditRecord[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const reload = async () => setData(await adminRemoteApi.getServiceOrders());
  useEffect(() => { void reload(); }, []);
  const runAction = async (bookingId: string, messageText: string, action: () => Promise<void>) => {
    if (busyIds.has(bookingId)) return;
    setBusyIds((current) => new Set(current).add(bookingId));
    try {
      await action();
      await reload();
      message.success(messageText);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败，请重试');
    } finally {
      setBusyIds((current) => { const next = new Set(current); next.delete(bookingId); return next; });
    }
  };
  const startService = (record: ServiceOrder) => runAction(record.bookingId, '服务已开始，房间状态已更新为使用中', () =>
    adminRemoteApi.transitionAppointment(record.bookingId, 'start-service'));
  const finishService = (record: ServiceOrder) => runAction(record.bookingId, '服务已完成，订单进入待结算', () =>
    adminRemoteApi.transitionAppointment(record.bookingId, 'finish-service'));
  const completeSettlement = (record: ServiceOrder) => runAction(record.bookingId, '结算已完成，房间资源已释放', () =>
    adminRemoteApi.transitionAppointment(record.bookingId, 'settle'));
  const openAudit = async (record: ServiceOrder) => {
    setAuditLogs(await adminRemoteApi.getAppointmentAuditLogs(record.bookingId));
    setAuditOpen(true);
  };
  const columns: ColumnsType<ServiceOrder> = [
    { title: '服务单号', dataIndex: 'id' },
    { title: '客户', dataIndex: 'customerName' },
    { title: '门店', dataIndex: 'store' },
    { title: '服务项目', dataIndex: 'service' },
    { title: '技师', dataIndex: 'therapist' },
    { title: '房间', dataIndex: 'room' },
    { title: '状态', dataIndex: 'status', render: (status, record) => <BookingStatusTag status={status} label={record.statusLabel} /> },
    { title: '实付', dataIndex: 'paidAmount', render: (value: number) => `¥${value}` },
    { title: '履约动作', key: 'flow', fixed: 'right', width: 300, render: (_, record) => <Space size={4} wrap><Button size="small" type="link" loading={busyIds.has(record.bookingId)} disabled={!['CHECKED_IN', 'WAITING_SERVICE'].includes(record.status)} onClick={() => startService(record)}>开始服务</Button><Button size="small" type="link" loading={busyIds.has(record.bookingId)} disabled={record.status !== 'IN_SERVICE'} onClick={() => finishService(record)}>完成服务</Button><Button size="small" type="link" loading={busyIds.has(record.bookingId)} disabled={record.status !== 'PENDING_SETTLEMENT'} onClick={() => completeSettlement(record)}>完成结算</Button><Button size="small" type="link" onClick={() => openAudit(record)}>操作记录</Button></Space> }
  ];
  return <>
    <ManagementTablePage<ServiceOrder>
      title="服务订单"
      description="跟踪服务开始、完成、待结算和已完成状态，保留支付与结算接口入口。"
      dataSource={data}
      columns={columns}
      searchKeys={['id', 'bookingId', 'customerName', 'store', 'service', 'therapist']}
      rowTags={(record) => [record.store]}
    />
    <Drawer title="操作记录" width={620} open={auditOpen} onClose={() => setAuditOpen(false)}>
      <Table<AppointmentAuditRecord>
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={auditLogs}
        columns={[
          { title: '时间', dataIndex: 'createdAt', width: 180 },
          { title: '操作人', dataIndex: 'operator', width: 110 },
          { title: '动作', dataIndex: 'detail' },
          { title: '状态变化', key: 'status', render: (_, record) => record.fromStatus && record.toStatus ? `${record.fromStatus} → ${record.toStatus}` : '-' }
        ]}
        locale={{ emptyText: '暂无操作记录' }}
      />
    </Drawer>
  </>;
}
