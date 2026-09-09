import { Tag } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import SystemCrudPage, { statusColumn } from '@/components/SystemCrudPage';
import { systemAdminApi } from '@/services/system-service';
import type { SystemMenuRecord } from '@/types/system';

const typeText: Record<SystemMenuRecord['type'], string> = { DIRECTORY: '目录', MENU: '菜单', BUTTON: '按钮' };
const columns: ProColumns<SystemMenuRecord>[] = [
  { title: '名称', dataIndex: 'name', render: (_, record) => <span style={{ paddingLeft: record.parentId ? 18 : 0 }}>{record.parentId ? '└ ' : ''}{record.name}</span> },
  { title: '类型', dataIndex: 'type', width: 90, render: (_, record) => <Tag>{typeText[record.type]}</Tag> },
  { title: '路由', dataIndex: 'path' },
  { title: '权限码', dataIndex: 'permissionCode' },
  { title: '上级 ID', dataIndex: 'parentId', render: (_, record) => record.parentId || '-' },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '可见', dataIndex: 'visible', width: 70, render: (_, record) => record.visible ? '是' : '否' },
  statusColumn<SystemMenuRecord>()
];

export default function MenusPage() {
  return <SystemCrudPage<SystemMenuRecord>
    title="菜单管理"
    description="维护管理后台导航、路由和按钮权限码；显示控制与服务端鉴权保持一致。"
    permissionHint="system:menu:manage"
    columns={columns}
    fields={[
      { name: 'name', label: '名称', required: true },
      { name: 'type', label: '类型', type: 'select', required: true, options: Object.entries(typeText).map(([value, label]) => ({ value, label })) },
      { name: 'parentId', label: '上级菜单 ID' },
      { name: 'path', label: '路由地址', required: true },
      { name: 'permissionCode', label: '权限码', required: true },
      { name: 'sort', label: '排序', type: 'number', required: true },
      { name: 'visible', label: '导航可见', type: 'switch' },
      { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '启用', value: 'ENABLED' }, { label: '停用', value: 'DISABLED' }] }
    ]}
    initialValues={{ type: 'MENU', sort: 0, visible: true, status: 'ENABLED' }}
    list={systemAdminApi.menus.list}
    save={systemAdminApi.menus.save}
    remove={systemAdminApi.menus.remove}
  />;
}
