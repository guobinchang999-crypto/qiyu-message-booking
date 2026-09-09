import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Space, message } from 'antd';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useEffect, useMemo, useState } from 'react';
import BookingStatusTag from '@/components/BookingStatusTag';
import { adminRemoteApi } from '@/services/remote';
import { can, canAccessStore, readAdminSession } from '@/services/admin-auth';
import type { CheckinTask } from '@/types';
import { stringifyValue } from '@/utils/filter';

const searchKeys: Array<keyof CheckinTask> = ['code', 'customerName', 'store', 'service'];

export default function CheckinPage() {
  const session = readAdminSession();
  const [data, setData] = useState<CheckinTask[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setData((await adminRemoteApi.getCheckinTasks()).filter((item) => canAccessStore(session, 'booking', 'CHECKIN', item.storeId || item.store)));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '核销任务加载失败');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, []);

  const rows = useMemo(() => {
    const value = keyword.trim();
    return value ? data.filter((record) => searchKeys.some((key) => stringifyValue(record[key]).includes(value))) : data;
  }, [keyword, data]);

  const withBusy = async (id: string, action: () => Promise<void>, successText: string) => {
    if (busyIds.has(id)) return;
    setBusyIds((current) => new Set(current).add(id));
    try {
      await action();
      await reload();
      message.success(successText);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败，请重试');
    } finally {
      setBusyIds((current) => { const next = new Set(current); next.delete(id); return next; });
    }
  };
  const checkIn = (record: CheckinTask) => withBusy(record.id, () => adminRemoteApi.transitionAppointment(record.id, 'checkin'), '客户已签到');
  const startService = (record: CheckinTask) => withBusy(record.id, () => adminRemoteApi.transitionAppointment(record.id, 'start-service'), '服务已开始');
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

  const columns: ProColumns<CheckinTask>[] = [
    { title: '核销码', dataIndex: 'code' },
    { title: '客户', dataIndex: 'customerName' },
    { title: '门店', dataIndex: 'store' },
    { title: '服务项目', dataIndex: 'service' },
    { title: '预约时间', dataIndex: 'scheduledAt' },
    { title: '状态', dataIndex: 'status', render: (_, record) => <BookingStatusTag status={record.status} label={record.statusLabel} /> },
    {
      title: '核销',
      key: 'checkin',
      render: (_, record) => (
        <Space>
          {can(session, 'booking:checkin') && <Button size="small" type="primary" loading={busyIds.has(record.id)} disabled={record.status !== 'BOOKED'} onClick={() => checkIn(record)}>确认签到</Button>}
          {can(session, 'booking:update') && <Button size="small" loading={busyIds.has(record.id)} disabled={record.status !== 'CHECKED_IN'} onClick={() => startService(record)}>开始服务</Button>}
        </Space>
      )
    }
  ];

  return (
    <PageContainer header={{ title: '到店核销', subTitle: '前台按核销码确认客户到店，签到后进入待服务履约流程。' }}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索核销码、客户、门店或服务项目" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          {can(session, 'booking:checkin') && <Button type="primary" loading={batchBusy} disabled={!selectedRowKeys.length || batchBusy} onClick={batchCheckIn}>批量签到</Button>}
        </div>
        <ProTable<CheckinTask>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          search={false}
          scroll={{ x: 980 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, getCheckboxProps: (record) => ({ disabled: record.status !== 'BOOKED' }) }}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }}
        />
      </ProCard>
    </PageContainer>
  );
}
