import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { bookingStore } = require(resolve(rootDir, 'miniprogram/store/booking.js'));
const { mockService } = require(resolve(rootDir, 'miniprogram/services/mock-service.js'));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

bookingStore.reset();

const rebookPayload = await mockService.getBookingRebookDraft('booking-1000');
bookingStore.update(rebookPayload.draft);
const rebookDraft = bookingStore.get();
assert(rebookPayload.sourceBookingId === 'booking-1000', 'rebook payload should retain source booking id outside draft');
assert(rebookDraft.flow === 'create', 'rebook draft should use create flow');
assert(rebookDraft.sourceBookingId === undefined, 'rebook draft should not carry sourceBookingId into create flow');
assert(rebookDraft.storeId === rebookPayload.draft.storeId, 'rebook draft should keep original store');
assert(rebookDraft.serviceId === rebookPayload.draft.serviceId, 'rebook draft should keep original service');
assert(rebookDraft.therapistMode === 'auto', 'rebook draft should reset therapist mode to auto');
assert(rebookDraft.therapistId === undefined, 'rebook draft should clear therapist');
assert(rebookDraft.slotId === undefined, 'rebook draft should clear slot');

const reschedulePayload = await mockService.getBookingRescheduleDraft('booking-1001');
bookingStore.update(reschedulePayload.draft);
const rescheduleDraft = bookingStore.get();
assert(reschedulePayload.sourceBookingId === 'booking-1001', 'reschedule payload should retain source booking id');
assert(rescheduleDraft.flow === 'reschedule', 'reschedule draft should use reschedule flow');
assert(rescheduleDraft.sourceBookingId === 'booking-1001', 'reschedule draft should carry sourceBookingId for submit');
assert(rescheduleDraft.storeId === reschedulePayload.draft.storeId, 'reschedule draft should keep original store');
assert(rescheduleDraft.serviceId === reschedulePayload.draft.serviceId, 'reschedule draft should keep original service');
assert(rescheduleDraft.slotId === undefined, 'reschedule draft should require a new slot selection');
assert(rescheduleDraft.contact.length > 0, 'reschedule draft should preserve contact name');

bookingStore.selectService('spa');
const changedRescheduleServiceDraft = bookingStore.get();
assert(changedRescheduleServiceDraft.flow === 'reschedule', 'changing service during reschedule should keep reschedule flow');
assert(changedRescheduleServiceDraft.sourceBookingId === 'booking-1001', 'changing service during reschedule should keep source booking id');
assert(changedRescheduleServiceDraft.therapistMode === 'auto', 'changing service during reschedule should reset therapist mode');
assert(changedRescheduleServiceDraft.therapistId === undefined, 'changing service during reschedule should clear therapist');
assert(changedRescheduleServiceDraft.slotId === undefined, 'changing service during reschedule should keep slot cleared');

bookingStore.reset();

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Booking draft flow smoke passed.');
