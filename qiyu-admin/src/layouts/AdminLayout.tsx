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
  SettingOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Space, Spin, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';
import { clearAdminSession, readAdminSession, roleMenuPaths, type AdminSession } from '@/services/admin-auth';

const { Header, Sider, Content } = Layout;
const menuItems = [
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

export default function AdminLayout({ children }: { children?: ReactNode }) {
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
  const visibleMenuItems = menuItems.filter((item) => session && roleMenuPaths[session.role].includes(item.key));
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
      <Menu mode="inline" selectedKeys={[window.location.pathname]} items={visibleMenuItems} onClick={({ key }) => navigate(key)} style={{ border: 0 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 26, color: '#7c8780', fontSize: 12 }}>统一运营 · 全门店通用</div>
    </Sider>
    <Layout>
      <Header style={{ background: '#fff', borderBottom: '1px solid #edf0ec', padding: '0 28px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Dropdown menu={{ items: userMenu }}><Button type="text"><Space><Avatar size="small" style={{ background: '#b58c5e' }}>{session?.role === 'STORE_MANAGER' ? '店' : '总'}</Avatar>{session?.displayName}</Space></Button></Dropdown>
      </Header>
      <Content style={{ padding: 28, overflow: 'auto' }}>{children}</Content>
    </Layout>
  </Layout>;
}
