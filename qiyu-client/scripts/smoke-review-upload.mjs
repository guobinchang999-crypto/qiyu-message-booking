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
Date.now = () => 1786632500000;

try {
  const successUpload = await mockService.uploadReviewImage('/tmp/qiyu-review-success.jpg', 'review-image-success');
  assert(successUpload.imageUrl === '/tmp/qiyu-review-success.jpg', 'successful upload should return image url');

  try {
    await mockService.uploadReviewImage('/tmp/fail-upload-review.jpg', 'review-image-failure');
    errors.push('failed upload should reject');
  } catch (error) {
    assert(error instanceof Error, 'failed upload should reject with an Error');
  }

  await mockService.submitReview({
    bookingId: 'booking-1000',
    therapistRating: 5,
    environmentRating: 5,
    serviceRating: 4,
    tags: ['上传成功'],
    content: '这是一条带图片的 smoke 评价，用于验证成功上传的图片地址参与提交。',
    anonymous: false,
    imageUrls: [successUpload.imageUrl]
  }, 'review-upload-smoke-1786632500000');

  const reviews = await mockService.getStoreReviews('xujiahui', 'chinese', 1, 1);
  assert(reviews.items[0].id === 'review-1786632500000', 'review with uploaded image should backfill to service review list');
  assert(reviews.items[0].userName === '林知夏', 'non-anonymous review should display customer name');
  assert(reviews.items[0].rating === 4, 'review list rating should use submitted service rating');
  assert(reviews.items[0].content.includes('带图片'), 'review content should be persisted with uploaded image submit');
} finally {
  Date.now = originalDateNow;
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Review upload smoke passed.');
