import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Popconfirm, Space, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProCard, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { storeResourceApi, therapistResourceApi } from '@/services/resource-service';
import type { StoreResource, TherapistCommand, TherapistResource } from '@/services/resource-service';

const initialValues: TherapistCommand = { code: '', storeId: '', name: '', level: '专业技师', skills: [], status: '可预约', rating: 5, specifyFee: 0, enabled: true };

export default function TherapistsPage() {
  const session = readAdminSession();
  const [rows, setRows] = useState<TherapistResource[]>([]);
  const [stores, setStores] = useState<StoreResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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
  const openForm = (record?: TherapistResource) => { setEditing(record); setModalOpen(true); };
  const remove = async (id: string) => { try { await therapistResourceApi.remove(id); message.success('技师已删除'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '技师删除失败'); } };
  const formInitialValues = editing ? {
    code: editing.code ?? editing.id, storeId: editing.storeId ?? stores.find((store) => store.name === editing.store)?.id ?? '', name: editing.name, level: editing.level, skills: editing.skills, status: editing.status, rating: editing.rating, specifyFee: editing.specifyFee ?? 0, enabled: editing.enabled ?? true
  } : { ...initialValues, storeId: stores[0]?.id ?? '' };

  const columns: ProColumns<TherapistResource>[] = [
    { title: '技师', dataIndex: 'name' },
    { title: '所属门店', dataIndex: 'store' },
    { title: '等级', dataIndex: 'level' },
    { title: '擅长项目', dataIndex: 'skills', width: 250, render: (_, record) => <Space size={[4, 4]} wrap>{record.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)}</Space> },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, record) => <Tag color={record.status === '可预约' ? 'green' : record.status === '服务中' ? 'blue' : 'orange'}>{record.status}</Tag> },
    { title: '评分', dataIndex: 'rating', width: 70 },
    { title: '今日预约', dataIndex: 'todayBookings', width: 90, render: (_, record) => `${record.todayBookings} 单` },
    ...(manageable ? [{
      title: '操作', valueType: 'option' as const, width: 140,
      render: (_: unknown, record: TherapistResource) => (
        <Space size={2}>
          <Button type="text" size="small" onClick={() => openForm(record)}>编辑</Button>
          <Popconfirm title="确认删除该技师？" description="存在未完成预约时服务端将拒绝删除。" onConfirm={() => remove(record.id)}><Button type="text" size="small" danger>删除</Button></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  return (
    <PageContainer header={{ title: '技师管理', subTitle: '统一维护技师状态、技能标签、所属门店和今日预约负载。' }}
      extra={manageable ? [<Button key="create" type="primary" icon={<PlusOutlined />} disabled={!stores.length} onClick={() => openForm()}>新增技师</Button>] : []}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索技师、门店、等级或技能" style={{ width: 320 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
        </div>
        <ProTable<TherapistResource> rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} search={false} scroll={{ x: 1100 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 位技师` }} />
      </ProCard>
      <ModalForm<TherapistCommand>
        title={editing ? '编辑技师' : '新增技师'}
        width={640}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={formInitialValues}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (command) => {
          try {
            if (editing) await therapistResourceApi.update(editing.id, command); else await therapistResourceApi.create(command);
            message.success(editing ? '技师资料已更新' : '技师已创建');
            await load();
            return true;
          } catch (error) { message.error(error instanceof Error ? error.message : '技师保存失败'); return false; }
        }}
      >
        <ProFormText name="code" label="技师编码" rules={[{ required: true, message: '请输入技师编码' }]} disabled={!!editing} />
        <ProFormText name="name" label="技师姓名" rules={[{ required: true, message: '请输入技师姓名' }]} />
        <ProFormSelect name="storeId" label="所属门店" rules={[{ required: true, message: '请选择所属门店' }]} options={storeOptions} fieldProps={{ showSearch: true, optionFilterProp: 'label' }} />
        <ProFormText name="level" label="技师等级" rules={[{ required: true, message: '请输入技师等级' }]} />
        <ProFormSelect name="status" label="工作状态" rules={[{ required: true }]} options={[{ label: '可预约', value: '可预约' }, { label: '服务中', value: '服务中' }, { label: '休假', value: '休假' }]} />
        <ProFormSelect name="skills" label="擅长项目" rules={[{ required: true, message: '请至少填写一个技能' }]} mode="tags" fieldProps={{ tokenSeparators: [',', '，'], placeholder: '输入技能后按回车' }} />
        <ProFormDigit name="rating" label="评分" min={0} max={5} fieldProps={{ precision: 1 }} />
        <ProFormDigit name="specifyFee" label="指定服务费" min={0} fieldProps={{ precision: 2, prefix: '¥' }} />
        <ProFormSwitch name="enabled" label="启用技师" checkedChildren="启用" unCheckedChildren="停用" />
      </ModalForm>
    </PageContainer>
  );
}
