import { App, ConfigProvider, Avatar, Button, Dropdown, Space } from 'antd';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import './global.less';
import { qiyuTheme, QIYU_PRIMARY, QIYU_WARM } from '@/theme';
import { clearAdminSession, readAdminSession, type AdminSession } from '@/services/admin-auth';
import { buildConfiguredMenu } from '@/constants/menu';
import { systemAdminApi } from '@/services/system-service';
import type { SystemMenuRecord } from '@/types/system';
import zhCN from 'antd/locale/zh_CN';
import { ReceptionProvider } from '@/components/reception/ReceptionContext';

export interface InitialState {
  navigation?: SystemMenuRecord[];
  navigationError?: string;
  currentUser: AdminSession | null;
  name?: string;
  avatar?: false;
}

export async function getInitialState(): Promise<InitialState> {
  const session = readAdminSession();
  const state:InitialState={ currentUser: session, name: session?.displayName, avatar: false };
  if(session){try{state.navigation=await systemAdminApi.navigation();}catch(e){state.navigationError=e instanceof Error?e.message:'导航加载失败';}}
  return state;
}

export function rootContainer(container: React.ReactNode) {
  return <ConfigProvider locale={zhCN} theme={qiyuTheme}><App><ReceptionProvider>{container}</ReceptionProvider></App></ConfigProvider>;
}

export const layout = ({initialState}:{initialState?:InitialState}) => ({
  title: '栖愈运营中心',
  layout: 'side',
  navTheme: 'light',
  siderWidth: 232,
  logo: <div style={{ width: 32, height: 32, borderRadius: 8, background: QIYU_PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>栖</div>,
  menuDataRender: () => buildConfiguredMenu(initialState?.navigation||[]),
  menuExtraRender: () => initialState?.navigationError?<Space direction="vertical"><span>导航加载失败</span><Button onClick={()=>window.location.reload()}>重新加载</Button></Space>:null,
  rightContentRender: () => {
    const currentSession = readAdminSession();
    const items = [
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
