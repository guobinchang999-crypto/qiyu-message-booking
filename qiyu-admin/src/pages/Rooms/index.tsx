import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { roomResourceApi, storeResourceApi } from '@/services/resource-service';
import type { RoomCommand, RoomResource, RoomWorkingStatus, StoreResource } from '@/services/resource-service';

const statusOptions: Array<{ label: string; value: RoomWorkingStatus; color: string }> = [
  { label: '空闲', value: 'AVAILABLE', color: 'green' }, { label: '已预约', value: 'BOOKED', color: 'blue' },
  { label: '使用中', value: 'IN_USE', color: 'processing' }, { label: '清洁中', value: 'CLEANING', color: 'orange' },
  { label: '维护中', value: 'MAINTENANCE', color: 'default' }
];
const initialValues: RoomCommand = { code: '', storeId: '', name: '', type: '推拿房', status: 'AVAILABLE', capacity: 1, note: '', enabled: true };
const statusMeta = (status: RoomWorkingStatus) => statusOptions.find((option) => option.value === status) ?? statusOptions[4];

export default function RoomsPage() {
  const session = readAdminSession();
  const [form] = Form.useForm<RoomCommand>();
  const [rows, setRows] = useState<RoomResource[]>([]);
  const [stores, setStores] = useState<StoreResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomResource>();
  const manageable = can(session, 'room:manage');
  const load = useCallback(async () => { setLoading(true); try { const [rooms, storeRows] = await Promise.all([roomResourceApi.list(), storeResourceApi.list()]); setRows(rooms); setStores(storeRows); } catch (error) { message.error(error instanceof Error ? error.message : '房间数据加载失败'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visibleRows = useMemo(() => keyword.trim() ? rows.filter((row) => `${row.name}${row.store ?? ''}${row.type}${row.note ?? ''}`.includes(keyword.trim())) : rows, [keyword, rows]);
  const storeOptions = stores.map((store) => ({ label: store.name, value: store.id }));
  const showForm = (record?: RoomResource) => {
    setEditing(record);
    form.setFieldsValue(record ? { code: record.code ?? record.id, storeId: record.storeId ?? stores.find((store) => store.name === record.store)?.id ?? '', name: record.name, type: record.type, status: record.status, capacity: record.capacity ?? 1, note: record.note, enabled: record.enabled ?? true } : { ...initialValues, storeId: stores[0]?.id ?? '' });
    setOpen(true);
  };
  const submit = async () => { const command = await form.validateFields(); setSaving(true); try { if (editing) await roomResourceApi.update(editing.id, command); else await roomResourceApi.create(command); message.success(editing ? '房间已更新' : '房间已创建'); setOpen(false); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '房间保存失败'); } finally { setSaving(false); } };
  const remove = async (id: string) => { try { await roomResourceApi.remove(id); message.success('房间已删除'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '房间删除失败'); } };
  const columns: ColumnsType<RoomResource> = [
    { title: '房间', dataIndex: 'name' }, { title: '所属门店', dataIndex: 'store', render: (value?: string) => value || '-' },
    { title: '用途', dataIndex: 'type' }, { title: '容量', dataIndex: 'capacity', width: 80, render: (value?: number) => `${value ?? 1} 人` },
    { title: '状态', dataIndex: 'status', width: 90, render: (status: RoomWorkingStatus) => { const meta = statusMeta(status); return <Tag color={meta.color}>{meta.label}</Tag>; } },
    { title: '备注', dataIndex: 'note', ellipsis: true, render: (value?: string) => value || '-' },
    ...(manageable ? [{ title: '操作', key: 'actions', fixed: 'right' as const, width: 140, render: (_: unknown, record: RoomResource) => <Space size={2}><Button type="text" size="small" icon={<EditOutlined />} onClick={() => showForm(record)}>编辑</Button><Popconfirm title="确认删除该房间？" description="存在预约或资源占用时服务端将拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> }] : [])
  ];
  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">房间管理</h1><div className="qiyu-page-description">维护门店房间档案与实时资源状态，预约排房使用同一稳定资源 ID。</div></div>{manageable && <Button type="primary" icon={<PlusOutlined />} disabled={!stores.length} onClick={() => showForm()}>新增房间</Button>}</div>
    <Card className="qiyu-card"><div className="qiyu-toolbar"><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索房间、门店、用途或备注" style={{ width: 320 }} /><Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button></div><Table rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} scroll={{ x: 980 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个房间` }} /></Card>
    <Modal title={editing ? '编辑房间' : '新增房间'} open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} width={580} destroyOnHidden><Form form={form} layout="vertical" preserve={false} initialValues={initialValues} style={{ marginTop: 20 }}>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="code" label="房间编码" rules={[{ required: true }]} style={{ flex: 1 }}><Input disabled={!!editing} /></Form.Item><Form.Item name="name" label="房间名称" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item></Space>
      <Form.Item name="storeId" label="所属门店" rules={[{ required: true }]}><Select options={storeOptions} showSearch optionFilterProp="label" /></Form.Item>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="type" label="房间用途" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item><Form.Item name="capacity" label="接待人数" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item><Form.Item name="status" label="资源状态" rules={[{ required: true }]} style={{ flex: 1 }}><Select options={statusOptions.map(({ label, value }) => ({ label, value }))} /></Form.Item></Space>
      <Form.Item name="note" label="房间备注"><Input.TextArea rows={3} maxLength={200} showCount /></Form.Item><Form.Item name="enabled" label="启用房间" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="停用" /></Form.Item>
    </Form></Modal>
  </div>;
}
