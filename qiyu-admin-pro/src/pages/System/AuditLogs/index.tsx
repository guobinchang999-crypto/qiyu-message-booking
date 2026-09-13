import { ReloadOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Tag, message } from 'antd';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useState } from 'react';
import { systemAdminApi } from '@/services/system-service';
import type { AuditLogRecord } from '@/types/system';

export default function AuditLogsPage() {
  const [active, setActive] = useState<AuditLogRecord>();
  const columns: ProColumns<AuditLogRecord>[] = [
    { title: '时间', dataIndex: 'createdAt', width: 170, hideInSearch: true },
    { title: '操作人', dataIndex: 'operatorName', hideInSearch: true },
    { title: '动作', dataIndex: 'action', hideInSearch: true },
    { title: '资源', render: (_, record) => `${record.resourceType} / ${record.resourceId}`, hideInSearch: true },
    { title: '组织', dataIndex: 'organizationName', hideInSearch: true },
    { title: '结果', dataIndex: 'result', width: 90, hideInSearch: true, render: (_, record) => <Tag color={record.result === 'SUCCESS' ? 'success' : 'error'}>{record.result === 'SUCCESS' ? '成功' : '失败'}</Tag> },
    { title: 'IP', dataIndex: 'ipAddress', hideInSearch: true },
    { title: '关键词', dataIndex: 'keyword', hideInTable: true, hideInSearch: false, fieldProps: { placeholder: '搜索操作人、动作、资源或 IP' } },
    { title: '操作', valueType: 'option', width: 80, render: (_, record) => <Button type="link" size="small" onClick={() => setActive(record)}>详情</Button> }
  ];
  return (
    <PageContainer header={{ title: '审计日志', subTitle: '追踪登录、敏感字段查看、金额修改、取消、导出与授权变更等关键操作。' }}>
      <ProCard>
        <ProTable<AuditLogRecord>
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 1050 }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }}
          toolBarRender={(action) => [<Tag key="hint" bordered={false} color="blue">权限码：system:audit:read</Tag>, <Button key="reload" icon={<ReloadOutlined />} onClick={() => action?.reload()}>刷新</Button>]}
          request={async (params) => {
            const { current = 1, pageSize = 10, keyword } = params;
            try {
              const result = await systemAdminApi.auditLogs.list({ keyword: keyword as string | undefined, page: current, pageSize });
              return { data: result.records, total: result.total, success: true };
            } catch (error) {
              message.error(error instanceof Error ? error.message : '加载失败');
              return { data: [], total: 0, success: false };
            }
          }}
        />
      </ProCard>
      <Drawer title="审计详情" width={520} open={!!active} onClose={() => setActive(undefined)}>
        <Descriptions column={1} bordered size="small" items={active ? [
          { key: 'time', label: '发生时间', children: active.createdAt },
          { key: 'operator', label: '操作人', children: active.operatorName },
          { key: 'action', label: '动作', children: active.action },
          { key: 'resource', label: '资源', children: `${active.resourceType} / ${active.resourceId}` },
          { key: 'org', label: '组织', children: active.organizationName },
          { key: 'ip', label: '来源 IP', children: active.ipAddress },
          { key: 'result', label: '结果', children: active.result },
          { key: 'detail', label: '详情', children: active.detail }
        ] : []} />
      </Drawer>
    </PageContainer>
  );
}
