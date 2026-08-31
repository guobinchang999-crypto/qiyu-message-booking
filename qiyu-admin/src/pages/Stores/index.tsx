import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { storeResourceApi } from '@/services/resource-service';
import type { StoreCommand, StoreResource } from '@/services/resource-service';

const initialValues: StoreCommand = {
  code: '', name: '', phone: '', province: '上海市', city: '上海市', district: '', address: '',
  businessHours: '10:00-22:00', status: '营业中', rating: 5, sortOrder: 0, enabled: true
};

export default function StoresPage() {
  const session = readAdminSession();
  const [form] = Form.useForm<StoreCommand>();
  const [rows, setRows] = useState<StoreResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StoreResource>();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await storeResourceApi.list()); }
    catch (error) { message.error(error instanceof Error ? error.message : '门店数据加载失败'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visibleRows = useMemo(() => {
    const value = keyword.trim();
    return value ? rows.filter((row) => `${row.name}${row.address}${row.manager ?? ''}${row.phone}`.includes(value)) : rows;
  }, [keyword, rows]);
  const showForm = (record?: StoreResource) => {
    setEditing(record);
    form.setFieldsValue(record ? {
      code: record.code ?? record.id.replace(/^store-/, '').replace(/-/g, '_').toUpperCase(), regionId: record.regionId,
      name: record.name, phone: record.phone, province: record.province ?? '上海市', city: record.city ?? '上海市',
      district: record.district, address: record.address, longitude: record.longitude, latitude: record.latitude,
      businessHours: record.businessHours, status: record.status, rating: record.rating ?? 5,
      sortOrder: record.sortOrder ?? 0, enabled: record.enabled ?? true
    } : initialValues);
    setOpen(true);
  };
  const submit = async () => {
    const command = await form.validateFields();
    setSaving(true);
    try {
      if (editing) await storeResourceApi.update(editing.id, command); else await storeResourceApi.create(command);
      message.success(editing ? '门店已更新' : '门店已创建');
      setOpen(false);
      await load();
    } catch (error) { message.error(error instanceof Error ? error.message : '门店保存失败'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    try { await storeResourceApi.remove(id); message.success('门店已删除'); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '门店删除失败'); }
  };
  const columns: ColumnsType<StoreResource> = [
    { title: '门店', dataIndex: 'name', width: 150 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    { title: '店长', dataIndex: 'manager', render: (value: string | null) => value || '-' },
    { title: '营业时间', dataIndex: 'businessHours', width: 130 },
    { title: '房间', dataIndex: 'roomCount', width: 80, render: (value: number) => `${value} 间` },
    { title: '技师', dataIndex: 'therapistCount', width: 80, render: (value: number) => `${value} 人` },
    { title: '状态', dataIndex: 'status', width: 90, render: (value: StoreResource['status']) => <Tag color={value === '营业中' ? 'green' : 'default'}>{value}</Tag> },
    { title: '操作', key: 'actions', fixed: 'right', width: 140, render: (_, record) => <Space size={2}>
      {can(session, 'store:update') && <Button type="text" size="small" icon={<EditOutlined />} onClick={() => showForm(record)}>编辑</Button>}
      {can(session, 'store:delete') && <Popconfirm title="确认删除该门店？" description="存在业务数据时服务端将拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} title="删除" /></Popconfirm>}
    </Space> }
  ];

  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">门店管理</h1><div className="qiyu-page-description">统一维护品牌门店基础信息、营业时间、房间与技师规模。</div></div>{can(session, 'store:create') && <Button type="primary" icon={<PlusOutlined />} onClick={() => showForm()}>新增门店</Button>}</div>
    <Card className="qiyu-card"><div className="qiyu-toolbar"><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索门店、地址或店长" style={{ width: 300 }} /><Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button></div><Table rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} scroll={{ x: 1050 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 家门店` }} /></Card>
    <Modal title={editing ? '编辑门店' : '新增门店'} open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} width={680} destroyOnHidden>
      <Form form={form} layout="vertical" preserve={false} style={{ marginTop: 20 }} initialValues={initialValues}>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="code" label="门店编码" rules={[{ required: true }, { pattern: /^[A-Za-z0-9_-]{2,32}$/, message: '请输入 2-32 位字母、数字、下划线或短横线' }]} style={{ flex: 1 }}><Input disabled={!!editing} placeholder="例如 JING_AN" /></Form.Item><Form.Item name="name" label="门店名称" rules={[{ required: true, message: '请输入门店名称' }]} style={{ flex: 1 }}><Input /></Form.Item></Space>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="phone" label="联系电话" style={{ flex: 1 }}><Input /></Form.Item><Form.Item name="businessHours" label="营业时间" rules={[{ required: true }, { pattern: /^\d{2}:\d{2}-\d{2}:\d{2}$/, message: '格式应为 HH:mm-HH:mm' }]} style={{ flex: 1 }}><Input /></Form.Item></Space>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="province" label="省份" style={{ flex: 1 }}><Input /></Form.Item><Form.Item name="city" label="城市" style={{ flex: 1 }}><Input /></Form.Item><Form.Item name="district" label="区县" style={{ flex: 1 }}><Input /></Form.Item></Space>
        <Form.Item name="address" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]}><Input /></Form.Item>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="longitude" label="经度" style={{ flex: 1 }}><InputNumber min={-180} max={180} precision={6} style={{ width: '100%' }} /></Form.Item><Form.Item name="latitude" label="纬度" style={{ flex: 1 }}><InputNumber min={-90} max={90} precision={6} style={{ width: '100%' }} /></Form.Item><Form.Item name="regionId" label="区域 ID" style={{ flex: 1 }}><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item></Space>
        <Space align="start" style={{ display: 'flex' }}><Form.Item name="status" label="营业状态" rules={[{ required: true }]} style={{ flex: 1 }}><Select options={[{ label: '营业中', value: '营业中' }, { label: '休息中', value: '休息中' }]} /></Form.Item><Form.Item name="rating" label="门店评分" style={{ flex: 1 }}><InputNumber min={0} max={5} precision={1} style={{ width: '100%' }} /></Form.Item><Form.Item name="sortOrder" label="展示顺序" style={{ flex: 1 }}><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item></Space>
        <Form.Item name="enabled" label="启用门店" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="停用" /></Form.Item>
      </Form>
    </Modal>
  </div>;
}
