import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { managementApi, type ManagementPage, type ManagementQuery } from '@/services/management-service';
import { readAdminSession } from '@/services/admin-auth';

export function useManagementState() {
  const location = useLocation(); const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const set = useCallback((changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(location.search);
    Object.entries(changes).forEach(([key,value]) => value === undefined || value === '' ? next.delete(key) : next.set(key,String(value)));
    navigate(location.pathname + (next.size ? '?' + next.toString() : ''), { replace: true });
  }, [location.pathname,location.search,navigate]);
  return { params, set };
}
export function useManagementPage<T>(resource: string, query: ManagementQuery) {
  const [data,setData]=useState<ManagementPage<T>>({list:[],total:0,pageNum:1,pageSize:20});
  const [loading,setLoading]=useState(false); const [error,setError]=useState<string>();
  const [revision,setRevision]=useState(0); const key=JSON.stringify(query);
  const previous=useRef('');
  useEffect(()=>{
    let active=true;setLoading(true);setError(undefined);
    if(previous.current!==resource+key){setData({list:[],total:0,pageNum:1,pageSize:20});previous.current=resource+key;}
    managementApi.page<T>(resource,JSON.parse(key)).then(value=>active&&setData(value))
      .catch(reason=>active&&setError(reason instanceof Error?reason.message:'加载失败'))
      .finally(()=>active&&setLoading(false));
    return ()=>{active=false;};
  },[resource,key,revision]);
  return {data,loading,error,reload:()=>setRevision(v=>v+1)};
}
export function useStoreOptions(resource?: string) {
  const [options,setOptions]=useState<Array<{value:string;label:string}>>([]);
  const [error,setError]=useState<string>(); const [revision,setRevision]=useState(0);
  const account=readAdminSession()?.principal.userId;
  useEffect(()=>{
    let active=true;setOptions([]);setError(undefined);
    if(!resource)return ()=>{active=false;};
    managementApi.stores(resource).then(value=>active&&setOptions(value))
      .catch(reason=>active&&setError(reason instanceof Error?reason.message:'门店加载失败'));
    return ()=>{active=false;};
  },[resource,account,revision]);
  return {options,error,retry:()=>setRevision(v=>v+1)};
}
