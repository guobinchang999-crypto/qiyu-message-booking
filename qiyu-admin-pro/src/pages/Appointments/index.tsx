import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Space, message } from 'antd';
import { ModalForm, PageContainer, ProCard, ProFormDatePicker, ProFormDigit, ProFormSelect, ProFormText, ProTable, QueryFilter } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import BookingStatusTag from '@/components/BookingStatusTag';
import { adminRemoteApi } from '@/services/remote';
import { can, canAccessStore, isSelfScope, maskPhone, readAdminSession } from '@/services/admin-auth';
import type { Appointment, BookingOptionPayload, BookingStatus } from '@/types';

const emptyOptions: BookingOptionPayload = { stores: [], services: [], therapists: [], rooms: [], statuses: [] };
const firstValue = (options: Array<{ value: string }>): string | undefined => options[0]?.value;
type AppointmentFormValues = Omit<Appointment, 'scheduledAt'> & { scheduledAt: Dayjs };

export default function AppointmentsPage() {
  const session = readAdminSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [options, setOptions] = useState<BookingOptionPayload>(emptyOptions);
  const [filters, setFilters] = useState<{ store?: string; status?: BookingStatus; keyword?: string; date?: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment>();
  const [conflictMessage, setConflictMessage] = useState('');
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const reload = async () => setAppointments(await adminRemoteApi.getAppointments());
  useEffect(() => {
    void reload();
    adminRemoteApi.getBookingOptions().then(setOptions)
      .catch((error) => message.error(error instanceof Error ? error.message : '预约选项加载失败'));
  }, []);
  const visibleStores = useMemo(() => options.stores.filter((store) => canAccessStore(session, 'booking', 'READ', store.value)), [options.stores, session]);
  const rows = useMemo(() => appointments.filter((item) => {
    const storeAllowed = canAccessStore(session, 'booking', 'READ', item.storeId || item.store);
    const selfAllowed = isSelfScope(session, 'booking', 'READ') && item.therapist === session?.principal.displayName;
    return (storeAllowed || selfAllowed)
      && (!filters.store || (item.storeId || item.store) === filters.store)
      && (!filters.status || item.status === filters.status)
      && (!filters.date || item.scheduledAt.startsWith(filters.date))
      && (!filters.keyword || `${item.customerName}${item.phone}${item.id}`.includes(filters.keyword));
  }), [appointments, filters, session]);

  const openCreate = () => {
    setEditing(undefined);
    setConflictMessage('');
    setModalOpen(true);
  };
  const openEdit = (record: Appointment) => {
    setEditing(record);
    setConflictMessage('');
    setModalOpen(true);
  };
  const toInitialValues = (): Partial<AppointmentFormValues> => editing ? {
    ...editing,
    store: editing.storeId || editing.store,
    service: editing.serviceId || editing.service,
    therapist: editing.therapistId || editing.therapist,
    room: editing.roomId || editing.room,
    scheduledAt: dayjs(editing.scheduledAt, 'YYYY-MM-DD HH:mm')
  } : {
    store: firstValue(visibleStores),
    therapist: firstValue(options.therapists),
    room: firstValue(options.rooms),
    service: firstValue(options.services),
    scheduledAt: dayjs(),
    status: 'BOOKED',
    amount: 0
  };

  const runAction = async (id: string, action: () => Promise<void>, successText: string) => {
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
  const cancelBooking = (record: Appointment) => Modal.confirm({
    title: '确认取消预约？',
    content: `将取消 ${record.customerName} 的 ${record.service} 预约，并释放房间占用。`,
    okText: '确认取消',
    okButtonProps: { danger: true },
    onOk: () => runAction(record.id, () => adminRemoteApi.transitionAppointment(record.id, 'cancel'), '预约已取消，房间资源已释放')
  });

  const columns: ProColumns<Appointment>[] = [
    { title: '预约时间', dataIndex: 'scheduledAt', width: 165, sorter: (a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || '') },
    { title: '客户', dataIndex: 'customerName', render: (_, record) => <div><div>{record.customerName}</div><span style={{ color: '#7c8780', fontSize: 12 }}>{maskPhone(record.phone, session)}</span></div> },
    { title: '门店', dataIndex: 'store' },
    { title: '服务项目', dataIndex: 'service' },
    { title: '技师', dataIndex: 'therapist' },
    { title: '房间', dataIndex: 'room' },
    { title: '状态', dataIndex: 'status', render: (_, record) => <BookingStatusTag status={record.status} label={record.statusLabel} /> },
    { title: '实付金额', dataIndex: 'amount', render: (_, record) => `¥${record.amount}` },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, record) => (
        <Space size={4} wrap>
          {can(session, 'booking:update') && <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>}
          {record.status === 'BOOKED' && can(session, 'booking:checkin') && <Button type="link" size="small" loading={busyIds.has(record.id)} onClick={() => runAction(record.id, () => adminRemoteApi.transitionAppointment(record.id, 'checkin'), '客户已签到')}>签到</Button>}
          {record.status === 'CHECKED_IN' && can(session, 'booking:update') && <Button type="link" size="small" loading={busyIds.has(record.id)} onClick={() => runAction(record.id, () => adminRemoteApi.transitionAppointment(record.id, 'start-service'), '服务已开始')}>开始服务</Button>}
          {['PENDING_PAYMENT', 'BOOKED'].includes(record.status) && can(session, 'booking:cancel') && <Button type="link" danger size="small" loading={busyIds.has(record.id)} onClick={() => cancelBooking(record)}>取消</Button>}
        </Space>
      )
    }
  ];

  return (
    <PageContainer
      header={{ title: '预约管理', subTitle: '集中查看和处理已授权门店的预约，资源调整将实时反映在排班中。' }}
      extra={can(session, 'booking:create') ? [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建预约</Button>] : []}
    >
      <ProCard>
        <QueryFilter
          onFinish={(values) => {
            setFilters({
              keyword: values.keyword as string | undefined,
              store: values.store as string | undefined,
              status: values.status as BookingStatus | undefined,
              date: values.date ? (typeof values.date === 'string' ? values.date : (values.date as Dayjs).format('YYYY-MM-DD')) : undefined
            });
          }}
          onReset={() => setFilters({})}
          defaultCollapsed={false}
        >
          <ProFormText name="keyword" placeholder="搜索客户、手机号或预约编号" />
          <ProFormSelect name="store" placeholder="全部门店" options={visibleStores} width="md" />
          <ProFormSelect name="status" placeholder="订单状态" options={options.statuses} width="md" />
          <ProFormDatePicker name="date" placeholder="预约日期" width="md" />
        </QueryFilter>
        <ProTable<Appointment>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          search={false}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 条预约` }}
          toolBarRender={() => [<Button key="refresh" icon={<ReloadOutlined />} onClick={() => void reload()}>刷新</Button>]}
        />
      </ProCard>
      <ModalForm<AppointmentFormValues>
        title={editing ? '修改预约' : '创建预约'}
        width={460}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={toInitialValues()}
        modalProps={{ destroyOnClose: true, okText: editing ? '保存修改' : '确认创建', cancelText: '取消' }}
        onFinish={async (values) => {
          const item: Appointment = {
            ...values,
            storeId: values.store,
            serviceId: values.service,
            therapistId: values.therapist,
            roomId: values.room,
            id: editing?.id ?? '',
            phone: values.phone ?? '',
            scheduledAt: dayjs(values.scheduledAt).format('YYYY-MM-DD HH:mm')
          };
          try {
            if (editing) await adminRemoteApi.updateAppointment(item);
            else await adminRemoteApi.createAppointment(item);
            await reload();
            message.success(editing ? '预约已更新' : '预约已创建');
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '预约保存失败';
            setConflictMessage(errorMessage);
            message.error(errorMessage);
            return false;
          }
        }}
      >
        {conflictMessage && <Alert type="error" showIcon message="资源冲突" description={conflictMessage} style={{ marginBottom: 16 }} />}
        <ProFormText name="customerName" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]} disabled={!!editing} />
        <ProFormText name="phone" label="手机号" disabled={!!editing} />
        <ProFormSelect name="store" label="预约门店" rules={[{ required: true, message: '请选择门店' }]} options={visibleStores} disabled={!!editing} />
        <ProFormSelect name="service" label="服务项目" rules={[{ required: true, message: '请选择服务项目' }]} options={options.services} disabled={!!editing} />
        <ProFormSelect name="therapist" label="服务技师" rules={[{ required: true, message: '请选择技师' }]} options={options.therapists} />
        <ProFormSelect name="room" label="服务房间" rules={[{ required: true, message: '请选择房间' }]} options={options.rooms} />
        <ProFormDatePicker name="scheduledAt" label="预约时间" rules={[{ required: true, message: '请选择预约时间' }]} fieldProps={{ showTime: true, format: 'YYYY-MM-DD HH:mm', style: { width: '100%' } }} />
        <ProFormSelect name="status" label="订单状态" options={options.statuses} />
        {can(session, 'booking:change_amount') && <ProFormDigit name="amount" label="预约金额" fieldProps={{ prefix: '¥', style: { width: '100%' } }} />}
      </ModalForm>
    </PageContainer>
  );
}
