import { ConfigProvider, Avatar, Button, Dropdown, Space } from 'antd';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import './global.less';
import { qiyuTheme, QIYU_PRIMARY, QIYU_WARM } from '@/theme';
import { clearAdminSession, readAdminSession, type AdminSession } from '@/services/admin-auth';
import { buildMenuData } from '@/constants/menu';

export interface InitialState {
  currentUser: AdminSession | null;
  name?: string;
  avatar?: false;
}

export async function getInitialState(): Promise<InitialState> {
  const session = readAdminSession();
  return { currentUser: session, name: session?.displayName, avatar: false };
}

export function rootContainer(container: React.ReactNode) {
  return <ConfigProvider theme={qiyuTheme}>{container}</ConfigProvider>;
}

export const layout = () => ({
  title: '栖愈运营中心',
  layout: 'side',
  navTheme: 'light',
  siderWidth: 232,
  logo: <div style={{ width: 32, height: 32, borderRadius: 8, background: QIYU_PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>栖</div>,
  menuDataRender: () => buildMenuData(readAdminSession()),
  rightContentRender: () => {
    const currentSession = readAdminSession();
    const items = [
      { key: 'profile', icon: <SettingOutlined />, label: '账号设置' },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          clearAdminSession();
          window.location.href = '/login';
        }
      }
    ];
    return (
      <Dropdown menu={{ items }} placement="bottomRight">
        <Button type="text">
          <Space>
            <Avatar size="small" style={{ background: QIYU_WARM }}>{currentSession?.role === 'STORE_MANAGER' ? '店' : currentSession?.role === 'HQ_ADMIN' ? '总' : '员'}</Avatar>
            {currentSession?.displayName ?? '栖愈运营人员'}
          </Space>
        </Button>
      </Dropdown>
    );
  }
});
