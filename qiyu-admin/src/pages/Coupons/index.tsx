import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { couponTemplateApi } from '@/services/coupon-service';
import type { CouponDiscountType, CouponStatus, CouponTemplateCommand, CouponTemplateResource } from '@/services/coupon-service';

interface CouponFormValues {
  code: string; name: string; discountType: CouponDiscountType; discountAmount?: number;
  discountPercent?: number; thresholdAmount: number; validRange: [Dayjs, Dayjs]; status: CouponStatus;
}
const initialValues: CouponFormValues = { code: '', name: '', discountType: 'FIXED', discountAmount: 20,
  thresholdAmount: 0, validRange: [dayjs().startOf('day'), dayjs().add(30, 'day').endOf('day')], status: 'DRAFT' };
const statusMeta: Record<CouponStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'blue' }, ACTIVE: { label: '投放中', color: 'green' }, ENDED: { label: '已结束', color: 'default' }
};

export default function CouponsPage() {
  const session = readAdminSession();
  const manageable = can(session, 'coupon:manage');
  const [form] = Form.useForm<CouponFormValues>();
  const discountType = Form.useWatch('discountType', form);
  const [rows, setRows] = useState<CouponTemplateResource[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<CouponTemplateResource>();
  const load = useCallback(async () => { setLoading(true); try { setRows(await couponTemplateApi.list()); }
    catch (error) { message.error(error instanceof Error ? error.message : '优惠券加载失败'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visibleRows = useMemo(() => keyword.trim() ? rows.filter((row) => `${row.name}${row.code}${statusMeta[row.status].label}`.includes(keyword.trim())) : rows, [keyword, rows]);
  const showForm = (record?: CouponTemplateResource) => { setEditing(record); form.setFieldsValue(record ? {
    code: record.code, name: record.name, discountType: record.discountType, discountAmount: record.discountAmount,
    discountPercent: record.discountPercent, thresholdAmount: record.thresholdAmount,
    validRange: [dayjs(record.validStartAt), dayjs(record.validEndAt)], status: record.status
  } : initialValues); setOpen(true); };
  const submit = async () => { const values = await form.validateFields(); const command: CouponTemplateCommand = {
    code: values.code, name: values.name, discountType: values.discountType,
    discountAmount: values.discountType === 'FIXED' ? values.discountAmount : undefined,
    discountPercent: values.discountType === 'PERCENT' ? values.discountPercent : undefined,
    thresholdAmount: values.thresholdAmount, validStartAt: values.validRange[0].format('YYYY-MM-DDTHH:mm:ss'),
    validEndAt: values.validRange[1].format('YYYY-MM-DDTHH:mm:ss'), status: values.status
  }; setSaving(true); try { if (editing) await couponTemplateApi.update(editing.id, command); else await couponTemplateApi.create(command);
    message.success(editing ? '优惠券已更新' : '优惠券已创建'); setOpen(false); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '优惠券保存失败'); } finally { setSaving(false); } };
  const remove = async (id: string) => { try { await couponTemplateApi.remove(id); message.success('优惠券已删除'); await load(); }
    catch (error) { message.error(error instanceof Error ? error.message : '优惠券删除失败'); } };
  const columns: ColumnsType<CouponTemplateResource> = [
    { title: '优惠券', dataIndex: 'name' }, { title: '编码', dataIndex: 'code', width: 130 },
    { title: '优惠', width: 100, render: (_, row) => row.discountType === 'FIXED' ? `减 ¥${row.discountAmount}` : `${row.discountPercent}% 折扣` },
    { title: '门槛', dataIndex: 'thresholdAmount', width: 100, render: (value: number) => value > 0 ? `满 ¥${value}` : '无门槛' },
    { title: '有效期', width: 210, render: (_, row) => `${dayjs(row.validStartAt).format('YYYY-MM-DD')} 至 ${dayjs(row.validEndAt).format('YYYY-MM-DD')}` },
    { title: '发放 / 使用', width: 120, render: (_, row) => `${row.issuedCount} / ${row.usedCount}` },
    { title: '状态', dataIndex: 'status', width: 90, render: (value: CouponStatus) => <Tag color={statusMeta[value].color}>{statusMeta[value].label}</Tag> },
    ...(manageable ? [{ title: '操作', key: 'actions', width: 140, render: (_: unknown, row: CouponTemplateResource) => <Space size={2}><Button type="text" size="small" icon={<EditOutlined />} onClick={() => showForm(row)}>编辑</Button><Popconfirm title="确认删除该优惠券？" description="已有发放记录时服务端将拒绝删除。" onConfirm={() => remove(row.id)}><Button type="text" size="small" danger icon={<DeleteOutlined />} title="删除" /></Popconfirm></Space> }] : [])
  ];
  return <div className="qiyu-page"><div className="qiyu-page-header"><div><h1 className="qiyu-page-title">优惠券</h1><div className="qiyu-page-description">维护全门店通用优惠券模板、有效期与投放状态。</div></div>{manageable && <Button type="primary" icon={<PlusOutlined />} onClick={() => showForm()}>创建优惠券</Button>}</div>
    <Card className="qiyu-card"><div className="qiyu-toolbar"><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索名称、编码或状态" style={{ width: 300 }} /><Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button></div><Table rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} scroll={{ x: 1050 }} /></Card>
    <Modal title={editing ? '编辑优惠券' : '创建优惠券'} open={open} confirmLoading={saving} onOk={submit} onCancel={() => setOpen(false)} width={620} destroyOnClose><Form form={form} layout="vertical" preserve={false} initialValues={initialValues} style={{ marginTop: 20 }}>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="code" label="优惠券编码" rules={[{ required: true }]} style={{ flex: 1 }}><Input disabled={!!editing} /></Form.Item><Form.Item name="name" label="优惠券名称" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item></Space>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="discountType" label="优惠类型" rules={[{ required: true }]} style={{ flex: 1 }}><Select options={[{ label: '固定金额', value: 'FIXED' }, { label: '折扣比例', value: 'PERCENT' }]} /></Form.Item>{discountType === 'PERCENT' ? <Form.Item name="discountPercent" label="折扣比例（%）" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0.01} max={100} precision={2} style={{ width: '100%' }} /></Form.Item> : <Form.Item name="discountAmount" label="优惠金额" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0.01} precision={2} prefix="¥" style={{ width: '100%' }} /></Form.Item>}</Space>
      <Space align="start" style={{ display: 'flex' }}><Form.Item name="thresholdAmount" label="使用门槛" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} /></Form.Item><Form.Item name="status" label="投放状态" rules={[{ required: true }]} style={{ flex: 1 }}><Select options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))} /></Form.Item></Space>
      <Form.Item name="validRange" label="有效期" rules={[{ required: true }]}><DatePicker.RangePicker showTime style={{ width: '100%' }} /></Form.Item>
    </Form></Modal></div>;
}
