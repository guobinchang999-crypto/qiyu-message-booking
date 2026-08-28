import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import type { SystemPage } from '@/types/system';

export interface SystemFormField {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'select' | 'switch' | 'tags' | 'textarea';
  options?: Array<{ label: string; value: string | boolean }>;
  placeholder?: string;
}

interface SystemCrudPageProps<T extends { id: string }> {
  title: string;
  description: string;
  permissionHint: string;
  columns: ColumnsType<T>;
  fields: SystemFormField[];
  list: (query: { keyword?: string; page: number; pageSize: number }) => Promise<SystemPage<T>>;
  save: (payload: Partial<T> & { id?: string }) => Promise<T>;
  remove: (id: string) => Promise<void>;
  initialValues?: Partial<T>;
}

const FieldControl = ({ field }: { field: SystemFormField }) => {
  if (field.type === 'number') return <InputNumber min={0} style={{ width: '100%' }} placeholder={field.placeholder} />;
  if (field.type === 'select') return <Select options={field.options} placeholder={field.placeholder} />;
  if (field.type === 'switch') return <Switch checkedChildren="是" unCheckedChildren="否" />;
  if (field.type === 'tags') return <Select mode="tags" tokenSeparators={[',']} options={field.options} placeholder={field.placeholder} />;
  if (field.type === 'textarea') return <Input.TextArea rows={3} placeholder={field.placeholder} />;
  return <Input placeholder={field.placeholder} />;
};

export const statusColumn = <T extends { status: string }>(): ColumnsType<T>[number] => ({
  title: '状态', dataIndex: 'status', width: 90,
  render: (value: string) => <Tag color={value === 'ENABLED' ? 'success' : 'default'}>{value === 'ENABLED' ? '启用' : '停用'}</Tag>
});

export default function SystemCrudPage<T extends { id: string }>(props: SystemCrudPageProps<T>) {
  const [form] = Form.useForm();
  const [rows, setRows] = useState<T[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<T>();
  const load = useCallback(async () => {
    setLoading(true);
    try { const result = await props.list({ keyword, page: 1, pageSize: 100 }); setRows(result.records); }
    catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); }
    finally { setLoading(false); }
  }, [keyword, props.list]);
  useEffect(() => { void load(); }, [load]);
  const showForm = (record?: T) => {
    setActive(record);
    form.resetFields();
    form.setFieldsValue(record || props.initialValues || {});
    setOpen(true);
  };
  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await props.save({ ...values, ...(active ? { id: active.id } : {}) });
      message.success(active ? '更新成功' : '创建成功');
      setOpen(false);
      await load();
    } catch (error) { message.error(error instanceof Error ? error.message : '保存失败'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    try { await props.remove(id); message.success('删除成功'); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '删除失败'); }
  };
  const columns: ColumnsType<T> = [...props.columns, {
    title: '操作', key: 'actions', width: 130, fixed: 'right',
    render: (_, record) => <Space size={4}>
      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => showForm(record)}>编辑</Button>
      <Popconfirm title="确认删除该记录？" description="删除后无法恢复，请确认没有业务数据引用。" onConfirm={() => remove(record.id)}><Button type="text" danger size="small" icon={<DeleteOutlined />} /></Popconfirm>
    </Space>
  }];
  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">{props.title}</h1><div className="qiyu-page-description">{props.description}</div></div><Button type="primary" icon={<PlusOutlined />} onClick={() => showForm()}>新增</Button></div>
    <Card className="qiyu-card">
      <div className="qiyu-toolbar"><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} onPressEnter={load} prefix={<SearchOutlined />} placeholder={`搜索${props.title}`} style={{ width: 300 }} /><Button icon={<ReloadOutlined />} onClick={load}>刷新</Button><Tag bordered={false} color="blue">权限码：{props.permissionHint}</Tag></div>
      <Table<T> rowKey="id" loading={loading} columns={columns} dataSource={rows} scroll={{ x: 1050 }} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }} />
    </Card>
    <Modal title={active ? `编辑${props.title}` : `新增${props.title}`} open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} destroyOnClose>
      <Form form={form as FormInstance} layout="vertical" preserve={false} style={{ marginTop: 20 }}>
        {props.fields.map((field) => <Form.Item key={field.name} name={field.name} label={field.label} valuePropName={field.type === 'switch' ? 'checked' : 'value'} rules={field.required ? [{ required: true, message: `请填写${field.label}` }] : undefined}><FieldControl field={field} /></Form.Item>)}
      </Form>
    </Modal>
  </div>;
}
