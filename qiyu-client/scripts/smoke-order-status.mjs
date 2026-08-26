import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { mockService } = require(resolve(rootDir, 'miniprogram/services/mock-service.js'));

const expectedStatusLabels = {
  PENDING_PAYMENT: '待支付',
  BOOKED: '已预约',
  CHECKED_IN: '已签到',
  WAITING_SERVICE: '待服务',
  IN_SERVICE: '服务中',
  PENDING_SETTLEMENT: '待结算',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
};
const expectedStatuses = Object.keys(expectedStatusLabels);
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const domainSource = readFileSync(resolve(rootDir, 'miniprogram/types/domain.ts'), 'utf8');
const bookingStatusMatch = domainSource.match(/export type BookingStatus = ([^;]+);/);
assert(Boolean(bookingStatusMatch), 'BookingStatus type should be declared');
const typeStatuses = bookingStatusMatch
  ? [...bookingStatusMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  : [];
assert(typeStatuses.join(',') === expectedStatuses.join(','), 'BookingStatus type should match unified status order');

const dictionaries = await mockService.getOrderDictionaries();
for (const [status, label] of Object.entries(expectedStatusLabels)) {
  assert(dictionaries.statusLabel[status] === label, `order dictionary should map ${status} to ${label}`);
}
assert(Object.keys(dictionaries.statusLabel).sort().join(',') === expectedStatuses.slice().sort().join(','), 'order status labels should not add extra statuses');

const tabStatuses = dictionaries.tabs.flatMap((tab) => tab.statuses || []);
for (const status of expectedStatuses) {
  assert(tabStatuses.includes(status), `order tabs should include ${status}`);
}
assert(new Set(tabStatuses).size === tabStatuses.length, 'order tab status filters should not duplicate statuses');

const bookings = await mockService.getBookings();
for (const booking of bookings) {
  assert(expectedStatuses.includes(booking.status), `mock booking ${booking.id} should use a unified status`);
  assert(Boolean(dictionaries.statusLabel[booking.status]), `mock booking ${booking.id} should have a display label`);
}
assert(bookings.some((booking) => booking.status === 'PENDING_PAYMENT'), 'mock bookings should include pending payment sample');
assert(bookings.some((booking) => booking.status === 'BOOKED'), 'mock bookings should include booked sample');
assert(bookings.some((booking) => booking.status === 'COMPLETED'), 'mock bookings should include completed sample');
assert(bookings.some((booking) => booking.status === 'CANCELLED'), 'mock bookings should include cancelled sample');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Order status smoke passed.');
