import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Drawer, Input, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { systemAdminApi } from '@/services/system-service';
import type { AuditLogRecord } from '@/types/system';

export default function AuditLogsPage() {
  const [rows, setRows] = useState<AuditLogRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<AuditLogRecord>();
  const load = useCallback(async () => { setLoading(true); try { setRows((await systemAdminApi.auditLogs.list({ keyword, page: 1, pageSize: 100 })).records); } catch (error) { message.error(error instanceof Error ? error.message : '加载失败'); } finally { setLoading(false); } }, [keyword]);
  useEffect(() => { void load(); }, [load]);
  const columns: ColumnsType<AuditLogRecord> = [
    { title: '时间', dataIndex: 'createdAt', width: 170 }, { title: '操作人', dataIndex: 'operatorName' }, { title: '动作', dataIndex: 'action' }, { title: '资源', render: (_, row) => `${row.resourceType} / ${row.resourceId}` }, { title: '组织', dataIndex: 'organizationName' }, { title: '结果', dataIndex: 'result', width: 90, render: (value) => <Tag color={value === 'SUCCESS' ? 'success' : 'error'}>{value === 'SUCCESS' ? '成功' : '失败'}</Tag> }, { title: 'IP', dataIndex: 'ipAddress' }, { title: '操作', width: 80, fixed: 'right', render: (_, row) => <Button type="link" size="small" onClick={() => setActive(row)}>详情</Button> }
  ];
  return <div className="qiyu-page"><div className="qiyu-page-header"><div><h1 className="qiyu-page-title">审计日志</h1><div className="qiyu-page-description">追踪登录、敏感字段查看、金额修改、取消、导出与授权变更等关键操作。</div></div></div><Card className="qiyu-card"><div className="qiyu-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="搜索操作人、动作、资源或 IP" value={keyword} onChange={(event) => setKeyword(event.target.value)} onPressEnter={load} style={{ width: 320 }} /><Button icon={<ReloadOutlined />} onClick={load}>刷新</Button><Tag bordered={false} color="blue">权限码：system:audit:read</Tag></div><Table rowKey="id" loading={loading} dataSource={rows} columns={columns} scroll={{ x: 1050 }} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }} /></Card><Drawer title="审计详情" width={520} open={!!active} onClose={() => setActive(undefined)}><Descriptions column={1} bordered size="small" items={active ? [
    { key: 'time', label: '发生时间', children: active.createdAt }, { key: 'operator', label: '操作人', children: active.operatorName }, { key: 'action', label: '动作', children: active.action }, { key: 'resource', label: '资源', children: `${active.resourceType} / ${active.resourceId}` }, { key: 'org', label: '组织', children: active.organizationName }, { key: 'ip', label: '来源 IP', children: active.ipAddress }, { key: 'result', label: '结果', children: active.result }, { key: 'detail', label: '详情', children: active.detail }
  ] : []} /></Drawer></div>;
}
