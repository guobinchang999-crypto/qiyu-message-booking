import { Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import SystemCrudPage, { statusColumn } from '@/components/SystemCrudPage';
import { systemAdminApi } from '@/services/system-service';
import type { SystemRoleRecord } from '@/types/system';
const columns: ColumnsType<SystemRoleRecord> = [
  { title: '角色名称', dataIndex: 'name' }, { title: '角色编码', dataIndex: 'code' }, { title: '数据范围', dataIndex: 'dataScope' }, { title: '用户数', dataIndex: 'userCount', width: 90 },
  { title: '允许权限', dataIndex: 'permissionCodes', width: 280, render: (values: string[]) => <Space size={[4, 4]} wrap>{values.slice(0, 3).map((value) => <Tag color="blue" key={value}>{value}</Tag>)}{values.length > 3 && <Tag>+{values.length - 3}</Tag>}</Space> },
  { title: '禁止权限', dataIndex: 'deniedPermissionCodes', width: 240, render: (values: string[]) => <Space size={[4, 4]} wrap>{values.slice(0, 2).map((value) => <Tag color="error" key={value}>{value}</Tag>)}{values.length > 2 && <Tag>+{values.length - 2}</Tag>}</Space> }, statusColumn<SystemRoleRecord>()
];
export default function RolesPage() { return <SystemCrudPage title="角色与权限" description="以权限码配置功能授权，以数据范围配置可访问的组织和业务数据。" permissionHint="system:role:manage" columns={columns} fields={[
  { name: 'name', label: '角色名称', required: true }, { name: 'code', label: '角色编码', required: true }, { name: 'permissionCodes', label: '允许权限码', type: 'tags', required: true, placeholder: '输入权限码后按回车' }, { name: 'deniedPermissionCodes', label: '禁止权限码', type: 'tags', placeholder: '输入权限码后按回车' }, { name: 'dataScope', label: '默认数据范围', type: 'select', required: true, options: ['本人', '本门店', '指定门店', '本区域及下级', '全部门店'].map((value) => ({ label: value, value })) }, { name: 'userCount', label: '用户数', type: 'number' }, { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '启用', value: 'ENABLED' }, { label: '停用', value: 'DISABLED' }] }
]} initialValues={{ status: 'ENABLED', userCount: 0, permissionCodes: [], deniedPermissionCodes: [], dataScope: '本人' }} list={systemAdminApi.roles.list} save={systemAdminApi.roles.save} remove={systemAdminApi.roles.remove} />; }
