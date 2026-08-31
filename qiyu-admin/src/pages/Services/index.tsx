import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { serviceResourceApi } from '@/services/resource-service';
import type { ServiceCommand, ServiceResource } from '@/services/resource-service';

const initialValues: ServiceCommand = { code: '', name: '', category: '', durationMinutes: 60, preparationMinutes: 10, cleanupMinutes: 10, price: 0, memberPrice: 0, description: '', status: '上架', enabled: true };

export default function ServicesPage() {
  const session = readAdminSession();
  const [form] = Form.useForm<ServiceCommand>();
  const [rows, setRows] = useState<ServiceResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceResource>();
  const manageable = can(session, 'service:manage');
  const load = useCallback(async () => { setLoading(true); try { setRows(await serviceResourceApi.list()); } catch (error) { message.error(error instanceof Error ? error.message : '服务项目加载失败'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visibleRows = useMemo(() => keyword.trim() ? rows.filter((row) => `${row.name}${row.category}${row.status}`.includes(keyword.trim())) : rows, [keyword, rows]);
  const showForm = (record?: ServiceResource) => {
    setEditing(record);
    form.setFieldsValue(record ? { code: record.code ?? record.id, name: record.name, category: record.category, durationMinutes: record.durationMinutes, preparationMinutes: record.preparationMinutes ?? 10, cleanupMinutes: record.cleanupMinutes ?? 10, price: record.price, memberPrice: record.memberPrice, description: record.description, status: record.status, enabled: record.enabled ?? true } : initialValues);
    setOpen(true);
  };
  const submit = async () => { const command = await form.validateFields(); setSaving(true); try { if (editing) await serviceResourceApi.update(editing.id, command); else await serviceResourceApi.create(command); message.success(editing ? '服务项目已更新' : '服务项目已创建'); setOpen(false); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '服务项目保存失败'); } finally { setSaving(false); } };
  const remove = async (id: string) => { try { await serviceResourceApi.remove(id); message.success('服务项目已删除'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '服务项目删除失败'); } };
  const columns: ColumnsType<ServiceResource> = [
    { title: '项目名称', dataIndex: 'name' }, { title: '分类', dataIndex: 'category' },
    { title: '服务时长', dataIndex: 'durationMinutes', width: 100, render: (value: number) => `${value} 分钟` },
    { title: '标准价', dataIndex: 'price', width: 90, render: (value: number) => `¥${value}` },
    { title: '会员价', dataIndex: 'memberPrice', width: 90, render: (value: number) => `¥${value}` },
    { title: '状态', dataIndex: 'status', width: 80, render: (value: ServiceResource['status']) => <Tag color={value === '上架' ? 'green' : 'default'}>{value}</Tag> },
    { title: '累计预约', dataIndex: 'bookingCount', width: 100, render: (value: number) => `${value} 次` },
    ...(manageable ? [{ title: '操作', key: 'actions', fixed: 'right' as const, width: 140, render: (_: unknown, record: ServiceResource) => <Space size={2}><Button type="text" size="small" icon={<EditOutlined />} onClick={() => showForm(record)}>编辑</Button><Popconfirm title="确认删除该服务项目？" description="已被预约引用的项目将由服务端拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> }] : [])
  ];
  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">服务项目</h1><div className="qiyu-page-description">维护项目时长、价格、会员价和上下架状态，客户端预约使用同一项目语义。</div></div>{manageable && <Button type="primary" icon={<PlusOutlined />} onClick={() => showForm()}>新增项目</Button>}</div>
    <Card className="qiyu-card"><div className="qiyu-toolbar"><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索项目、分类或状态" style={{ width: 300 }} /><Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button></div><Table rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} scroll={{ x: 980 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个项目` }} /></Card>
    <Modal title={editing ? '编辑服务项目' : '新增服务项目'} open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} width={620} destroyOnHidden><Form form={form} layout="vertical" preserve={false} initialValues={initialValues} style={{ marginTop: 20 }}>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="code" label="项目编码" rules={[{ required: true }]} style={{ flex: 1 }}><Input disabled={!!editing} /></Form.Item><Form.Item name="name" label="项目名称" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item></Space>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="category" label="服务分类" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item><Form.Item name="status" label="发布状态" rules={[{ required: true }]} style={{ flex: 1 }}><Select options={[{ label: '上架', value: '上架' }, { label: '下架', value: '下架' }]} /></Form.Item></Space>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="durationMinutes" label="服务时长（分钟）" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={10} step={10} style={{ width: '100%' }} /></Form.Item><Form.Item name="preparationMinutes" label="准备时间（分钟）" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item><Form.Item name="cleanupMinutes" label="清洁时间（分钟）" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Space>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="price" label="标准价" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} /></Form.Item><Form.Item name="memberPrice" label="会员价" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} /></Form.Item></Space>
      <Form.Item name="description" label="项目说明"><Input.TextArea rows={3} maxLength={500} showCount /></Form.Item><Form.Item name="enabled" label="启用项目" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="停用" /></Form.Item>
    </Form></Modal>
  </div>;
}
