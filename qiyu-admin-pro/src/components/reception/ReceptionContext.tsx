import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { receptionApi, type ReceptionOptions } from '@/services/reception-service';
import { can, readAdminSession } from '@/services/admin-auth';
import { errorText } from '@/constants/reception';

const empty: ReceptionOptions = { stores: [], services: [], therapists: [], rooms: [] };
interface Scope { storeId?: string; date: string }
interface ContextValue extends Scope {
  options: ReceptionOptions; loading: boolean; error?: string; revision: number;
  setScope: (value: Partial<Scope>) => void; refresh: () => void; retry: () => void;
}
const Context = createContext<ContextValue | undefined>(undefined);
export function ReceptionProvider({ children }: { children: React.ReactNode }) {
  const session = readAdminSession();
  const account = String(session?.principal.userId || 'guest');
  const key = 'qiyu-reception-scope-' + account;
  const [scope, setLocalScope] = useState<Scope>(() => {
    try { const cached = JSON.parse(sessionStorage.getItem(key) || '{}'); return { storeId: cached.storeId, date: dayjs(cached.date).isValid() ? cached.date || dayjs().format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD') }; }
    catch { return { date: dayjs().format('YYYY-MM-DD') }; }
  });
  const [options, setOptions] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [revision, setRevision] = useState(0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!session || !['booking:read','booking:create','booking:checkin','service_order:read'].some(permission => can(session,permission))) return;
    let active = true; setLoading(true); setError(undefined);
    receptionApi.options().then(value => {
      if (!active) return;
      setOptions(value);
      setLocalScope(current => ({ ...current, storeId: value.stores.some(s => s.value === current.storeId) ? current.storeId : value.stores[0]?.value }));
    }).catch(reason => active && setError(errorText(reason))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [account, attempt]);
  useEffect(() => { sessionStorage.setItem(key,JSON.stringify(scope)); }, [key,scope]);
  const setScope = useCallback((value: Partial<Scope>) => setLocalScope(current => ({ ...current, ...value })), []);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  return <Context.Provider value={{ ...scope, options, loading, error, revision, setScope, refresh, retry: () => setAttempt(value => value + 1) }}>{children}</Context.Provider>;
}
export const useReception = () => {
  const value = useContext(Context); if (!value) throw new Error('ReceptionProvider is required'); return value;
};

