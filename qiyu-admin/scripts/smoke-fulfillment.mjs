import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFileSync(join(rootDir, path), 'utf8');
const serviceOrdersSource = read('src/pages/ServiceOrders/index.tsx');
const checkinSource = read('src/pages/Checkin/index.tsx');
const tableSource = read('src/components/ManagementTablePage.tsx');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const remoteSource = read('src/services/remote.ts');
assert(remoteSource.includes('getAppointmentAuditLogs'), 'remote API should expose audit log query');
assert(!serviceOrdersSource.includes('adminMockApi'), 'service orders must use real backend data');
assert(serviceOrdersSource.includes('openAudit'), 'service orders should expose audit entry');
assert(serviceOrdersSource.includes('<Drawer title="操作记录"'), 'service orders should render audit drawer');
assert(checkinSource.includes('batchCheckIn'), 'checkin page should expose batch check-in action');
assert(checkinSource.includes('rowSelection'), 'checkin page should configure row selection');
assert(tableSource.includes('rowSelection?:'), 'management table should support row selection');
assert(tableSource.includes('props.toolbar'), 'management table should support toolbar actions');

console.log('Admin fulfillment smoke passed.');
