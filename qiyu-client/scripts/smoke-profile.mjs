import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { mockService } = require(resolve(rootDir, 'miniprogram/services/mock-service.js'));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const profile = await mockService.getProfile();
const bookings = await mockService.getBookings();

assert(profile.memberTitle.includes('全门店通用'), 'profile member title should state all-store benefits');
assert(profile.memberStats.some((item) => item.includes('余额')), 'profile member stats should include balance');
assert(profile.memberStats.some((item) => item.includes('套餐')), 'profile member stats should include package rights');
assert(profile.memberStats.some((item) => item.includes('优惠券')), 'profile member stats should include coupons');
assert(profile.shortcuts.some((item) => item.key === 'orders'), 'profile shortcuts should include orders entry');
assert(profile.menuItems.some((item) => item.key === 'orders'), 'profile menu should include orders entry');
assert(profile.recentBookingTitle.length > 0, 'profile should include recent booking title');
assert(profile.recentBookingActionText.length > 0, 'profile should include recent booking action text');
assert(profile.logoutModalContent.includes('预约记录不会被删除'), 'logout modal should preserve booking records wording');
assert(bookings.length > 0, 'profile recent booking should have order data to display');

const tsSource = readFileSync(resolve(rootDir, 'miniprogram/pages/profile/index.ts'), 'utf8');
assert(/bookingService\.getProfile\(\)/.test(tsSource), 'profile page should load profile through bookingService');
assert(/bookingService\.getBookings\(\)/.test(tsSource), 'profile page should load bookings for recent booking');
assert(/recentBooking:bookings\[0\] \|\| null/.test(tsSource), 'profile page should use latest booking as recent booking');
assert(/wx\.switchTab\(\{ url:pageRoutes\.orders \}\)/.test(tsSource), 'profile orders entry should switch to orders tab');
assert(/wx\.navigateTo\(\{ url:pageUrls\.bookingDetail\(this\.data\.recentBooking\.id\) \}\)/.test(tsSource), 'recent booking should navigate to booking detail');
assert(/wx\.showModal\(\{[\s\S]*?logoutModalTitle[\s\S]*?logoutModalContent[\s\S]*?if \(result\.confirm\)[\s\S]*?wx\.removeStorageSync\(AUTH_TOKEN_STORAGE_KEY\)[\s\S]*?wx\.reLaunch\(\{ url:pageRoutes\.login \}\)/.test(tsSource), 'logout should clear auth token after confirmation before relaunching login');

const wxmlSource = readFileSync(resolve(rootDir, 'miniprogram/pages/profile/index.wxml'), 'utf8');
assert(/profile\.memberTitle/.test(wxmlSource), 'profile WXML should render member title from profile payload');
assert(/profile\.memberStats/.test(wxmlSource), 'profile WXML should render member stats from profile payload');
assert(/profile\.shortcuts/.test(wxmlSource), 'profile WXML should render shortcuts from profile payload');
assert(/recentBooking/.test(wxmlSource) && /goRecentBooking/.test(wxmlSource), 'profile WXML should expose recent booking detail entry');
assert(/profile\.logoutText/.test(wxmlSource) && /bindtap="logout"/.test(wxmlSource), 'profile WXML should render logout action from profile payload');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Profile smoke passed.');
