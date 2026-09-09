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
    name: '数据中心',
    icon: <DashboardOutlined />,
    children: [
      { path: '/dashboard', name: '总部运营看板', icon: <BarChartOutlined />, permission: 'dashboard:read' },
      { path: '/reports', name: '经营报表', icon: <ReconciliationOutlined />, permission: 'report:read' }
    ]
  },
  {
    path: '/booking-fulfillment',
    name: '预约履约',
    icon: <CalendarOutlined />,
    children: [
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
      { path: '/services', name: '服务项目', icon: <MedicineBoxOutlined />, permission: 'service:read' },
      { path: '/rooms', name: '房间管理', icon: <HomeOutlined />, permission: 'room:read' }
    ]
  },
  {
    path: '/member-marketing',
    name: '会员营销',
    icon: <GiftOutlined />,
    children: [
      { path: '/customers', name: '客户管理', icon: <UserOutlined />, permission: 'customer:read' },
      { path: '/members', name: '会员管理', icon: <TeamOutlined />, permission: 'member:read' },
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

export const menuPermission: Record<string, string> = Object.fromEntries(
  menuGroups.flatMap((group) => group.children.map((item) => [item.path, item.permission]))
);

export const buildMenuData = (session: AdminSession | null): MenuDataItem[] => {
  const result: MenuDataItem[] = [];
  for (const group of menuGroups) {
    const children = group.children
      .filter((item) => can(session, item.permission))
      .map(({ path, name, icon }) => ({ path, name, icon }));
    if (children.length > 0) {
      result.push({ path: group.path, name: group.name, icon: group.icon, children });
    }
  }
  return result;
};
