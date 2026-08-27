import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DashboardOutlined,
  GiftOutlined,
  HomeOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  ReconciliationOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  AuditOutlined,
  BookOutlined,
  MenuOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Result, Space, Spin, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { can, clearAdminSession, readAdminSession, type AdminSession } from '@/services/admin-auth';

const { Header, Sider, Content } = Layout;
const businessMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '总部运营看板' },
  { key: '/stores', icon: <HomeOutlined />, label: '门店管理' },
  { key: '/appointments', icon: <CalendarOutlined />, label: '预约管理' },
  { key: '/checkin', icon: <ReconciliationOutlined />, label: '到店核销' },
  { key: '/service-orders', icon: <AppstoreOutlined />, label: '服务订单' },
  { key: '/schedule', icon: <CalendarOutlined />, label: '排班管理' },
  { key: '/therapists', icon: <TeamOutlined />, label: '技师管理' },
  { key: '/services', icon: <MedicineBoxOutlined />, label: '服务项目' },
  { key: '/rooms', icon: <HomeOutlined />, label: '房间管理' },
  { key: '/customers', icon: <UserOutlined />, label: '客户管理' },
  { key: '/members', icon: <TeamOutlined />, label: '会员管理' },
  { key: '/coupons', icon: <GiftOutlined />, label: '优惠券' },
  { key: '/reports', icon: <BarChartOutlined />, label: '经营报表' }
];

const systemMenuItems = [
  { key: '/system/organizations', icon: <ApartmentOutlined />, label: '组织与部门' },
  { key: '/system/users', icon: <UserOutlined />, label: '系统用户' },
  { key: '/system/roles', icon: <SafetyCertificateOutlined />, label: '角色与权限' },
  { key: '/system/menus', icon: <MenuOutlined />, label: '菜单管理' },
  { key: '/system/dictionaries', icon: <BookOutlined />, label: '数据字典' },
  { key: '/system/audit-logs', icon: <AuditOutlined />, label: '审计日志' }
];

const menuPermission: Record<string, string> = {
  '/dashboard': 'dashboard:read', '/stores': 'store:read', '/appointments': 'booking:read', '/checkin': 'booking:checkin', '/service-orders': 'service_order:read', '/schedule': 'schedule:read', '/therapists': 'therapist:read', '/services': 'service:read', '/rooms': 'room:read', '/customers': 'customer:read', '/members': 'member:read', '/coupons': 'coupon:read', '/reports': 'report:read',
  '/system/organizations': 'system:organization:read', '/system/users': 'system:user:read', '/system/roles': 'system:role:read', '/system/menus': 'system:menu:read', '/system/dictionaries': 'system:dictionary:read', '/system/audit-logs': 'system:audit:read'
};

export default function AdminLayout() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  useEffect(() => {
    const currentSession = readAdminSession();
    if (!currentSession) {
      window.location.replace('/login');
      return;
    }
    setSession(currentSession);
    setAuthenticated(true);
  }, []);
  if (!authenticated) return <Spin size="large" style={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }} />;
  const visibleBusinessItems = businessMenuItems.filter((item) => can(session, menuPermission[item.key]));
  const visibleSystemItems = systemMenuItems.filter((item) => can(session, menuPermission[item.key]));
  const visibleMenuItems: MenuProps['items'] = [
    ...visibleBusinessItems,
    ...(visibleSystemItems.length ? [{ key: 'system', icon: <SettingOutlined />, label: '系统管理', children: visibleSystemItems }] : [])
  ];
  const navigate = (path: string) => { window.location.href = path; };
  const userMenu: MenuProps['items'] = [
    { key: 'profile', icon: <SettingOutlined />, label: '账号设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { clearAdminSession(); navigate('/login'); } }
  ];
  return <Layout style={{ minHeight: '100vh' }}>
    <Sider width={232} theme="light" style={{ borderRight: '1px solid #edf0ec', padding: '20px 12px', overflowY: 'auto' }}>
      <Space align="center" style={{ padding: '4px 14px 28px' }}>
        <Avatar shape="square" size={36} style={{ background: '#5d806d', borderRadius: 10 }}>栖</Avatar>
        <div><Typography.Text strong style={{ fontSize: 17 }}>栖愈运营中心</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>推拿 · SPA</Typography.Text></div>
      </Space>
      <Menu mode="inline" selectedKeys={[window.location.pathname]} defaultOpenKeys={window.location.pathname.startsWith('/system/') ? ['system'] : []} items={visibleMenuItems} onClick={({ key }) => { if (key.startsWith('/')) navigate(key); }} style={{ border: 0 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 26, color: '#7c8780', fontSize: 12 }}>统一运营 · 全门店通用</div>
    </Sider>
    <Layout>
      <Header style={{ background: '#fff', borderBottom: '1px solid #edf0ec', padding: '0 28px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Dropdown menu={{ items: userMenu }}><Button type="text"><Space><Avatar size="small" style={{ background: '#b58c5e' }}>{session?.role === 'STORE_MANAGER' ? '店' : '总'}</Avatar>{session?.displayName}</Space></Button></Dropdown>
      </Header>
      <Content style={{ padding: 28, overflow: 'auto' }}>{menuPermission[window.location.pathname] && !can(session, menuPermission[window.location.pathname]) ? <Result status="403" title="无访问权限" subTitle="当前账号没有访问此功能的权限。" /> : <Outlet />}</Content>
    </Layout>
  </Layout>;
}
