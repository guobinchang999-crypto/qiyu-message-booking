import { Navigate, useLocation } from 'react-router-dom';
export default function MembersPage() { const location=useLocation(); const params=new URLSearchParams(location.search); params.set('view','assets');return <Navigate replace to={'/customers?'+params.toString()} />; }
