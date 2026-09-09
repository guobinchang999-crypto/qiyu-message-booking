import { SearchOutlined } from '@ant-design/icons';
import { Button, Drawer, Input, Space, Table, message } from 'antd';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useEffect, useMemo, useState } from 'react';
import BookingStatusTag from '@/components/BookingStatusTag';
import { adminRemoteApi } from '@/services/remote';
import type { AppointmentAuditRecord, ServiceOrder } from '@/types';
import { stringifyValue } from '@/utils/filter';

const searchKeys: Array<keyof ServiceOrder> = ['id', 'bookingId', 'customerName', 'store', 'service', 'therapist'];

export default function ServiceOrdersPage() {
  const [data, setData] = useState<ServiceOrder[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AppointmentAuditRecord[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const reload = async () => setData(await adminRemoteApi.getServiceOrders());
  useEffect(() => { setLoading(true); void reload().finally(() => setLoading(false)); }, []);
  const rows = useMemo(() => {
    const value = keyword.trim();
    return value ? data.filter((record) => searchKeys.some((key) => stringifyValue(record[key]).includes(value))) : data;
  }, [keyword, data]);
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
  const openAudit = async (record: ServiceOrder) => {
    setAuditLogs(await adminRemoteApi.getAppointmentAuditLogs(record.bookingId));
    setAuditOpen(true);
  };
  const columns: ProColumns<ServiceOrder>[] = [
    { title: '服务单号', dataIndex: 'id' },
    { title: '客户', dataIndex: 'customerName' },
    { title: '门店', dataIndex: 'store' },
    { title: '服务项目', dataIndex: 'service' },
    { title: '技师', dataIndex: 'therapist' },
    { title: '房间', dataIndex: 'room' },
    { title: '状态', dataIndex: 'status', render: (_, record) => <BookingStatusTag status={record.status} label={record.statusLabel} /> },
    { title: '实付', dataIndex: 'paidAmount', render: (_, record) => `¥${record.paidAmount}` },
    {
      title: '履约动作',
      key: 'flow',
      width: 300,
      render: (_, record) => (
        <Space size={4} wrap>
          <Button size="small" type="link" loading={busyIds.has(record.bookingId)} disabled={!['CHECKED_IN', 'WAITING_SERVICE'].includes(record.status)} onClick={() => runAction(record.bookingId, '服务已开始，房间状态已更新为使用中', () => adminRemoteApi.transitionAppointment(record.bookingId, 'start-service'))}>开始服务</Button>
          <Button size="small" type="link" loading={busyIds.has(record.bookingId)} disabled={record.status !== 'IN_SERVICE'} onClick={() => runAction(record.bookingId, '服务已完成，订单进入待结算', () => adminRemoteApi.transitionAppointment(record.bookingId, 'finish-service'))}>完成服务</Button>
          <Button size="small" type="link" loading={busyIds.has(record.bookingId)} disabled={record.status !== 'PENDING_SETTLEMENT'} onClick={() => runAction(record.bookingId, '结算已完成，房间资源已释放', () => adminRemoteApi.transitionAppointment(record.bookingId, 'settle'))}>完成结算</Button>
          <Button size="small" type="link" onClick={() => openAudit(record)}>操作记录</Button>
        </Space>
      )
    }
  ];
  return (
    <>
      <PageContainer header={{ title: '服务订单', subTitle: '跟踪服务开始、完成、待结算和已完成状态，保留支付与结算接口入口。' }}>
        <ProCard>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索单号、客户、门店或项目" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </div>
          <ProTable<ServiceOrder> rowKey="id" loading={loading} columns={columns} dataSource={rows} search={false} scroll={{ x: 1200 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条服务单` }} />
        </ProCard>
      </PageContainer>
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
    </>
  );
}
