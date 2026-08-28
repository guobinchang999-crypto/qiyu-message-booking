import { Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import SystemCrudPage, { statusColumn } from '@/components/SystemCrudPage';
import { systemAdminApi } from '@/services/system-service';
import type { SystemUserRecord } from '@/types/system';
const columns: ColumnsType<SystemUserRecord> = [
  { title: '账号', dataIndex: 'username' }, { title: '姓名', dataIndex: 'displayName' }, { title: '手机号', dataIndex: 'phone' }, { title: '部门', dataIndex: 'departmentName' },
  { title: '角色', dataIndex: 'roleNames', render: (values: string[]) => <Space size={4}>{values.map((value) => <Tag key={value}>{value}</Tag>)}</Space> }, { title: '数据范围', dataIndex: 'dataScope' }, { title: '最后登录', dataIndex: 'lastLoginAt', render: (value) => value || '-' }, statusColumn<SystemUserRecord>()
];
export default function UsersPage() { return <SystemCrudPage title="系统用户" description="管理员工登录账号、角色和默认数据范围；密码由后端安全流程重置。" permissionHint="system:user:manage" columns={columns} fields={[
  { name: 'username', label: '登录账号', required: true }, { name: 'displayName', label: '姓名', required: true }, { name: 'phone', label: '手机号', required: true }, { name: 'departmentName', label: '所属组织/部门', required: true }, { name: 'roleNames', label: '角色', type: 'tags', required: true, placeholder: '输入后按回车' }, { name: 'dataScope', label: '数据范围', type: 'select', required: true, options: ['本人', '本门店', '指定门店', '本区域及下级', '全部门店'].map((value) => ({ label: value, value })) }, { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '启用', value: 'ENABLED' }, { label: '停用', value: 'DISABLED' }] }
]} initialValues={{ status: 'ENABLED', roleNames: [], dataScope: '本人' }} list={systemAdminApi.users.list} save={systemAdminApi.users.save} remove={systemAdminApi.users.remove} />; }
