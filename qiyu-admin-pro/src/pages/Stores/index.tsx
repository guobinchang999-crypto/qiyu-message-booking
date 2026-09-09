import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Empty, Input, Popconfirm, Space, Table, Tag, TimePicker, message } from 'antd';
import { ModalForm, PageContainer, ProCard, ProForm, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MapPicker from '@/components/MapPicker';
import { can, readAdminSession } from '@/services/admin-auth';
import { roomResourceApi, storeResourceApi, therapistResourceApi } from '@/services/resource-service';
import type { RoomCommand, RoomResource, StoreCommand, StoreResource, TherapistCommand, TherapistResource } from '@/services/resource-service';
import { adminRemoteApi } from '@/services/remote';

interface StoreFormValues {
  code: string;
  name: string;
  phone?: string;
  regionId?: string;
  province?: string;
  city?: string;
  district?: string;
  address: string;
  longitude?: number;
  latitude?: number;
  hours: [Dayjs, Dayjs];
  status: StoreResource['status'];
  enabled: boolean;
}

const roomStatusOptions = [
  { label: '空闲', value: 'AVAILABLE', color: 'green' },
  { label: '已预约', value: 'BOOKED', color: 'blue' },
  { label: '使用中', value: 'IN_USE', color: 'processing' },
  { label: '清洁中', value: 'CLEANING', color: 'orange' },
  { label: '维护中', value: 'MAINTENANCE', color: 'default' }
];
const roomStatusColor = (status: RoomResource['status']) => roomStatusOptions.find((o) => o.value === status)?.color ?? 'default';
const roomStatusLabel = (status: RoomResource['status']) => roomStatusOptions.find((o) => o.value === status)?.label ?? status;
const therapistStatusColor = (status: TherapistResource['status']) => status === '可预约' ? 'green' : status === '服务中' ? 'blue' : 'orange';

const parseHours = (value: string): [Dayjs, Dayjs] => {
  const [open, close] = value.split('-');
  return [dayjs((open || '10:00').trim(), 'HH:mm'), dayjs((close || '22:00').trim(), 'HH:mm')];
};

export default function StoresPage() {
  const session = readAdminSession();
  const [rows, setRows] = useState<StoreResource[]>([]);
  const [regions, setRegions] = useState<Array<{ label: string; value: string }>>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StoreResource>();
  const [managerStore, setManagerStore] = useState<StoreResource>();
  const [roomStore, setRoomStore] = useState<StoreResource>();
  const [therapistStore, setTherapistStore] = useState<StoreResource>();
  const [rooms, setRooms] = useState<RoomResource[]>([]);
  const [therapists, setTherapists] = useState<TherapistResource[]>([]);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomEditing, setRoomEditing] = useState<RoomResource>();
  const [therapistModalOpen, setTherapistModalOpen] = useState(false);
  const [therapistEditing, setTherapistEditing] = useState<TherapistResource>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [storeRows, regionRows] = await Promise.all([
        storeResourceApi.list(),
        adminRemoteApi.getRegionOptions().catch(() => [])
      ]);
      setRows(storeRows);
      setRegions(regionRows);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '门店数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visibleRows = useMemo(() => {
    const value = keyword.trim();
    return value ? rows.filter((row) => `${row.name}${row.address}${row.manager ?? ''}${row.phone}`.includes(value)) : rows;
  }, [keyword, rows]);

  const openForm = (record?: StoreResource) => { setEditing(record); setModalOpen(true); };
  const remove = async (id: string) => {
    try { await storeResourceApi.remove(id); message.success('门店已删除'); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '门店删除失败'); }
  };

  const openRooms = async (record: StoreResource) => {
    setRoomStore(record);
    setRoomEditing(undefined);
    try { setRooms((await roomResourceApi.list()).filter((room) => room.storeId === record.id || room.store === record.name)); }
    catch (error) { message.error(error instanceof Error ? error.message : '房间数据加载失败'); }
  };
  const openTherapists = async (record: StoreResource) => {
    setTherapistStore(record);
    setTherapistEditing(undefined);
    try { setTherapists((await therapistResourceApi.list()).filter((t) => t.storeId === record.id || t.store === record.name)); }
    catch (error) { message.error(error instanceof Error ? error.message : '技师数据加载失败'); }
  };
  const removeRoom = async (id: string) => {
    try { await roomResourceApi.remove(id); message.success('房间已删除'); if (roomStore) await openRooms(roomStore); }
    catch (error) { message.error(error instanceof Error ? error.message : '房间删除失败'); }
  };
  const removeTherapist = async (id: string) => {
    try { await therapistResourceApi.remove(id); message.success('技师已删除'); if (therapistStore) await openTherapists(therapistStore); }
    catch (error) { message.error(error instanceof Error ? error.message : '技师删除失败'); }
  };

  const formInitialValues: Partial<StoreFormValues> = editing ? {
    code: editing.code ?? editing.id.replace(/^store-/, '').replace(/-/g, '_').toUpperCase(),
    name: editing.name, phone: editing.phone,
    regionId: editing.regionId != null ? String(editing.regionId) : undefined,
    province: editing.province ?? '上海市', city: editing.city ?? '上海市', district: editing.district,
    address: editing.address, longitude: editing.longitude, latitude: editing.latitude,
    hours: parseHours(editing.businessHours || '10:00-22:00'), status: editing.status, enabled: editing.enabled ?? true
  } : {
    code: '', name: '', phone: '', province: '上海市', city: '上海市', district: '',
    address: '', hours: parseHours('10:00-22:00'), status: '营业中', enabled: true
  };

  const columns: ProColumns<StoreResource>[] = [
    { title: '门店', dataIndex: 'name', width: 150 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    {
      title: '店长', dataIndex: 'manager', width: 110,
      render: (_, record) => record.manager
        ? <Button type="link" size="small" onClick={() => setManagerStore(record)}>{record.manager}</Button>
        : '-'
    },
    { title: '营业时间', dataIndex: 'businessHours', width: 130 },
    {
      title: '房间', dataIndex: 'roomCount', width: 90,
      render: (_, record) => <Button type="link" size="small" onClick={() => void openRooms(record)}>{record.roomCount} 间</Button>
    },
    {
      title: '技师', dataIndex: 'therapistCount', width: 90,
      render: (_, record) => <Button type="link" size="small" onClick={() => void openTherapists(record)}>{record.therapistCount} 人</Button>
    },
    { title: '综合评分', dataIndex: 'rating', width: 100, render: (_, record) => record.rating != null ? `★ ${Number(record.rating).toFixed(1)}` : '—' },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, record) => <Tag color={record.status === '营业中' ? 'green' : 'default'}>{record.status}</Tag> },
    {
      title: '操作', valueType: 'option', width: 140,
      render: (_, record) => (
        <Space size={2}>
          {can(session, 'store:update') && <Button type="text" size="small" onClick={() => openForm(record)}>编辑</Button>}
          {can(session, 'store:delete') && <Popconfirm title="确认删除该门店？" description="存在业务数据时服务端将拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger>删除</Button></Popconfirm>}
        </Space>
      )
    }
  ];

  return (
    <PageContainer
      header={{ title: '门店管理', subTitle: '统一维护品牌门店基础信息、营业时间、区域与门店资源。' }}
      extra={can(session, 'store:create') ? [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增门店</Button>] : []}
    >
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索门店、地址或店长" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
        </div>
        <ProTable<StoreResource> rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} search={false} scroll={{ x: 1100 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 家门店` }} />
      </ProCard>

      <ModalForm<StoreFormValues>
        title={editing ? '编辑门店' : '新增门店'}
        width={640}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={formInitialValues}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (values) => {
          const command: StoreCommand = {
            code: values.code, name: values.name, phone: values.phone,
            regionId: values.regionId ? Number(values.regionId) : undefined,
            province: values.province, city: values.city, district: values.district,
            address: values.address, longitude: values.longitude, latitude: values.latitude,
            businessHours: `${values.hours[0].format('HH:mm')}-${values.hours[1].format('HH:mm')}`,
            status: values.status, enabled: values.enabled
          };
          try {
            if (editing) await storeResourceApi.update(editing.id, command); else await storeResourceApi.create(command);
            message.success(editing ? '门店已更新' : '门店已创建');
            await load();
            return true;
          } catch (error) {
            message.error(error instanceof Error ? error.message : '门店保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="code" label="门店编码" rules={[{ required: true, message: '请输入门店编码' }, { pattern: /^[A-Za-z0-9_-]{2,32}$/, message: '请输入 2-32 位字母、数字、下划线或短横线' }]} disabled={!!editing} placeholder="例如 JING_AN" />
        <ProFormText name="name" label="门店名称" rules={[{ required: true, message: '请输入门店名称' }]} />
        <ProFormText name="phone" label="联系电话" />
        <ProFormSelect name="regionId" label="所属区域" options={regions} fieldProps={{ showSearch: true, optionFilterProp: 'label', placeholder: '请选择运营区域' }} />
        <ProForm.Item name="hours" label="营业时间" rules={[{ required: true, message: '请选择营业时间' }]}>
          <TimePicker.RangePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
        </ProForm.Item>
        <ProForm.Item label="门店位置" tooltip="配置高德地图密钥后可在地图上选点">
          <MapPicker value={{ longitude: editing?.longitude, latitude: editing?.latitude }} />
        </ProForm.Item>
        <ProFormText name="address" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]} />
        <ProForm.Group>
          <ProFormText name="province" label="省份" />
          <ProFormText name="city" label="城市" />
          <ProFormText name="district" label="区县" />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormDigit name="longitude" label="经度" min={-180} max={180} fieldProps={{ precision: 6 }} />
          <ProFormDigit name="latitude" label="纬度" min={-90} max={90} fieldProps={{ precision: 6 }} />
        </ProForm.Group>
        {editing && <div style={{ marginBottom: 16, color: '#666a66' }}>综合评分：{editing.rating != null ? `★ ${Number(editing.rating).toFixed(1)}` : '—'}（由客户评价自动计算，不可手动修改）</div>}
        <ProFormSelect name="status" label="营业状态" rules={[{ required: true, message: '请选择营业状态' }]} options={[{ label: '营业中', value: '营业中' }, { label: '休息中', value: '休息中' }]} />
        <ProFormSwitch name="enabled" label="启用门店" checkedChildren="启用" unCheckedChildren="停用" />
      </ModalForm>

      <Drawer title={managerStore ? `${managerStore.name} · 店长信息` : '店长信息'} width={420} open={!!managerStore} onClose={() => setManagerStore(undefined)}>
        {managerStore?.manager ? (
          <Descriptions column={1} bordered size="small" items={[
            { key: 'name', label: '店长姓名', children: managerStore.manager },
            { key: 'position', label: '岗位', children: managerStore.managerPosition || '店长' },
            { key: 'mobile', label: '手机号', children: managerStore.managerMobile || '-' },
            { key: 'storePhone', label: '门店电话', children: managerStore.phone || '-' }
          ]} />
        ) : <Empty description="该门店尚未配置店长" />}
      </Drawer>

      <Drawer title={roomStore ? `${roomStore.name} · 房间信息` : '房间信息'} width={720} open={!!roomStore} onClose={() => setRoomStore(undefined)} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setRoomEditing(undefined); setRoomModalOpen(true); }}>新增房间</Button>}>
        <Table<RoomResource>
          rowKey="id"
          size="small"
          dataSource={rooms}
          pagination={false}
          locale={{ emptyText: <Empty description="该门店暂无房间" /> }}
          columns={[
            { title: '房间', dataIndex: 'name' },
            { title: '用途', dataIndex: 'type' },
            { title: '容量', dataIndex: 'capacity', width: 80, render: (v?: number) => `${v ?? 1} 人` },
            { title: '状态', dataIndex: 'status', width: 100, render: (v: RoomResource['status']) => <Tag color={roomStatusColor(v)}>{roomStatusLabel(v)}</Tag> },
            {
              title: '操作', key: 'actions', width: 120,
              render: (_, record) => (
                <Space size={2}>
                  <Button type="text" size="small" onClick={() => { setRoomEditing(record); setRoomModalOpen(true); }}>编辑</Button>
                  <Popconfirm title="确认删除该房间？" onConfirm={() => removeRoom(record.id)}><Button type="text" size="small" danger>删除</Button></Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Drawer>

      <Drawer title={therapistStore ? `${therapistStore.name} · 技师信息` : '技师信息'} width={720} open={!!therapistStore} onClose={() => setTherapistStore(undefined)} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setTherapistEditing(undefined); setTherapistModalOpen(true); }}>新增技师</Button>}>
        <Table<TherapistResource>
          rowKey="id"
          size="small"
          dataSource={therapists}
          pagination={false}
          locale={{ emptyText: <Empty description="该门店暂无技师" /> }}
          columns={[
            { title: '技师', dataIndex: 'name' },
            { title: '等级', dataIndex: 'level' },
            { title: '擅长', dataIndex: 'skills', render: (skills: string[]) => <Space size={[4, 4]} wrap>{skills.map((s) => <Tag key={s}>{s}</Tag>)}</Space> },
            { title: '状态', dataIndex: 'status', width: 90, render: (v: TherapistResource['status']) => <Tag color={therapistStatusColor(v)}>{v}</Tag> },
            {
              title: '操作', key: 'actions', width: 120,
              render: (_, record) => (
                <Space size={2}>
                  <Button type="text" size="small" onClick={() => { setTherapistEditing(record); setTherapistModalOpen(true); }}>编辑</Button>
                  <Popconfirm title="确认删除该技师？" description="存在未完成预约时服务端将拒绝删除。" onConfirm={() => removeTherapist(record.id)}><Button type="text" size="small" danger>删除</Button></Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Drawer>

      <ModalForm<RoomCommand>
        title={roomEditing ? '编辑房间' : '新增房间'}
        width={560}
        open={roomModalOpen}
        onOpenChange={setRoomModalOpen}
        key={roomEditing?.id ?? 'new'}
        initialValues={roomEditing ? {
          code: roomEditing.code ?? roomEditing.id, name: roomEditing.name,
          type: roomEditing.type, status: roomEditing.status, capacity: roomEditing.capacity ?? 1, note: roomEditing.note, enabled: roomEditing.enabled ?? true
        } : { status: 'AVAILABLE', capacity: 1, enabled: true }}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (command) => {
          const payload: RoomCommand = { ...command, storeId: roomStore?.id ?? roomEditing?.storeId ?? '' };
          try {
            if (roomEditing) await roomResourceApi.update(roomEditing.id, payload); else await roomResourceApi.create(payload);
            message.success(roomEditing ? '房间已更新' : '房间已创建');
            if (roomStore) await openRooms(roomStore);
            return true;
          } catch (error) { message.error(error instanceof Error ? error.message : '房间保存失败'); return false; }
        }}
      >
        <ProForm.Group>
          <ProFormText name="code" label="房间编码" rules={[{ required: true, message: '请输入房间编码' }]} disabled={!!roomEditing} />
          <ProFormText name="name" label="房间名称" rules={[{ required: true, message: '请输入房间名称' }]} />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormText name="type" label="房间用途" rules={[{ required: true, message: '请输入房间用途' }]} />
          <ProFormDigit name="capacity" label="接待人数" rules={[{ required: true }]} min={1} />
          <ProFormSelect name="status" label="资源状态" rules={[{ required: true }]} options={roomStatusOptions.map(({ label, value }) => ({ label, value }))} />
        </ProForm.Group>
        <ProFormText name="note" label="房间备注" />
        <ProFormSwitch name="enabled" label="启用房间" checkedChildren="启用" unCheckedChildren="停用" />
      </ModalForm>

      <ModalForm<TherapistCommand>
        title={therapistEditing ? '编辑技师' : '新增技师'}
        width={560}
        open={therapistModalOpen}
        onOpenChange={setTherapistModalOpen}
        key={therapistEditing?.id ?? 'new'}
        initialValues={therapistEditing ? {
          code: therapistEditing.code ?? therapistEditing.id, name: therapistEditing.name, level: therapistEditing.level,
          skills: therapistEditing.skills, status: therapistEditing.status, rating: therapistEditing.rating, specifyFee: therapistEditing.specifyFee ?? 0, enabled: therapistEditing.enabled ?? true
        } : { level: '专业技师', skills: [], status: '可预约', rating: 5, specifyFee: 0, enabled: true }}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (command) => {
          const payload: TherapistCommand = { ...command, storeId: therapistStore?.id ?? therapistEditing?.storeId ?? '' };
          try {
            if (therapistEditing) await therapistResourceApi.update(therapistEditing.id, payload); else await therapistResourceApi.create(payload);
            message.success(therapistEditing ? '技师资料已更新' : '技师已创建');
            if (therapistStore) await openTherapists(therapistStore);
            return true;
          } catch (error) { message.error(error instanceof Error ? error.message : '技师保存失败'); return false; }
        }}
      >
        <ProForm.Group>
          <ProFormText name="code" label="技师编码" rules={[{ required: true, message: '请输入技师编码' }]} disabled={!!therapistEditing} />
          <ProFormText name="name" label="技师姓名" rules={[{ required: true, message: '请输入技师姓名' }]} />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormText name="level" label="技师等级" rules={[{ required: true, message: '请输入技师等级' }]} />
          <ProFormSelect name="status" label="工作状态" rules={[{ required: true }]} options={[{ label: '可预约', value: '可预约' }, { label: '服务中', value: '服务中' }, { label: '休假', value: '休假' }]} />
        </ProForm.Group>
        <ProFormSelect name="skills" label="擅长项目" rules={[{ required: true, message: '请至少填写一个技能' }]} mode="tags" fieldProps={{ tokenSeparators: [',', '，'], placeholder: '输入技能后按回车' }} />
        <ProFormSwitch name="enabled" label="启用技师" checkedChildren="启用" unCheckedChildren="停用" />
      </ModalForm>
    </PageContainer>
  );
}
