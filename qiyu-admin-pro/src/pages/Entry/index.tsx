import { Navigate } from 'react-router-dom';
import { buildMenuData } from '@/constants/menu';
import { can, readAdminSession } from '@/services/admin-auth';
export default function Entry() {
  const session = readAdminSession();
  const destination = session?.role === 'HQ_ADMIN' && can(session,'dashboard:read') ? '/dashboard' :
    can(session,'booking:read') ? '/reception' : buildMenuData(session)[0]?.children?.[0]?.path || '/login';
  return <Navigate to={destination} replace />;
}
