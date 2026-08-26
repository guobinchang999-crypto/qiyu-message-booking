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
Date.now = () => 1786630500000;

try {
  const bookingBeforeReview = await mockService.getBooking('booking-1000');
  assert(bookingBeforeReview.availableActions.includes('review'), 'completed booking should allow review before submit');

  const submittedBooking = await mockService.submitReview({
    bookingId: 'booking-1000',
    therapistRating: 5,
    environmentRating: 4,
    serviceRating: 5,
    tags: ['手法专业', '环境安静'],
    content: '这是一条 smoke 提交的评价内容，验证评价回流到详情页列表。',
    anonymous: true,
    imageUrls: ['https://mock-cdn.qiyu.local/reviews/smoke.jpg']
  }, 'review-smoke-1786630500000');

  assert(!submittedBooking.availableActions.includes('review'), 'submitted booking should remove review action');

  const bookingAfterReview = await mockService.getBooking('booking-1000');
  assert(!bookingAfterReview.availableActions.includes('review'), 'booking detail should no longer expose review action');

  const storeReviews = await mockService.getStoreReviews(submittedBooking.store.id, undefined, 1, 1);
  assert(storeReviews.items.length === 1, 'store review list should return latest review on first page');
  assert(storeReviews.items[0].id === 'review-1786630500000', 'store review list should contain submitted review first');
  assert(storeReviews.items[0].storeId === submittedBooking.store.id, 'submitted review should use booking store id');
  assert(storeReviews.items[0].serviceId === submittedBooking.service.id, 'submitted review should use booking service id');
  assert(storeReviews.items[0].userName === '匿名用户', 'anonymous review should hide customer name');
  assert(storeReviews.items[0].rating === 5, 'submitted review should use service rating for list rating');
  assert(storeReviews.items[0].tags.length === 2, 'submitted review should preserve tags');

  const serviceReviews = await mockService.getStoreReviews(submittedBooking.store.id, submittedBooking.service.id, 1, 1);
  assert(serviceReviews.items[0].id === 'review-1786630500000', 'service filtered review list should contain submitted review first');
} finally {
  Date.now = originalDateNow;
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Review flow smoke passed.');
