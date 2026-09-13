import {
  ApartmentOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  DashboardOutlined,
  GiftOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  MenuOutlined,
  ReconciliationOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-components';
import type { AdminSession } from '@/services/admin-auth';
import { can } from '@/services/admin-auth';
import type { SystemMenuRecord } from '@/types/system';

export function buildConfiguredMenu(rows:SystemMenuRecord[]):MenuDataItem[]{
  const icons=new Map(menuGroups.flatMap(g=>g.children.map(c=>[c.path,c.icon] as const)));
  const nodes=new Map<string,MenuDataItem>(rows.map(r=>[r.id,{key:r.id,path:r.type==='DIRECTORY'?'/navigation-'+r.id:r.path,name:r.name,icon:icons.get(r.path)||<SettingOutlined />,children:r.type==='DIRECTORY'?[]:undefined}]));
  const roots:MenuDataItem[]=[];
  rows.forEach(r=>{const node=nodes.get(r.id)!;const parent=r.parentId?nodes.get(r.parentId):undefined;if(parent)parent.children?.push(node);else roots.push(node);});
  return roots;
}

interface MenuEntry {
  path: string;
  name: string;
  icon: React.ReactNode;
  permission: string;
}

interface MenuGroup {
  path: string;
  name: string;
  icon: React.ReactNode;
  children: MenuEntry[];
}

const menuGroups: MenuGroup[] = [
  {
    path: '/data-center',
    name: '经营分析',
    icon: <DashboardOutlined />,
    children: [
      { path: '/dashboard', name: '经营概览', icon: <BarChartOutlined />, permission: 'dashboard:read' },
      { path: '/reports', name: '经营报表', icon: <ReconciliationOutlined />, permission: 'report:read' }
    ]
  },
  {
    path: '/booking-fulfillment',
    name: '门店接待',
    icon: <CalendarOutlined />,
    children: [
      { path: '/reception', name: '今日接待', icon: <HomeOutlined />, permission: 'booking:read' },
      { path: '/appointments', name: '预约管理', icon: <CalendarOutlined />, permission: 'booking:read' },
      { path: '/checkin', name: '到店核销', icon: <ReconciliationOutlined />, permission: 'booking:checkin' },
      { path: '/service-orders', name: '服务订单', icon: <AppstoreOutlined />, permission: 'service_order:read' },
      { path: '/schedule', name: '排班管理', icon: <CalendarOutlined />, permission: 'schedule:read' }
    ]
  },
  {
    path: '/store-resources',
    name: '门店资源',
    icon: <HomeOutlined />,
    children: [
      { path: '/stores', name: '门店管理', icon: <HomeOutlined />, permission: 'store:read' },
      { path: '/therapists', name: '技师管理', icon: <TeamOutlined />, permission: 'therapist:read' },
      { path: '/services', name: '服务项目', icon: <MedicineBoxOutlined />, permission: 'service:read' }
    ]
  },
  {
    path: '/member-marketing',
    name: '客户与会员',
    icon: <GiftOutlined />,
    children: [
      { path: '/customers', name: '客户中心', icon: <UserOutlined />, permission: 'customer:read' },
      { path: '/coupons', name: '优惠券', icon: <GiftOutlined />, permission: 'coupon:read' }
    ]
  },
  {
    path: '/system',
    name: '系统管理',
    icon: <SettingOutlined />,
    children: [
      { path: '/system/organizations', name: '组织与部门', icon: <ApartmentOutlined />, permission: 'system:org:manage' },
      { path: '/system/users', name: '系统用户', icon: <UserOutlined />, permission: 'system:user:manage' },
      { path: '/system/roles', name: '角色与权限', icon: <SafetyCertificateOutlined />, permission: 'system:role:manage' },
      { path: '/system/menus', name: '菜单管理', icon: <MenuOutlined />, permission: 'system:menu:manage' },
      { path: '/system/dictionaries', name: '数据字典', icon: <BookOutlined />, permission: 'system:dict:manage' },
      { path: '/system/audit-logs', name: '审计日志', icon: <AuditOutlined />, permission: 'audit:read' }
    ]
  }
];

/** 不在侧栏展示、但仍需权限守卫的页面（房间通过门店管理抽屉维护）。 */
const hiddenMenuPermissions: Record<string, string> = {
  '/rooms': 'room:read'
};

export const menuPermission: Record<string, string> = {
  ...Object.fromEntries(menuGroups.flatMap((group) => group.children.map((item) => [item.path, item.permission]))),
  ...hiddenMenuPermissions
};

export const buildMenuData = (session: AdminSession | null): MenuDataItem[] => {
  const result: MenuDataItem[] = [];
  for (const group of [menuGroups[1], menuGroups[2], menuGroups[3], menuGroups[0], menuGroups[4]]) {
    const children = group.children
      .filter((item) => can(session, item.permission) || (item.path==='/customers' && can(session,'member:read')))
      .map(({ path, name, icon }) => ({ path, name, icon }));
    if (children.length > 0) {
      result.push({ path: group.path, name: group.name, icon: group.icon, children });
    }
  }
  return result;
};
