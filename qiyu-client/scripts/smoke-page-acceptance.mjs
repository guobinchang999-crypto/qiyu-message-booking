import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(new URL('..', import.meta.url).pathname);
const miniprogramDir = join(rootDir, 'miniprogram');
const app = JSON.parse(readFileSync(join(miniprogramDir, 'app.json'), 'utf8'));
const source = (page) => readFileSync(join(miniprogramDir, `${page}.ts`), 'utf8');
const template = (page) => readFileSync(join(miniprogramDir, `${page}.wxml`), 'utf8');
const errors = [];

const expectedPages = [
  'pages/login/index',
  'pages/home/index',
  'pages/stores/index',
  'pages/store-detail/index',
  'pages/services/index',
  'pages/service-detail/index',
  'pages/therapist/index',
  'pages/time/index',
  'pages/confirm/index',
  'pages/success/index',
  'pages/orders/index',
  'pages/booking-detail/index',
  'pages/checkin/index',
  'pages/review/index',
  'pages/profile/index'
];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const includes = (page, fragments, label = page) => {
  const pageSource = source(page);
  for (const fragment of fragments) assert(pageSource.includes(fragment), `${label}: missing ${fragment}`);
};

assert(app.pages.length === expectedPages.length, `app.json: expected ${expectedPages.length} pages, got ${app.pages.length}`);
for (const page of expectedPages) {
  assert(app.pages.includes(page), `app.json: missing ${page}`);
  const pageTemplate = template(page);
  assert(pageTemplate.length > 0, `${page}: empty WXML template`);
}

assert(app.tabBar?.list?.length === 4, 'app.json: expected four custom TabBar entries');
assert(app.tabBar?.list?.map((item) => item.pagePath).join('|') === [
  'pages/home/index',
  'pages/services/index',
  'pages/orders/index',
  'pages/profile/index'
].join('|'), 'app.json: TabBar order must be home, booking, orders, profile');

includes('pages/home/index', ['frequentStores', 'nearbyStores', 'bookingService.getHome']);
includes('pages/stores/index', ['wx.getLocation', 'wx.chooseLocation', 'bookingStore.selectStore']);
includes('pages/store-detail/index', ['bookingStore.selectService']);
assert(template('pages/store-detail/index').includes('<swiper'), 'pages/store-detail/index: missing gallery swiper');
includes('pages/services/index', ['bookingService.getServices', 'onSearch']);
includes('pages/service-detail/index', ['onShareAppMessage', 'bookingStore.selectService']);
includes('pages/therapist/index', ['therapistMode', 'available']);
includes('pages/time/index', ["slot.status === 'full'", 'chooseSlot']);
includes('pages/confirm/index', ['bookingService.getBookingConfirmation', 'createBooking', 'rescheduleBooking']);
includes('pages/success/index', ['bookingService.getBookingSuccess', 'pageUrls.bookingDetail']);
includes('pages/orders/index', ['handleAction', 'payBookingDeposit', 'bookingService.cancelBooking']);
includes('pages/booking-detail/index', ['bookingService.refreshBookingCode', 'bookingService.cancelBooking']);
includes('pages/checkin/index', ['bookingService.checkinBooking', 'bookingService.refreshBookingCode']);
includes('pages/review/index', ['bookingService.uploadReviewImage', 'bookingService.submitReview']);
includes('pages/profile/index', ['bookingService.getProfile', 'wx.showModal', 'pageRoutes.orders']);

for (const page of expectedPages) {
  const pageTemplate = template(page);
  if (page !== 'pages/login/index' && page !== 'pages/checkin/index' && page !== 'pages/success/index') {
    assert(pageTemplate.includes('qy-page'), `${page}: expected qy-page layout root`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Accepted ${expectedPages.length} client pages, four TabBar routes, booking flow entry points, location actions, fulfillment actions, review upload, and profile actions.`);
