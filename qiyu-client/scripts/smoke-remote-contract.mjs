import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFileSync(join(rootDir, path), 'utf8');
const remoteSource = read('miniprogram/services/remote-service.ts');
const httpSource = read('miniprogram/services/http.ts');
const timeSource = read('miniprogram/pages/time/index.ts');
const draftSource = read('miniprogram/store/booking.ts');
const storeDetailSource = read('miniprogram/pages/store-detail/index.ts');
const serviceDetailSource = read('miniprogram/pages/service-detail/index.ts');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(draftSource.includes('appointmentDate: defaultAppointmentDate()'), 'booking draft should initialize a future appointment date');
assert(draftSource.includes("storeId: ''") && draftSource.includes("serviceId: ''"), 'booking draft must not initialize fixture resource IDs');
assert(remoteSource.includes("date: requireId(draft.appointmentDate, '预约日期')"), 'time-slot query should validate and use the draft appointment date');
assert(remoteSource.includes("date: requireId(draft.appointmentDate, '预约日期'), startTime"), 'booking writes should validate and use the draft appointment date');
assert(timeSource.includes('bookingStore.update({ appointmentDate, slotId:undefined })'), 'date changes should clear the stale slot');
assert(timeSource.includes('await this.loadTimeSlots()'), 'date changes should reload available slots');
assert(httpSource.includes('wx.uploadFile({'), 'review images should use Mini Program multipart upload');
assert(remoteSource.includes("upload<unknown>('/reviews/images'"), 'review image service should use the upload adapter');
assert(remoteSource.includes('/member/favorites/'), 'favorites should use the authenticated member backend contract');
assert(httpSource.includes("'PUT' | 'DELETE'"), 'HTTP adapter should support favorite mutations');
assert(storeDetailSource.includes("getFavorite('stores'") && storeDetailSource.includes("setFavorite('stores'"), 'store details should persist favorite state');
assert(serviceDetailSource.includes("getFavorite('services'") && serviceDetailSource.includes("setFavorite('services'"), 'service details should persist favorite state');
for (const operation of ['checkin', 'verification-code/refresh', 'cancel', 'pay']) {
  const line = remoteSource.split('\n').find((item) => item.includes(`/${operation}`));
  assert(line?.includes('requestId'), `${operation} should send its idempotency requestId`);
}
const reviewSubmitSource = remoteSource.slice(remoteSource.indexOf('async submitReview'), remoteSource.indexOf('\n  }\n};', remoteSource.indexOf('async submitReview')));
assert(reviewSubmitSource.includes('imageUrls: review.imageUrls') && reviewSubmitSource.includes('requestId'), 'review submission should send its idempotency requestId');

console.log('Remote contract smoke passed.');
