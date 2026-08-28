import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFileSync(join(rootDir, path), 'utf8');
const remoteSource = read('miniprogram/services/remote-service.ts');
const httpSource = read('miniprogram/services/http.ts');
const timeSource = read('miniprogram/pages/time/index.ts');
const draftSource = read('miniprogram/store/booking.ts');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(draftSource.includes('appointmentDate:defaultAppointmentDate()'), 'booking draft should initialize a future appointment date');
assert(remoteSource.includes('date: draft?.appointmentDate'), 'time-slot query should use the draft appointment date');
assert(remoteSource.includes('date: draft.appointmentDate'), 'booking writes should use the draft appointment date');
assert(timeSource.includes('bookingStore.update({ appointmentDate, slotId:undefined })'), 'date changes should clear the stale slot');
assert(timeSource.includes('await this.loadTimeSlots()'), 'date changes should reload available slots');
assert(httpSource.includes('wx.uploadFile({'), 'review images should use Mini Program multipart upload');
assert(remoteSource.includes("upload<unknown>('/reviews/images'"), 'review image service should use the upload adapter');
for (const operation of ['checkin', 'verification-code/refresh', 'cancel', 'pay']) {
  const line = remoteSource.split('\n').find((item) => item.includes(`/bookings/${'${id}'}/${operation}`));
  assert(line?.includes('requestId'), `${operation} should send its idempotency requestId`);
}
assert(remoteSource.includes('imageUrls: review.imageUrls,\n        requestId'), 'review submission should send its idempotency requestId');

console.log('Remote contract smoke passed.');
