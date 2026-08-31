import { DollarOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import {
  memberManagementApi,
  type BalanceAdjustmentDirection,
  type MemberBalanceAdjustmentCommand,
} from '@/services/member-service';
import type { MemberAccount } from '@/types';

interface BalanceAdjustmentForm {
  direction: BalanceAdjustmentDirection;
  amount: number;
  remark: string;
}

const initialValues: BalanceAdjustmentForm = {
  direction: 'CREDIT',
  amount: 100,
  remark: '',
};

const newRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `member-balance-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function MembersPage() {
  const session = readAdminSession();
  const manageable = can(session, 'member:manage');
  const [form] = Form.useForm<BalanceAdjustmentForm>();
  const [rows, setRows] = useState<MemberAccount[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberAccount>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await memberManagementApi.list());
    } catch (error) {
      message.error(error instanceof Error ? error.message : '会员数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRows = useMemo(() => {
    const value = keyword.trim();
    return value
      ? rows.filter((row) => `${row.customerName}${row.level}${row.scope}`.includes(value))
      : rows;
  }, [keyword, rows]);

  const openAdjustment = (member: MemberAccount) => {
    setSelectedMember(member);
    form.setFieldsValue(initialValues);
  };

  const submitAdjustment = async () => {
    if (!selectedMember) return;
    const values = await form.validateFields();
    const command: MemberBalanceAdjustmentCommand = {
      ...values,
      requestId: newRequestId(),
    };
    setSaving(true);
    try {
      const result = await memberManagementApi.adjustBalance(selectedMember.id, command);
      message.success(`余额调整成功，当前余额 ¥${result.balanceAfter.toFixed(2)}`);
      setSelectedMember(undefined);
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '余额调整失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<MemberAccount> = [
    { title: '客户', dataIndex: 'customerName', minWidth: 140 },
    { title: '等级', dataIndex: 'level', width: 110, render: (value: string) => <Tag>{value}</Tag> },
    { title: '余额', dataIndex: 'balance', width: 120, render: (value: number) => `¥${Number(value).toFixed(2)}` },
    { title: '套餐余量', dataIndex: 'packageBalance', width: 110, render: (value: number) => `${value} 次` },
    { title: '优惠券', dataIndex: 'couponCount', width: 100, render: (value: number) => `${value} 张` },
    { title: '权益范围', dataIndex: 'scope', width: 130 },
    ...(manageable ? [{
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: MemberAccount) => (
        <Button
          type="link"
          size="small"
          icon={<DollarOutlined />}
          onClick={() => openAdjustment(record)}
        >
          余额调整
        </Button>
      ),
    }] : []),
  ];

  return (
    <div className="qiyu-page">
      <div className="qiyu-page-header">
        <div>
          <h1 className="qiyu-page-title">会员管理</h1>
          <div className="qiyu-page-description">管理全门店通用会员余额、套餐权益和优惠券。</div>
        </div>
      </div>
      <Card className="qiyu-card">
        <div className="qiyu-toolbar">
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            prefix={<SearchOutlined />}
            placeholder="搜索客户、等级或权益范围"
            style={{ width: 300 }}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>刷新</Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={visibleRows}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 位会员` }}
        />
      </Card>
      <Modal
        title={`调整余额${selectedMember ? ` · ${selectedMember.customerName}` : ''}`}
        open={!!selectedMember}
        confirmLoading={saving}
        okText="确认调整"
        onOk={submitAdjustment}
        onCancel={() => setSelectedMember(undefined)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={initialValues} style={{ marginTop: 24 }}>
          <Form.Item label="当前余额">
            <Input value={`¥${Number(selectedMember?.balance ?? 0).toFixed(2)}`} disabled />
          </Form.Item>
          <Form.Item name="direction" label="调整方式" rules={[{ required: true }]}>
            <Segmented
              block
              options={[{ label: '增加余额', value: 'CREDIT' }, { label: '扣减余额', value: 'DEBIT' }]}
            />
          </Form.Item>
          <Form.Item name="amount" label="调整金额" rules={[{ required: true, message: '请输入调整金额' }]}>
            <InputNumber min={0.01} max={99999999.99} precision={2} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="remark"
            label="调整原因"
            rules={[{ required: true, whitespace: true, message: '请输入调整原因' }, { max: 255 }]}
          >
            <Input.TextArea rows={3} showCount maxLength={255} placeholder="请填写可审计的业务原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
