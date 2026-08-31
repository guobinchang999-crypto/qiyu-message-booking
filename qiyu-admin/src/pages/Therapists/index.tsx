import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { storeResourceApi, therapistResourceApi } from '@/services/resource-service';
import type { StoreResource, TherapistCommand, TherapistResource } from '@/services/resource-service';

const initialValues: TherapistCommand = { code: '', storeId: '', name: '', level: '专业技师', skills: [], status: '可预约', rating: 5, specifyFee: 0, enabled: true };

export default function TherapistsPage() {
  const session = readAdminSession();
  const [form] = Form.useForm<TherapistCommand>();
  const [rows, setRows] = useState<TherapistResource[]>([]);
  const [stores, setStores] = useState<StoreResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TherapistResource>();
  const manageable = can(session, 'therapist:manage') || can(session, 'staff:manage');
  const load = useCallback(async () => {
    setLoading(true);
    try { const [therapists, storeRows] = await Promise.all([therapistResourceApi.list(), storeResourceApi.list()]); setRows(therapists); setStores(storeRows); }
    catch (error) { message.error(error instanceof Error ? error.message : '技师数据加载失败'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const visibleRows = useMemo(() => keyword.trim() ? rows.filter((row) => `${row.name}${row.store}${row.level}${row.skills.join('')}`.includes(keyword.trim())) : rows, [keyword, rows]);
  const storeOptions = stores.map((store) => ({ label: store.name, value: store.id }));
  const showForm = (record?: TherapistResource) => {
    setEditing(record);
    form.setFieldsValue(record ? { code: record.code ?? record.id, storeId: record.storeId ?? stores.find((store) => store.name === record.store)?.id ?? '', name: record.name, level: record.level, skills: record.skills, status: record.status, rating: record.rating, specifyFee: record.specifyFee ?? 0, enabled: record.enabled ?? true } : { ...initialValues, storeId: stores[0]?.id ?? '' });
    setOpen(true);
  };
  const submit = async () => { const command = await form.validateFields(); setSaving(true); try { if (editing) await therapistResourceApi.update(editing.id, command); else await therapistResourceApi.create(command); message.success(editing ? '技师资料已更新' : '技师已创建'); setOpen(false); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '技师保存失败'); } finally { setSaving(false); } };
  const remove = async (id: string) => { try { await therapistResourceApi.remove(id); message.success('技师已删除'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '技师删除失败'); } };
  const columns: ColumnsType<TherapistResource> = [
    { title: '技师', dataIndex: 'name' }, { title: '所属门店', dataIndex: 'store' }, { title: '等级', dataIndex: 'level' },
    { title: '擅长项目', dataIndex: 'skills', width: 250, render: (skills: string[]) => <Space size={[4, 4]} wrap>{skills.map((skill) => <Tag key={skill}>{skill}</Tag>)}</Space> },
    { title: '状态', dataIndex: 'status', width: 90, render: (status: TherapistResource['status']) => <Tag color={status === '可预约' ? 'green' : status === '服务中' ? 'blue' : 'orange'}>{status}</Tag> },
    { title: '评分', dataIndex: 'rating', width: 70 }, { title: '今日预约', dataIndex: 'todayBookings', width: 90, render: (value: number) => `${value} 单` },
    ...(manageable ? [{ title: '操作', key: 'actions', fixed: 'right' as const, width: 140, render: (_: unknown, record: TherapistResource) => <Space size={2}><Button type="text" size="small" icon={<EditOutlined />} onClick={() => showForm(record)}>编辑</Button><Popconfirm title="确认删除该技师？" description="存在未完成预约时服务端将拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> }] : [])
  ];
  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">技师管理</h1><div className="qiyu-page-description">统一维护技师状态、技能标签、所属门店和今日预约负载。</div></div>{manageable && <Button type="primary" icon={<PlusOutlined />} disabled={!stores.length} onClick={() => showForm()}>新增技师</Button>}</div>
    <Card className="qiyu-card"><div className="qiyu-toolbar"><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索技师、门店、等级或技能" style={{ width: 320 }} /><Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button></div><Table rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} scroll={{ x: 1100 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 位技师` }} /></Card>
    <Modal title={editing ? '编辑技师' : '新增技师'} open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} width={620} destroyOnHidden><Form form={form} layout="vertical" preserve={false} initialValues={initialValues} style={{ marginTop: 20 }}>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="code" label="技师编码" rules={[{ required: true }]} style={{ flex: 1 }}><Input disabled={!!editing} /></Form.Item><Form.Item name="name" label="技师姓名" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item></Space>
      <Form.Item name="storeId" label="所属门店" rules={[{ required: true }]}><Select options={storeOptions} showSearch optionFilterProp="label" /></Form.Item>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="level" label="技师等级" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item><Form.Item name="status" label="工作状态" rules={[{ required: true }]} style={{ flex: 1 }}><Select options={[{ label: '可预约', value: '可预约' }, { label: '服务中', value: '服务中' }, { label: '休假', value: '休假' }]} /></Form.Item></Space>
      <Form.Item name="skills" label="擅长项目" rules={[{ required: true, message: '请至少填写一个技能' }]}><Select mode="tags" tokenSeparators={[',', '，']} placeholder="输入技能后按回车" /></Form.Item>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="rating" label="评分" style={{ flex: 1 }}><InputNumber min={0} max={5} precision={1} style={{ width: '100%' }} /></Form.Item><Form.Item name="specifyFee" label="指定服务费" style={{ flex: 1 }}><InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} /></Form.Item></Space>
      <Form.Item name="enabled" label="启用技师" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="停用" /></Form.Item>
    </Form></Modal>
  </div>;
}
