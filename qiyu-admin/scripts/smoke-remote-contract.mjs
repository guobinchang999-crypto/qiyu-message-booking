import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const read = (file) => readFileSync(resolve(rootDir, file), 'utf8');
const dashboard = read('src/pages/Dashboard/index.tsx');
const service = read('src/services/admin-service.ts');
const remote = read('src/services/remote.ts');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(dashboard.includes("import { adminApi } from '@/services/admin-service'"), 'dashboard should use the service boundary');
assert(!service.includes('adminMockApi'), 'admin service must not depend on mock data');
assert(service.includes('adminRemoteApi.getDashboard()'), 'admin service should expose the real dashboard API');
assert(remote.includes("'/admin/dashboard'"), 'remote service should call the backend dashboard contract');
assert(remote.includes('revenueTrend'), 'remote service should map backend revenue trend');
assert(remote.includes('storeRanking'), 'remote service should map backend store ranking');
assert(service.includes('getResources'), 'admin service should expose real resources');
assert(remote.includes("'/admin/schedule-resources'"), 'remote service should call the backend schedule resources contract');
assert(remote.includes("status === 'AVAILABLE' ? 'FREE'"), 'remote service should map backend room availability status');
assert(!read('src/pages/Resources/index.tsx').includes('adminMockApi'), 'resources page must use real backend data');

console.log('Admin remote contract smoke passed.');
