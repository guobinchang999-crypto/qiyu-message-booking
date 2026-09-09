import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Popconfirm, Space, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProCard, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { serviceResourceApi } from '@/services/resource-service';
import type { ServiceCommand, ServiceResource } from '@/services/resource-service';

const initialValues: ServiceCommand = { code: '', name: '', category: '', durationMinutes: 60, preparationMinutes: 10, cleanupMinutes: 10, price: 0, memberPrice: 0, description: '', status: '上架', enabled: true };

export default function ServicesPage() {
  const session = readAdminSession();
  const manageable = can(session, 'service:manage');
  const [rows, setRows] = useState<ServiceResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceResource>();

  const load = useCallback(async () => { setLoading(true); try { setRows(await serviceResourceApi.list()); } catch (error) { message.error(error instanceof Error ? error.message : '服务项目加载失败'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visibleRows = useMemo(() => keyword.trim() ? rows.filter((row) => `${row.name}${row.category}${row.status}`.includes(keyword.trim())) : rows, [keyword, rows]);
  const openForm = (record?: ServiceResource) => { setEditing(record); setModalOpen(true); };
  const remove = async (id: string) => { try { await serviceResourceApi.remove(id); message.success('服务项目已删除'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '服务项目删除失败'); } };
  const formInitialValues = editing ? {
    code: editing.code ?? editing.id, name: editing.name, category: editing.category, durationMinutes: editing.durationMinutes, preparationMinutes: editing.preparationMinutes ?? 10, cleanupMinutes: editing.cleanupMinutes ?? 10, price: editing.price, memberPrice: editing.memberPrice, description: editing.description, status: editing.status, enabled: editing.enabled ?? true
  } : initialValues;

  const columns: ProColumns<ServiceResource>[] = [
    { title: '项目名称', dataIndex: 'name' },
    { title: '分类', dataIndex: 'category' },
    { title: '服务时长', dataIndex: 'durationMinutes', width: 100, render: (_, record) => `${record.durationMinutes} 分钟` },
    { title: '标准价', dataIndex: 'price', width: 90, render: (_, record) => `¥${record.price}` },
    { title: '会员价', dataIndex: 'memberPrice', width: 90, render: (_, record) => `¥${record.memberPrice}` },
    { title: '状态', dataIndex: 'status', width: 80, render: (_, record) => <Tag color={record.status === '上架' ? 'green' : 'default'}>{record.status}</Tag> },
    { title: '累计预约', dataIndex: 'bookingCount', width: 100, render: (_, record) => `${record.bookingCount} 次` },
    ...(manageable ? [{
      title: '操作', valueType: 'option' as const, width: 140,
      render: (_: unknown, record: ServiceResource) => (
        <Space size={2}>
          <Button type="text" size="small" onClick={() => openForm(record)}>编辑</Button>
          <Popconfirm title="确认删除该服务项目？" description="已被预约引用的项目将由服务端拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger>删除</Button></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  return (
    <PageContainer header={{ title: '服务项目', subTitle: '维护项目时长、价格、会员价和上下架状态，客户端预约使用同一项目语义。' }}
      extra={manageable ? [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增项目</Button>] : []}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索项目、分类或状态" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
        </div>
        <ProTable<ServiceResource> rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} search={false} scroll={{ x: 980 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个项目` }} />
      </ProCard>
      <ModalForm<ServiceCommand>
        title={editing ? '编辑服务项目' : '新增服务项目'}
        width={640}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={formInitialValues}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (command) => {
          try {
            if (editing) await serviceResourceApi.update(editing.id, command); else await serviceResourceApi.create(command);
            message.success(editing ? '服务项目已更新' : '服务项目已创建');
            await load();
            return true;
          } catch (error) { message.error(error instanceof Error ? error.message : '服务项目保存失败'); return false; }
        }}
      >
        <ProFormText name="code" label="项目编码" rules={[{ required: true, message: '请输入项目编码' }]} disabled={!!editing} />
        <ProFormText name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]} />
        <ProFormText name="category" label="服务分类" rules={[{ required: true, message: '请输入服务分类' }]} />
        <ProFormSelect name="status" label="发布状态" rules={[{ required: true }]} options={[{ label: '上架', value: '上架' }, { label: '下架', value: '下架' }]} />
        <ProFormDigit name="durationMinutes" label="服务时长（分钟）" rules={[{ required: true }]} min={10} />
        <ProFormDigit name="preparationMinutes" label="准备时间（分钟）" rules={[{ required: true }]} min={0} />
        <ProFormDigit name="cleanupMinutes" label="清洁时间（分钟）" rules={[{ required: true }]} min={0} />
        <ProFormDigit name="price" label="标准价" rules={[{ required: true }]} min={0} fieldProps={{ precision: 2, prefix: '¥' }} />
        <ProFormDigit name="memberPrice" label="会员价" rules={[{ required: true }]} min={0} fieldProps={{ precision: 2, prefix: '¥' }} />
        <ProFormTextArea name="description" label="项目说明" fieldProps={{ rows: 3, maxLength: 500, showCount: true }} />
        <ProFormSwitch name="enabled" label="启用项目" checkedChildren="启用" unCheckedChildren="停用" />
      </ModalForm>
    </PageContainer>
  );
}
