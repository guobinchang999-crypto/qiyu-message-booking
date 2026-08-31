import { CalendarOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, DatePicker, Drawer, Form, Input, Modal, Select, Space, Table, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import BookingStatusTag from '@/components/BookingStatusTag';
import { adminRemoteApi } from '@/services/remote';
import { can, canAccessStore, isSelfScope, maskPhone, readAdminSession } from '@/services/admin-auth';
import type { Appointment, BookingOptionPayload, BookingStatus } from '@/types';

const emptyOptions: BookingOptionPayload = { stores: [], services: [], therapists: [], rooms: [], statuses: [] };
const firstValue = (options: Array<{ value: string }>): string | undefined => options[0]?.value;

export default function AppointmentsPage() {
  const session = readAdminSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [options, setOptions] = useState<BookingOptionPayload>(emptyOptions);
  const [filters, setFilters] = useState<{ store?: string; status?: BookingStatus; keyword?: string; date?: string }>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment>();
  const [conflictMessage, setConflictMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<Appointment>();
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
    form.resetFields();
    form.setFieldsValue({
      store: firstValue(visibleStores),
      therapist: firstValue(options.therapists),
      room: firstValue(options.rooms),
      service: firstValue(options.services),
      scheduledAt: '',
      status: 'BOOKED',
      amount: 0
    });
    setDrawerOpen(true);
  };
  const openEdit = (record: Appointment) => {
    setEditing(record);
    setConflictMessage('');
    form.setFieldsValue({ ...record, store: record.storeId || record.store, service: record.serviceId || record.service,
      therapist: record.therapistId || record.therapist, room: record.roomId || record.room });
    setDrawerOpen(true);
  };
  const save = async () => {
    const values = await form.validateFields();
    const item: Appointment = {
      ...values,
      storeId: values.store,
      serviceId: values.service,
      therapistId: values.therapist,
      roomId: values.room,
      id: editing?.id ?? '',
      phone: values.phone ?? ''
    };
    setSaving(true);
    try {
      if (editing) await adminRemoteApi.rescheduleAppointment(item);
      else await adminRemoteApi.createAppointment(item);
      await reload();
      setDrawerOpen(false); message.success(editing ? '预约已更新' : '预约已创建');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '预约保存失败';
      setConflictMessage(errorMessage);
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  const cancelBooking = (record: Appointment) => Modal.confirm({ title: '确认取消预约？', content: `将取消 ${record.customerName} 的 ${record.service} 预约，并释放房间占用。`, okText: '确认取消', okButtonProps: { danger: true }, onOk: async () => { await adminRemoteApi.transitionAppointment(record.id, 'cancel'); await reload(); message.success('预约已取消，房间资源已释放'); } });
  const checkIn = async (record: Appointment) => { await adminRemoteApi.transitionAppointment(record.id, 'checkin'); await reload(); message.success('客户已签到'); };
  const startService = async (record: Appointment) => { await adminRemoteApi.transitionAppointment(record.id, 'start-service'); await reload(); message.success('服务已开始'); };
  const columns = [
    { title: '预约时间', dataIndex: 'scheduledAt', width: 165, sorter: (a: Appointment, b: Appointment) => a.scheduledAt.localeCompare(b.scheduledAt) },
    { title: '客户', dataIndex: 'customerName', render: (value: string, record: Appointment) => <div><div>{value}</div><span style={{ color: '#7c8780', fontSize: 12 }}>{maskPhone(record.phone, session)}</span></div> },
    { title: '门店', dataIndex: 'store' }, { title: '服务项目', dataIndex: 'service' }, { title: '技师', dataIndex: 'therapist' }, { title: '房间', dataIndex: 'room' },
    { title: '状态', dataIndex: 'status', render: (status: BookingStatus, record: Appointment) => <BookingStatusTag status={status} label={record.statusLabel} /> }, { title: '实付金额', dataIndex: 'amount', render: (amount: number) => `¥${amount}` },
    { title: '操作', fixed: 'right' as const, width: 220, render: (_: unknown, record: Appointment) => <Space size={4} wrap>{can(session, 'booking:update') && <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>}{record.status === 'BOOKED' && can(session, 'booking:checkin') && <Button type="link" size="small" onClick={() => checkIn(record)}>签到</Button>}{record.status === 'CHECKED_IN' && can(session, 'booking:update') && <Button type="link" size="small" onClick={() => startService(record)}>开始服务</Button>}{['PENDING_PAYMENT', 'BOOKED'].includes(record.status) && can(session, 'booking:cancel') && <Button type="link" danger size="small" onClick={() => cancelBooking(record)}>取消</Button>}</Space> }
  ];
  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">预约管理</h1><div className="qiyu-page-description">集中查看和处理已授权门店的预约，资源调整将实时反映在排班中。</div></div>{can(session, 'booking:create') && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建预约</Button>}</div>
    <Card className="qiyu-card"><div className="qiyu-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="搜索客户、手机号或预约编号" style={{ width: 260 }} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} /><Select allowClear placeholder="全部门店" options={visibleStores} style={{ width: 145 }} onChange={(store) => setFilters((current) => ({ ...current, store }))} /><Select allowClear placeholder="订单状态" options={options.statuses} style={{ width: 145 }} onChange={(status) => setFilters((current) => ({ ...current, status: status as BookingStatus | undefined }))} /><DatePicker prefix={<CalendarOutlined />} onChange={(date) => setFilters((current) => ({ ...current, date: date ? dayjs(date).format('YYYY-MM-DD') : undefined }))} /></div><Table rowKey="id" columns={columns} dataSource={rows} scroll={{ x: 1200 }} pagination={{ pageSize: 6, showSizeChanger: false, showTotal: (total) => `共 ${total} 条预约` }} /></Card>
    <Drawer title={editing ? '修改预约' : '创建预约'} width={460} open={drawerOpen} onClose={() => setDrawerOpen(false)} extra={<Space><Button onClick={() => setDrawerOpen(false)}>取消</Button><Button type="primary" loading={saving} onClick={save}>{editing ? '保存修改' : '确认创建'}</Button></Space>}>
      {conflictMessage && <Alert type="error" showIcon message="资源冲突" description={conflictMessage} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical"><Form.Item name="customerName" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}><Input /></Form.Item><Form.Item name="phone" label="手机号"><Input /></Form.Item><Form.Item name="store" label="预约门店" rules={[{ required: true }]}><Select options={visibleStores} /></Form.Item><Form.Item name="service" label="服务项目" rules={[{ required: true }]}><Select options={options.services} /></Form.Item><Form.Item name="therapist" label="服务技师" rules={[{ required: true }]}><Select options={options.therapists} /></Form.Item><Form.Item name="room" label="服务房间" rules={[{ required: true }]}><Select options={options.rooms} /></Form.Item><Form.Item name="scheduledAt" label="预约时间" rules={[{ required: true }]}><Input placeholder="例如：2026-08-04 16:00" /></Form.Item><Form.Item name="status" label="订单状态"><Select options={options.statuses} /></Form.Item>{can(session, 'booking:change_amount') && <Form.Item name="amount" label="预约金额"><Input type="number" prefix="¥" /></Form.Item>}</Form>
    </Drawer>
  </div>;
}
