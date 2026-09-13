import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Result } from 'antd';
import { can, readAdminSession } from '@/services/admin-auth';
import { menuPermission } from '@/constants/menu';

export default function AuthWrapper() {
  const location = useLocation();
  const session = readAdminSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  const requiredPermission = menuPermission[location.pathname];
  if (requiredPermission && !can(session, requiredPermission) && !(location.pathname==='/customers' && can(session,'member:read'))) {
    return <Result status="403" title="无访问权限" subTitle="当前账号没有访问此功能的权限。" />;
  }
  return <Outlet />;
}
