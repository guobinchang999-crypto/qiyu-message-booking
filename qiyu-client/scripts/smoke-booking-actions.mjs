import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { mockService } = require(resolve(rootDir, 'miniprogram/services/mock-service.js'));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const originalDateNow = Date.now;
let now = 1786631000000;
Date.now = () => now;

try {
  const bookingBeforeRefresh = await mockService.getBooking('booking-1001');
  assert(bookingBeforeRefresh.status === 'BOOKED', 'initial booking should be booked before action smoke');
  assert(bookingBeforeRefresh.availableActions.includes('refresh_code'), 'booked booking should allow code refresh');

  const refreshedBooking = await mockService.refreshBookingCode('booking-1001', 'refresh-smoke-1786631000000');
  assert(refreshedBooking.code === 'QY631000000', 'refresh should generate deterministic booking code');
  assert(refreshedBooking.qrImageUrl?.endsWith('/QY631000000.png'), 'refresh should update qr image url with new code');
  assert(refreshedBooking.status === 'BOOKED', 'refresh should not change booking status');

  now = 1786631001000;
  const checkedInBooking = await mockService.checkinBooking('booking-1001', 'checkin-smoke-1786631001000');
  assert(checkedInBooking.status === 'CHECKED_IN', 'checkin should move booking to checked in status');
  assert(checkedInBooking.availableActions.includes('contact'), 'checked in booking should keep contact action');
  assert(checkedInBooking.availableActions.includes('view_detail'), 'checked in booking should keep view detail action');
  assert(!checkedInBooking.availableActions.includes('refresh_code'), 'checked in booking should remove refresh code action');
  assert(!checkedInBooking.availableActions.includes('reschedule'), 'checked in booking should remove reschedule action');

  const bookingAfterCheckin = await mockService.getBooking('booking-1001');
  assert(bookingAfterCheckin.status === 'CHECKED_IN', 'booking detail should persist checked in status');

  const cancelledBooking = await mockService.cancelBooking('booking-1002', 'cancel-smoke-1786631002000');
  assert(cancelledBooking.status === 'CANCELLED', 'cancel should move pending payment booking to cancelled status');
  assert(cancelledBooking.availableActions.includes('rebook'), 'cancelled booking should allow rebook');
  assert(cancelledBooking.availableActions.includes('view_detail'), 'cancelled booking should allow view detail');
  assert(!cancelledBooking.availableActions.includes('pay'), 'cancelled booking should remove pay action');
  assert(!cancelledBooking.availableActions.includes('cancel'), 'cancelled booking should remove cancel action');

  const bookingAfterCancel = await mockService.getBooking('booking-1002');
  assert(bookingAfterCancel.status === 'CANCELLED', 'booking detail should persist cancelled status');
} finally {
  Date.now = originalDateNow;
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Booking actions smoke passed.');
