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
let now = 1786632000000;
Date.now = () => now;

try {
  const initialBookings = await mockService.getBookings();
  const initialCount = initialBookings.length;

  const createDraft = {
    storeId: 'jingan',
    serviceId: 'spa',
    therapistMode: 'auto',
    therapistId: undefined,
    slotId: '1900',
    guestCount: 2,
    contact: '烟火测试',
    remark: '确认页新建预约 smoke',
    benefitSelection: '新人体验券 ¥20',
    flow: 'create',
    sourceBookingId: undefined
  };
  const createdBooking = await mockService.createBooking(createDraft, 'create-smoke-1786632000000');
  assert(createdBooking.id === 'booking-1786632000000', 'create flow should use new deterministic booking id');
  assert(createdBooking.code === 'QY632000000', 'create flow should generate deterministic booking code');
  assert(createdBooking.store.id === 'jingan', 'created booking should use selected store');
  assert(createdBooking.service.id === 'spa', 'created booking should use selected service');
  assert(createdBooking.scheduledAt.includes('19:00'), 'created booking should use selected slot');
  assert(createdBooking.contact.startsWith('烟火测试'), 'created booking should use draft contact');
  assert(createdBooking.payment.itemAmount === 716, 'created booking should calculate item amount by guest count');

  const bookingsAfterCreate = await mockService.getBookings();
  assert(bookingsAfterCreate.length === initialCount + 1, 'create flow should add exactly one booking');
  assert(bookingsAfterCreate[0].id === createdBooking.id, 'created booking should be inserted first for order list freshness');

  const reschedulePayload = await mockService.getBookingRescheduleDraft('booking-1001');
  const rescheduleDraft = {
    ...reschedulePayload.draft,
    slotId: '1900',
    therapistMode: 'auto',
    therapistId: undefined,
    contact: '林知夏',
    remark: '确认页改期 smoke'
  };

  now = 1786632001000;
  const rescheduledBooking = await mockService.rescheduleBooking(rescheduleDraft, 'reschedule-smoke-1786632001000');
  assert(rescheduledBooking.id === 'booking-1001', 'reschedule flow should keep source booking id');
  assert(rescheduledBooking.scheduledAt.includes('19:00'), 'reschedule flow should update scheduled slot');
  assert(rescheduledBooking.store.id === rescheduleDraft.storeId, 'reschedule flow should keep draft store');
  assert(rescheduledBooking.service.id === rescheduleDraft.serviceId, 'reschedule flow should keep draft service');
  assert(rescheduledBooking.status === 'BOOKED', 'reschedule flow should keep booking status');

  const bookingsAfterReschedule = await mockService.getBookings();
  assert(bookingsAfterReschedule.length === initialCount + 1, 'reschedule flow should not create another booking');
  assert(bookingsAfterReschedule.filter((booking) => booking.id === 'booking-1001').length === 1, 'reschedule flow should keep one source booking record');
  const persistedRescheduledBooking = await mockService.getBooking('booking-1001');
  assert(persistedRescheduledBooking.scheduledAt === rescheduledBooking.scheduledAt, 'reschedule flow should persist updated scheduled time');
} finally {
  Date.now = originalDateNow;
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Confirm submit smoke passed.');
