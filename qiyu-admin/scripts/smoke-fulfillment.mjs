import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFileSync(join(rootDir, path), 'utf8');
const mockSource = read('src/services/mock.ts');
const serviceOrdersSource = read('src/pages/ServiceOrders/index.tsx');
const checkinSource = read('src/pages/Checkin/index.tsx');
const tableSource = read('src/components/ManagementTablePage.tsx');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(mockSource.includes('let auditLogsState'), 'mock API should keep in-memory audit logs');
assert(mockSource.includes('const recordAudit'), 'mock API should record appointment actions');
assert(mockSource.includes('getAppointmentAuditLogs'), 'mock API should expose audit log query');
assert(serviceOrdersSource.includes('openAudit'), 'service orders should expose audit entry');
assert(serviceOrdersSource.includes('<Drawer title="操作记录"'), 'service orders should render audit drawer');
assert(checkinSource.includes('batchCheckIn'), 'checkin page should expose batch check-in action');
assert(checkinSource.includes('rowSelection'), 'checkin page should configure row selection');
assert(tableSource.includes('rowSelection?:'), 'management table should support row selection');
assert(tableSource.includes('props.toolbar'), 'management table should support toolbar actions');

console.log('Admin fulfillment smoke passed.');
