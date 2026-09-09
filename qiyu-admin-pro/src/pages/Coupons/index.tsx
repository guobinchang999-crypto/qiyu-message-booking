import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Popconfirm, Space, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProCard, ProFormDateRangePicker, ProFormDependency, ProFormDigit, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { couponTemplateApi } from '@/services/coupon-service';
import type { CouponDiscountType, CouponStatus, CouponTemplateCommand, CouponTemplateResource } from '@/services/coupon-service';

interface CouponFormValues {
  code: string; name: string; discountType: CouponDiscountType; discountAmount?: number;
  discountPercent?: number; thresholdAmount: number; validRange: [Dayjs, Dayjs]; status: CouponStatus;
}
const initialValues: CouponFormValues = { code: '', name: '', discountType: 'FIXED', discountAmount: 20, thresholdAmount: 0, validRange: [dayjs().startOf('day'), dayjs().add(30, 'day').endOf('day')], status: 'DRAFT' };
const statusMeta: Record<CouponStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'blue' }, ACTIVE: { label: '投放中', color: 'green' }, ENDED: { label: '已结束', color: 'default' }
};

export default function CouponsPage() {
  const session = readAdminSession();
  const manageable = can(session, 'coupon:manage');
  const [rows, setRows] = useState<CouponTemplateResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CouponTemplateResource>();

  const load = useCallback(async () => { setLoading(true); try { setRows(await couponTemplateApi.list()); } catch (error) { message.error(error instanceof Error ? error.message : '优惠券加载失败'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visibleRows = useMemo(() => keyword.trim() ? rows.filter((row) => `${row.name}${row.code}${statusMeta[row.status].label}`.includes(keyword.trim())) : rows, [keyword, rows]);
  const openForm = (record?: CouponTemplateResource) => { setEditing(record); setModalOpen(true); };
  const remove = async (id: string) => { try { await couponTemplateApi.remove(id); message.success('优惠券已删除'); await load(); } catch (error) { message.error(error instanceof Error ? error.message : '优惠券删除失败'); } };
  const formInitialValues = editing ? {
    code: editing.code, name: editing.name, discountType: editing.discountType, discountAmount: editing.discountAmount, discountPercent: editing.discountPercent, thresholdAmount: editing.thresholdAmount,
    validRange: [dayjs(editing.validStartAt), dayjs(editing.validEndAt)], status: editing.status
  } : initialValues;

  const columns: ProColumns<CouponTemplateResource>[] = [
    { title: '优惠券', dataIndex: 'name' },
    { title: '编码', dataIndex: 'code', width: 130 },
    { title: '优惠', width: 100, render: (_, row) => row.discountType === 'FIXED' ? `减 ¥${row.discountAmount}` : `${row.discountPercent}% 折扣` },
    { title: '门槛', dataIndex: 'thresholdAmount', width: 100, render: (_, row) => row.thresholdAmount > 0 ? `满 ¥${row.thresholdAmount}` : '无门槛' },
    { title: '有效期', width: 210, render: (_, row) => `${dayjs(row.validStartAt).format('YYYY-MM-DD')} 至 ${dayjs(row.validEndAt).format('YYYY-MM-DD')}` },
    { title: '发放 / 使用', width: 120, render: (_, row) => `${row.issuedCount} / ${row.usedCount}` },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, row) => <Tag color={statusMeta[row.status].color}>{statusMeta[row.status].label}</Tag> },
    ...(manageable ? [{
      title: '操作', valueType: 'option' as const, width: 140,
      render: (_: unknown, row: CouponTemplateResource) => (
        <Space size={2}>
          <Button type="text" size="small" onClick={() => openForm(row)}>编辑</Button>
          <Popconfirm title="确认删除该优惠券？" description="已有发放记录时服务端将拒绝删除。" onConfirm={() => remove(row.id)}><Button type="text" size="small" danger>删除</Button></Popconfirm>
        </Space>
      )
    }] : [])
  ];

  return (
    <PageContainer header={{ title: '优惠券', subTitle: '维护全门店通用优惠券模板、有效期与投放状态。' }}
      extra={manageable ? [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>创建优惠券</Button>] : []}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索名称、编码或状态" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
        </div>
        <ProTable<CouponTemplateResource> rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} search={false} scroll={{ x: 1050 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 张优惠券` }} />
      </ProCard>
      <ModalForm<CouponFormValues>
        title={editing ? '编辑优惠券' : '创建优惠券'}
        width={640}
        open={modalOpen}
        onOpenChange={setModalOpen}
        key={editing?.id ?? 'new'}
        initialValues={formInitialValues}
        modalProps={{ destroyOnClose: true, okText: '保存', cancelText: '取消' }}
        onFinish={async (values) => {
          const command: CouponTemplateCommand = {
            code: values.code, name: values.name, discountType: values.discountType,
            discountAmount: values.discountType === 'FIXED' ? values.discountAmount : undefined,
            discountPercent: values.discountType === 'PERCENT' ? values.discountPercent : undefined,
            thresholdAmount: values.thresholdAmount, validStartAt: values.validRange[0].format('YYYY-MM-DDTHH:mm:ss'),
            validEndAt: values.validRange[1].format('YYYY-MM-DDTHH:mm:ss'), status: values.status
          };
          try {
            if (editing) await couponTemplateApi.update(editing.id, command); else await couponTemplateApi.create(command);
            message.success(editing ? '优惠券已更新' : '优惠券已创建');
            await load();
            return true;
          } catch (error) { message.error(error instanceof Error ? error.message : '优惠券保存失败'); return false; }
        }}
      >
        <ProFormText name="code" label="优惠券编码" rules={[{ required: true, message: '请输入优惠券编码' }]} disabled={!!editing} />
        <ProFormText name="name" label="优惠券名称" rules={[{ required: true, message: '请输入优惠券名称' }]} />
        <ProFormSelect name="discountType" label="优惠类型" rules={[{ required: true }]} options={[{ label: '固定金额', value: 'FIXED' }, { label: '折扣比例', value: 'PERCENT' }]} />
        <ProFormDependency name={['discountType']}>
          {({ discountType }) => discountType === 'PERCENT'
            ? <ProFormDigit name="discountPercent" label="折扣比例（%）" rules={[{ required: true }]} min={0.01} max={100} fieldProps={{ precision: 2 }} />
            : <ProFormDigit name="discountAmount" label="优惠金额" rules={[{ required: true }]} min={0.01} fieldProps={{ precision: 2, prefix: '¥' }} />}
        </ProFormDependency>
        <ProFormDigit name="thresholdAmount" label="使用门槛" rules={[{ required: true }]} min={0} fieldProps={{ precision: 2, prefix: '¥' }} />
        <ProFormSelect name="status" label="投放状态" rules={[{ required: true }]} options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))} />
        <ProFormDateRangePicker name="validRange" label="有效期" rules={[{ required: true, message: '请选择有效期' }]} fieldProps={{ showTime: true }} />
      </ModalForm>
    </PageContainer>
  );
}
