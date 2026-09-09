import { DollarOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Tag, message } from 'antd';
import { ModalForm, PageContainer, ProCard, ProFormDigit, ProFormSegmented, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { memberManagementApi, type BalanceAdjustmentDirection, type MemberBalanceAdjustmentCommand } from '@/services/member-service';
import type { MemberAccount } from '@/types';

interface BalanceAdjustmentForm {
  direction: BalanceAdjustmentDirection;
  amount: number;
  remark: string;
}

const newRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `member-balance-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function MembersPage() {
  const session = readAdminSession();
  const manageable = can(session, 'member:manage');
  const [rows, setRows] = useState<MemberAccount[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberAccount>();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await memberManagementApi.list()); }
    catch (error) { message.error(error instanceof Error ? error.message : '会员数据加载失败'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visibleRows = useMemo(() => {
    const value = keyword.trim();
    return value ? rows.filter((row) => `${row.customerName}${row.level}${row.scope}`.includes(value)) : rows;
  }, [keyword, rows]);

  const columns: ProColumns<MemberAccount>[] = [
    { title: '客户', dataIndex: 'customerName', minWidth: 140 },
    { title: '等级', dataIndex: 'level', width: 110, render: (_, record) => <Tag>{record.level}</Tag> },
    { title: '余额', dataIndex: 'balance', width: 120, render: (_, record) => `¥${Number(record.balance).toFixed(2)}` },
    { title: '套餐余量', dataIndex: 'packageBalance', width: 110, render: (_, record) => `${record.packageBalance} 次` },
    { title: '优惠券', dataIndex: 'couponCount', width: 100, render: (_, record) => `${record.couponCount} 张` },
    { title: '权益范围', dataIndex: 'scope', width: 130 },
    ...(manageable ? [{
      title: '操作',
      valueType: 'option' as const,
      width: 120,
      render: (_: unknown, record: MemberAccount) => <Button type="link" size="small" icon={<DollarOutlined />} onClick={() => setSelectedMember(record)}>余额调整</Button>
    }] : [])
  ];

  return (
    <PageContainer header={{ title: '会员管理', subTitle: '管理全门店通用会员余额、套餐权益和优惠券。' }}>
      <ProCard>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索客户、等级或权益范围" style={{ width: 300 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
        </div>
        <ProTable<MemberAccount> rowKey="id" loading={loading} columns={columns} dataSource={visibleRows} search={false} scroll={{ x: 900 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 位会员` }} />
      </ProCard>
      <ModalForm<BalanceAdjustmentForm>
        title={`调整余额${selectedMember ? ` · ${selectedMember.customerName}` : ''}`}
        open={!!selectedMember}
        onOpenChange={(open) => { if (!open) setSelectedMember(undefined); }}
        key={selectedMember?.id ?? 'none'}
        initialValues={{ direction: 'CREDIT', amount: 100, remark: '' }}
        modalProps={{ destroyOnClose: true, okText: '确认调整', cancelText: '取消' }}
        onFinish={async (values) => {
          if (!selectedMember) return false;
          const command: MemberBalanceAdjustmentCommand = { ...values, requestId: newRequestId() };
          try {
            const result = await memberManagementApi.adjustBalance(selectedMember.id, command);
            message.success(`余额调整成功，当前余额 ¥${result.balanceAfter.toFixed(2)}`);
            setSelectedMember(undefined);
            await load();
            return true;
          } catch (error) {
            message.error(error instanceof Error ? error.message : '余额调整失败');
            return false;
          }
        }}
      >
        <div style={{ marginBottom: 16, color: '#666a66' }}>当前余额：¥{Number(selectedMember?.balance ?? 0).toFixed(2)}</div>
        <ProFormSegmented name="direction" label="调整方式" rules={[{ required: true, message: '请选择调整方式' }]} fieldProps={{ block: true, options: [{ label: '增加余额', value: 'CREDIT' }, { label: '扣减余额', value: 'DEBIT' }] }} />
        <ProFormDigit name="amount" label="调整金额" rules={[{ required: true, message: '请输入调整金额' }]} min={0.01} max={99999999.99} fieldProps={{ precision: 2, prefix: '¥', style: { width: '100%' } }} />
        <ProFormTextArea name="remark" label="调整原因" rules={[{ required: true, whitespace: true, message: '请输入调整原因' }, { max: 255 }]} fieldProps={{ rows: 3, maxLength: 255, showCount: true, placeholder: '请填写可审计的业务原因' }} />
      </ModalForm>
    </PageContainer>
  );
}
