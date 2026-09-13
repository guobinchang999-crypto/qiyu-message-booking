import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import { ModalForm, PageContainer, ProCard, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SystemPage } from '@/types/system';

export interface SystemFormField {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'select' | 'switch' | 'tags' | 'textarea';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

interface SystemCrudPageProps<T extends { id: string }> {
  title: string;
  description: string;
  permissionHint: string;
  columns: ProColumns<T>[];
  fields: SystemFormField[];
  list: (query: { keyword?: string; page: number; pageSize: number }) => Promise<SystemPage<T>>;
  save: (payload: Partial<T> & { id?: string }) => Promise<T>;
  remove: (id: string) => Promise<void>;
  initialValues?: Partial<T>;
  extraActions?: (record: T) => ReactNode;
  children?: ReactNode;
}

const FieldControl = ({ field }: { field: SystemFormField }) => {
  const rules = field.required ? [{ required: true, message: `请填写${field.label}` }] : undefined;
  if (field.type === 'number') return <ProFormDigit name={field.name} label={field.label} rules={rules} min={0} fieldProps={{ placeholder: field.placeholder, style: { width: '100%' } }} />;
  if (field.type === 'select') return <ProFormSelect name={field.name} label={field.label} rules={rules} options={field.options} fieldProps={{ placeholder: field.placeholder }} />;
  if (field.type === 'switch') return <ProFormSwitch name={field.name} label={field.label} checkedChildren="是" unCheckedChildren="否" />;
  if (field.type === 'tags') return <ProFormSelect name={field.name} label={field.label} rules={rules} mode="tags" options={field.options} fieldProps={{ tokenSeparators: [','], placeholder: field.placeholder }} />;
  if (field.type === 'textarea') return <ProFormTextArea name={field.name} label={field.label} rules={rules} fieldProps={{ rows: 3, placeholder: field.placeholder }} />;
  return <ProFormText name={field.name} label={field.label} rules={rules} fieldProps={{ placeholder: field.placeholder }} />;
};

export const statusColumn = <T extends { status: string }>(): ProColumns<T> => ({
  title: '状态',
  dataIndex: 'status',
  width: 90,
  render: (_, record) => <Tag color={record.status === 'ENABLED' ? 'success' : 'default'}>{record.status === 'ENABLED' ? '启用' : '停用'}</Tag>
});

export default function SystemCrudPage<T extends { id: string }>(props: SystemCrudPageProps<T>) {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T>();

  const openForm = (record?: T) => {
    setEditing(record);
    setModalOpen(true);
  };
  const submit = async (values: Partial<T>) => {
    try {
      await props.save({ ...values, ...(editing ? { id: editing.id } : {}) });
      message.success(editing ? '更新成功' : '创建成功');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
      return false;
    }
  };
  const remove = async (id: string) => {
    try { await props.remove(id); message.success('删除成功'); actionRef.current?.reload(); }
    catch (error) { message.error(error instanceof Error ? error.message : '删除失败'); }
  };

  const keywordColumn = { title: '关键词', dataIndex: 'keyword', hideInTable: true, hideInSearch: false, fieldProps: { placeholder: `搜索${props.title}` } } as ProColumns<T>;
  const columns: ProColumns<T>[] = [
    ...props.columns.map((column) => ({ ...column, hideInSearch: true })),
    keywordColumn,
    {
      title: '操作',
      valueType: 'option',
      width: props.extraActions ? 180 : 130,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openForm(record)}>编辑</Button>
          {props.extraActions?.(record)}
          <Popconfirm title="确认移除该记录？" description="移除后将不再用于后续业务，请确认当前没有业务引用。" onConfirm={() => remove(record.id)}><Button aria-label="移除" type="text" danger size="small" icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <PageContainer
      header={{ title: props.title, subTitle: props.description }}
      extra={[<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增</Button>]}
    >
      <ProCard>
        <ProTable<T>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 1050 }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }}
          toolBarRender={() => [<Button key="reload" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>刷新</Button>]}
          request={async (params) => {
            const { current = 1, pageSize = 10, keyword } = params;
            try {
              const result = await props.list({ keyword: keyword as string | undefined, page: current, pageSize });
              return { data: result.records, total: result.total, success: true };
            } catch (error) {
              message.error(error instanceof Error ? error.message : '加载失败');
              return { data: [], total: 0, success: false };
            }
          }}
        />
      </ProCard>
      <ModalForm<T>
        title={editing ? `编辑${props.title}` : `新增${props.title}`}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={editing ?? props.initialValues ?? {}}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={submit}
      >
        {props.fields.map((field) => <FieldControl key={field.name} field={field} />)}
      </ModalForm>
      {props.children}
    </PageContainer>
  );
}
