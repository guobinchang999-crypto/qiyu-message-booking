import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Popconfirm, Space, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProCard, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
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
  const manageable = can(session, 'room:manage');
  const [rows, setRows] = useState<RoomResource[]>([]);
  const [stores, setStores] = useState<StoreResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomResource>();

  const load = useCallback(async () => { setLoading(true); try { const [rooms, storeRows] = await Promise.all([roomResourceApi.list(), storeResourceApi.list()]); setRows(rooms); setStores(storeRows); } catch (error) { message.error(error instanceof Error ? error.message : '房间数据加载失败'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visibleRows = useMemo(() => keyword.trim() ? rows.filter((row) => `${row.name}${row.store ?? ''}${row.type}${row.note ?? ''}`.includes(keyword.trim())) : rows, [keyword, rows]);
  const storeOptions = stores.map((store) => ({ label: store.name, value: store.id }));
  const openForm = (record?: RoomResource) => { setEditing(record); setModalOpen(true); };
  const remove = async (id: string) => { try { await roomResourceApi.remove(id); message.success('房间已删除'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '房间删除失败'); } };
  const formInitialValues = editing ? {
    code: editing.code ?? editing.id, storeId: editing.storeId ?? stores.find((store) => store.name === editing.store)?.id ?? '', name: editing.name, type: editing.type, status: editing.status, capacity: editing.capacity ?? 1, note: editing.note, enabled: editing.enabled ?? true
  } : { ...initialValues, storeId: stores[0]?.id ?? '' };

  const columns: ProColumns<RoomResource>[] = [
    { title: '房间', dataIndex: 'name' },
    { title: '所属门店', dataIndex: 'store', render: (_, record) => record.store || '-' },
    { title: '用途', dataIndex: 'type' },
    { title: '容量', dataIndex: 'capacity', width: 80, render: (_, record) => `${record.capacity ?? 1} 人` },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, record) => { const meta = statusMeta(record.status); return <Tag color={meta.color}>{meta.label}</Tag>; } },
    { title: '备注', dataIndex: 'note', ellipsis: true, render: (_, record) => record.note || '-' },
    ...(manageable ? [{
      title: '操作', valueType: 'option' as const, width: 140,
      render: (_: unknown, record: RoomResource) => (
        <Space size={2}>
          <Button type="text" size="small" onClick={() => openForm(record)}>编辑</Button>
          <Popconfirm title="确认删除该房间？" description="存在预约或资源占用时服务端将拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger>删除</Button></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  return (
    <PageContainer header={{ title: '房间管理', subTitle: '维护门店房间档案与实时资源状态，预约排房使用同一稳定资源 ID。' }}
      extra={manageable ? [<Button key="create" type="primary" icon={<PlusOutlined />} disabled={!stores.length} onClick={() => openForm()}>新增房间</Button>] : []}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索房间、门店、用途或备注" style={{ width: 320 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
        </div>
        <ProTable<RoomResource> rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} search={false} scroll={{ x: 980 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个房间` }} />
      </ProCard>
      <ModalForm<RoomCommand>
        title={editing ? '编辑房间' : '新增房间'}
        width={640}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={formInitialValues}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (command) => {
          try {
            if (editing) await roomResourceApi.update(editing.id, command); else await roomResourceApi.create(command);
            message.success(editing ? '房间已更新' : '房间已创建');
            await load();
            return true;
          } catch (error) { message.error(error instanceof Error ? error.message : '房间保存失败'); return false; }
        }}
      >
        <ProFormText name="code" label="房间编码" rules={[{ required: true, message: '请输入房间编码' }]} disabled={!!editing} />
        <ProFormText name="name" label="房间名称" rules={[{ required: true, message: '请输入房间名称' }]} />
        <ProFormSelect name="storeId" label="所属门店" rules={[{ required: true, message: '请选择所属门店' }]} options={storeOptions} fieldProps={{ showSearch: true, optionFilterProp: 'label' }} />
        <ProFormText name="type" label="房间用途" rules={[{ required: true, message: '请输入房间用途' }]} />
        <ProFormDigit name="capacity" label="接待人数" rules={[{ required: true }]} min={1} />
        <ProFormSelect name="status" label="资源状态" rules={[{ required: true }]} options={statusOptions.map(({ label, value }) => ({ label, value }))} />
        <ProFormTextArea name="note" label="房间备注" fieldProps={{ rows: 3, maxLength: 200, showCount: true }} />
        <ProFormSwitch name="enabled" label="启用房间" checkedChildren="启用" unCheckedChildren="停用" />
      </ModalForm>
    </PageContainer>
  );
}
