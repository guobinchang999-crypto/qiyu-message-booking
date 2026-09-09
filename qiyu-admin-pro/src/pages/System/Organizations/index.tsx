import { Tag } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import SystemCrudPage, { statusColumn } from '@/components/SystemCrudPage';
import { systemAdminApi } from '@/services/system-service';
import type { OrganizationRecord } from '@/types/system';

const typeText: Record<OrganizationRecord['type'], string> = { HEADQUARTERS: '总部', REGION: '区域', STORE: '门店', DEPARTMENT: '部门' };
const columns: ProColumns<OrganizationRecord>[] = [
  { title: '组织名称', dataIndex: 'name', render: (_, record) => <span style={{ paddingLeft: record.parentId ? 18 : 0 }}>{record.parentId ? '└ ' : ''}{record.name}</span> },
  { title: '类型', dataIndex: 'type', width: 100, render: (_, record) => <Tag>{typeText[record.type]}</Tag> },
  { title: '负责人', dataIndex: 'leader' },
  { title: '上级 ID', dataIndex: 'parentId', render: (_, record) => record.parentId || '-' },
  { title: '排序', dataIndex: 'sort', width: 80 },
  statusColumn<OrganizationRecord>()
];

export default function OrganizationsPage() {
  return <SystemCrudPage<OrganizationRecord>
    title="组织与部门"
    description="维护总部、区域、门店和部门层级，组织 ID 作为数据权限范围的稳定依据。"
    permissionHint="system:organization:manage"
    columns={columns}
    fields={[
      { name: 'name', label: '组织名称', required: true },
      { name: 'type', label: '组织类型', type: 'select', required: true, options: Object.entries(typeText).map(([value, label]) => ({ value, label })) },
      { name: 'parentId', label: '上级组织 ID' },
      { name: 'leader', label: '负责人', required: true },
      { name: 'sort', label: '排序', type: 'number', required: true },
      { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '启用', value: 'ENABLED' }, { label: '停用', value: 'DISABLED' }] }
    ]}
    initialValues={{ type: 'DEPARTMENT', sort: 0, status: 'ENABLED' }}
    list={systemAdminApi.organizations.list}
    save={systemAdminApi.organizations.save}
    remove={systemAdminApi.organizations.remove}
  />;
}
