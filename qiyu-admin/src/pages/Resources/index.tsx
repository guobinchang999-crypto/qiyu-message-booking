import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Empty, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tabs, Tag, TimePicker, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { roomResourceApi, storeResourceApi, therapistResourceApi } from '@/services/resource-service';
import type { RoomResource, StoreResource, TherapistResource } from '@/services/resource-service';
import { scheduleResourceApi } from '@/services/schedule-service';
import type { ScheduleCommand, ScheduleResource, ScheduleStatus } from '@/services/schedule-service';

interface ScheduleFormValues {
  therapistId: string;
  workDate: Dayjs;
  timeRange: [Dayjs, Dayjs];
  status: ScheduleStatus;
  remark?: string;
}

const statusOptions: Array<{ value: ScheduleStatus; label: string; color: string }> = [
  { value: 'WORK', label: '上班', color: 'green' },
  { value: 'REST', label: '休息', color: 'default' },
  { value: 'LEAVE', label: '请假', color: 'orange' }
];
const roomStatus: Record<RoomResource['status'], { label: string; color: string }> = {
  AVAILABLE: { label: '空闲', color: 'green' }, BOOKED: { label: '已预约', color: 'blue' },
  IN_USE: { label: '使用中', color: 'processing' }, CLEANING: { label: '清洁中', color: 'orange' },
  MAINTENANCE: { label: '维护中', color: 'default' }
};
const monday = (value: Dayjs) => {
  const weekday = value.day();
  return value.startOf('day').subtract(weekday === 0 ? 6 : weekday - 1, 'day');
};

