import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Empty, Popconfirm, Select, Space, Table, Tabs, Tag, TimePicker, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ModalForm, PageContainer, ProCard, ProForm, ProFormDatePicker, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
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
  const [weekStart, setWeekStart] = useState(() => monday(dayjs()));
  const [stores, setStores] = useState<StoreResource[]>([]);
  const [therapists, setTherapists] = useState<TherapistResource[]>([]);
  const [rooms, setRooms] = useState<RoomResource[]>([]);
  const [schedules, setSchedules] = useState<ScheduleResource[]>([]);
  const [storeId, setStoreId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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

  const openForm = (record?: ScheduleResource) => {
    setEditing(record);
    setModalOpen(true);
  };
  const remove = async (id: string) => {
    try { await scheduleResourceApi.remove(id); message.success('排班已删除'); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '排班删除失败'); }
  };
  const formInitialValues = editing ? {
    therapistId: editing.therapistId, workDate: dayjs(editing.workDate),
    timeRange: [dayjs(`2000-01-01T${editing.startTime}`), dayjs(`2000-01-01T${editing.endTime}`)],
    status: editing.status, remark: editing.remark
  } : {
    therapistId: scopedTherapists[0]?.id, workDate: weekStart,
    timeRange: [dayjs().hour(10).minute(0).second(0), dayjs().hour(18).minute(0).second(0)],
    status: 'WORK' as ScheduleStatus, remark: ''
  };

  const scheduleColumns: ColumnsType<ScheduleResource> = [
    { title: '日期', dataIndex: 'workDate', width: 120 },
    { title: '技师', dataIndex: 'therapistName', width: 120 },
    { title: '时段', width: 150, render: (_, row) => `${row.startTime.slice(0, 5)} - ${row.endTime.slice(0, 5)}` },
    { title: '状态', dataIndex: 'status', width: 90, render: (value: ScheduleStatus) => { const meta = statusOptions.find((item) => item.value === value)!; return <Tag color={meta.color}>{meta.label}</Tag>; } },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: (value?: string) => value || '-' },
    ...(manageable ? [{ title: '操作', key: 'actions', width: 130, render: (_: unknown, row: ScheduleResource) => <Space size={2}><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openForm(row)}>编辑</Button><Popconfirm title="确认删除该排班？" onConfirm={() => remove(row.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm></Space> }] : [])
  ];
  const roomColumns: ColumnsType<RoomResource> = [
    { title: '房间', dataIndex: 'name' },
    { title: '用途', dataIndex: 'type' },
    { title: '容量', dataIndex: 'capacity', width: 90, render: (value?: number) => `${value ?? 1} 人` },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: RoomResource['status']) => <Tag color={roomStatus[value].color}>{roomStatus[value].label}</Tag> },
    { title: '备注', dataIndex: 'note', render: (value?: string) => value || '-' }
  ];

  return (
    <PageContainer
      header={{ title: '排班与资源管理', subTitle: '维护技师工作、休息和请假时段，并核对门店房间状态。' }}
      extra={[
        <Select key="store" value={storeId} onChange={setStoreId} options={stores.map((item) => ({ label: item.name, value: item.id }))} placeholder="选择门店" style={{ width: 180 }} />,
        <Button key="refresh" icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>,
        ...(manageable ? [<Button key="add" type="primary" icon={<PlusOutlined />} disabled={!scopedTherapists.length} onClick={() => openForm()}>新增排班</Button>] : [])
      ]}
    >
      <ProCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => setWeekStart((value) => value.subtract(7, 'day'))} />
            <DatePicker value={weekStart} onChange={(value) => value && setWeekStart(monday(value))} allowClear={false} />
            <Button icon={<RightOutlined />} onClick={() => setWeekStart((value) => value.add(7, 'day'))} />
          </Space>
          <span style={{ color: '#7c8780' }}>{weekStart.format('YYYY-MM-DD')} 至 {weekStart.add(6, 'day').format('YYYY-MM-DD')}</span>
        </div>
        <Tabs
          items={[
            {
              key: 'schedule',
              label: `技师排班 (${scopedSchedules.length})`,
              children: <Table rowKey="id" loading={loading} columns={scheduleColumns} dataSource={scopedSchedules} locale={{ emptyText: <Empty description="本周暂无排班" /> }} pagination={false} />
            },
            {
              key: 'room',
              label: `房间状态 (${scopedRooms.length})`,
              children: <Table rowKey="id" loading={loading} columns={roomColumns} dataSource={scopedRooms} pagination={false} />
            }
          ]}
        />
      </ProCard>
      <ModalForm<ScheduleFormValues>
        title={editing ? '编辑排班' : '新增排班'}
        width={640}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={formInitialValues}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (values) => {
          const command: ScheduleCommand = {
            therapistId: values.therapistId, workDate: values.workDate.format('YYYY-MM-DD'),
            startTime: values.timeRange[0].format('HH:mm:ss'), endTime: values.timeRange[1].format('HH:mm:ss'),
            status: values.status, remark: values.remark?.trim() || undefined
          };
          try {
            if (editing) await scheduleResourceApi.update(editing.id, command); else await scheduleResourceApi.create(command);
            message.success(editing ? '排班已更新' : '排班已创建');
            await load();
            return true;
          } catch (error) { message.error(error instanceof Error ? error.message : '排班保存失败'); return false; }
        }}
      >
        <ProFormSelect name="therapistId" label="技师" rules={[{ required: true, message: '请选择技师' }]} options={scopedTherapists.map((item) => ({ label: item.name, value: item.id }))} />
        <ProForm.Group>
          <ProFormDatePicker name="workDate" label="日期" rules={[{ required: true, message: '请选择日期' }]} />
          <ProFormSelect name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]} options={statusOptions.map(({ value, label }) => ({ value, label }))} />
        </ProForm.Group>
        <ProForm.Item name="timeRange" label="时段" rules={[{ required: true, message: '请选择排班时段' }]}>
          <TimePicker.RangePicker format="HH:mm" minuteStep={10} style={{ width: '100%' }} />
        </ProForm.Item>
        <ProFormTextArea name="remark" label="备注" fieldProps={{ rows: 3, maxLength: 255, showCount: true }} />
      </ModalForm>
    </PageContainer>
  );
}