export default function ResourcesPage() {
  const session = readAdminSession();
  const manageable = can(session, 'schedule:manage');
  const [form] = Form.useForm<ScheduleFormValues>();
  const [weekStart, setWeekStart] = useState(() => monday(dayjs()));
  const [stores, setStores] = useState<StoreResource[]>([]);
  const [therapists, setTherapists] = useState<TherapistResource[]>([]);
  const [rooms, setRooms] = useState<RoomResource[]>([]);
  const [schedules, setSchedules] = useState<ScheduleResource[]>([]);
  const [storeId, setStoreId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleResource>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const end = weekStart.add(6, 'day');
      const [storeRows, therapistRows, roomRows, scheduleRows] = await Promise.all([
        storeResourceApi.list(), therapistResourceApi.list(), roomResourceApi.list(),
        scheduleResourceApi.list(weekStart.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'))
      ]);
      setStores(storeRows); setTherapists(therapistRows); setRooms(roomRows); setSchedules(scheduleRows);
      setStoreId((current) => current && storeRows.some((item) => item.id === current) ? current : storeRows[0]?.id);
    } catch (error) { message.error(error instanceof Error ? error.message : '排班资源加载失败'); }
    finally { setLoading(false); }
  }, [weekStart]);
  useEffect(() => { void load(); }, [load]);

  const scopedTherapists = useMemo(() => therapists.filter((item) => !storeId || item.storeId === storeId
    || stores.find((store) => store.id === storeId)?.name === item.store), [storeId, stores, therapists]);
  const scopedSchedules = useMemo(() => schedules.filter((item) => !storeId || item.storeId === storeId), [schedules, storeId]);
  const scopedRooms = useMemo(() => rooms.filter((item) => !storeId || item.storeId === storeId), [rooms, storeId]);

  const showForm = (record?: ScheduleResource) => {
    setEditing(record);
    const defaultTherapist = scopedTherapists[0]?.id;
    form.setFieldsValue(record ? {
      therapistId: record.therapistId, workDate: dayjs(record.workDate),
      timeRange: [dayjs(`2000-01-01T${record.startTime}`), dayjs(`2000-01-01T${record.endTime}`)],
      status: record.status, remark: record.remark
    } : { therapistId: defaultTherapist, workDate: weekStart,
      timeRange: [dayjs().hour(10).minute(0).second(0), dayjs().hour(18).minute(0).second(0)],
      status: 'WORK', remark: '' });
    setOpen(true);
  };
  const submit = async () => {
    const values = await form.validateFields();
    const command: ScheduleCommand = {
      therapistId: values.therapistId, workDate: values.workDate.format('YYYY-MM-DD'),
      startTime: values.timeRange[0].format('HH:mm:ss'), endTime: values.timeRange[1].format('HH:mm:ss'),
      status: values.status, remark: values.remark?.trim() || undefined
    };
    setSaving(true);
    try {
      if (editing) await scheduleResourceApi.update(editing.id, command); else await scheduleResourceApi.create(command);
      message.success(editing ? '排班已更新' : '排班已创建'); setOpen(false); await load();
    } catch (error) { message.error(error instanceof Error ? error.message : '排班保存失败'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    try { await scheduleResourceApi.remove(id); message.success('排班已删除'); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '排班删除失败'); }
  };

  const scheduleColumns: ColumnsType<ScheduleResource> = [
    { title: '日期', dataIndex: 'workDate', width: 120 }, { title: '技师', dataIndex: 'therapistName', width: 120 },
    { title: '时段', width: 150, render: (_, row) => `${row.startTime.slice(0, 5)} - ${row.endTime.slice(0, 5)}` },
    { title: '状态', dataIndex: 'status', width: 90, render: (value: ScheduleStatus) => { const meta = statusOptions.find((item) => item.value === value)!; return <Tag color={meta.color}>{meta.label}</Tag>; } },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: (value?: string) => value || '-' },
    ...(manageable ? [{ title: '操作', key: 'actions', width: 130, render: (_: unknown, row: ScheduleResource) => <Space size={2}><Button type="text" size="small" icon={<EditOutlined />} onClick={() => showForm(row)}>编辑</Button><Popconfirm title="确认删除该排班？" onConfirm={() => remove(row.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> }] : [])
  ];
  const roomColumns: ColumnsType<RoomResource> = [
    { title: '房间', dataIndex: 'name' }, { title: '用途', dataIndex: 'type' },
    { title: '容量', dataIndex: 'capacity', width: 90, render: (value?: number) => `${value ?? 1} 人` },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: RoomResource['status']) => <Tag color={roomStatus[value].color}>{roomStatus[value].label}</Tag> },
    { title: '备注', dataIndex: 'note', render: (value?: string) => value || '-' }
  ];

  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">排班与资源管理</h1><div className="qiyu-page-description">维护技师工作、休息和请假时段，并核对门店房间状态。</div></div><Space><Select value={storeId} onChange={setStoreId} options={stores.map((item) => ({ label: item.name, value: item.id }))} placeholder="选择门店" style={{ width: 180 }} /><Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>{manageable && <Button type="primary" icon={<PlusOutlined />} disabled={!scopedTherapists.length} onClick={() => showForm()}>新增排班</Button>}</Space></div>
    <Card className="qiyu-card"><div className="qiyu-toolbar"><Space><Button icon={<LeftOutlined />} onClick={() => setWeekStart((value) => value.subtract(7, 'day'))} title="上一周" /><DatePicker value={weekStart} onChange={(value) => value && setWeekStart(monday(value))} allowClear={false} /><Button icon={<RightOutlined />} onClick={() => setWeekStart((value) => value.add(7, 'day'))} title="下一周" /></Space><span>{weekStart.format('YYYY-MM-DD')} 至 {weekStart.add(6, 'day').format('YYYY-MM-DD')}</span></div>
      <Tabs items={[{ key: 'schedule', label: `技师排班 (${scopedSchedules.length})`, children: <Table rowKey="id" loading={loading} columns={scheduleColumns} dataSource={scopedSchedules} locale={{ emptyText: <Empty description="本周暂无排班" /> }} pagination={false} /> }, { key: 'room', label: `房间状态 (${scopedRooms.length})`, children: <Table rowKey="id" loading={loading} columns={roomColumns} dataSource={scopedRooms} pagination={false} /> }]} />
    </Card>
    <Modal title={editing ? '编辑排班' : '新增排班'} open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} width={640} destroyOnHidden><Form form={form} layout="vertical" preserve={false} style={{ marginTop: 24 }}>
      <Form.Item name="therapistId" label="技师" rules={[{ required: true, message: '请选择技师' }]}><Select options={scopedTherapists.map((item) => ({ label: item.name, value: item.id }))} /></Form.Item>
      <Row gutter={16}><Col span={12}><Form.Item name="workDate" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="status" label="状态" rules={[{ required: true }]}><Select options={statusOptions.map(({ value, label }) => ({ value, label }))} /></Form.Item></Col></Row>
      <Form.Item name="timeRange" label="时段" rules={[{ required: true, message: '请选择排班时段' }]}><TimePicker.RangePicker format="HH:mm" minuteStep={10} style={{ width: '100%' }} /></Form.Item>
      <Form.Item name="remark" label="备注"><Input.TextArea rows={3} maxLength={255} showCount /></Form.Item>
    </Form></Modal>
  </div>;
}
