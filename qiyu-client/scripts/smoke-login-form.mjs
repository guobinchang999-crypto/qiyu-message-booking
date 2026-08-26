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

const loginCopy = await mockService.getLoginCopy();
assert(loginCopy.brandName.includes('栖愈'), 'login copy should expose qiyu brand name');
assert(/^\d{6}$/.test(loginCopy.demoCode), 'login copy should expose a 6 digit demo code');
assert(loginCopy.phoneInvalidMessage.length > 0, 'login copy should include phone validation message');
assert(loginCopy.codeInvalidMessage.length > 0, 'login copy should include code validation message');
assert(loginCopy.agreementRequiredToastText.length > 0, 'login copy should include agreement required message');

const tsSource = readFileSync(resolve(rootDir, 'miniprogram/pages/login/index.ts'), 'utf8');
assert(/const SMS_COUNTDOWN_SECONDS = 60;/.test(tsSource), 'login page should use 60 second SMS countdown');
assert(/if \(this\.data\.submitting \|\| this\.data\.sendingCode \|\| this\.data\.countdown > 0\) return;/.test(tsSource), 'send code should be locked while submitting/sending/countdown');
assert(/if \(!this\.validatePhone\(\)\) return;/.test(tsSource), 'send code should validate phone before sending');
assert(/result\.expiresIn \|\| SMS_COUNTDOWN_SECONDS/.test(tsSource), 'send code should use backend expiry when available');
assert(/result\.verificationCode \|\| this\.data\.copy\.demoCode/.test(tsSource), 'send code should fill mock code from service response');
assert(tsSource.includes('bookingService.sendLoginCode(this.data.phone)'), 'send code should use the service boundary');
assert(tsSource.includes('/^1\\d{10}$/.test(this.data.phone)'), 'login page should validate mainland mobile format');
assert(tsSource.includes('/^\\d{6}$/.test(this.data.code)'), 'login page should validate 6 digit code');
assert(/if \(!this\.data\.agreed\)[\s\S]*?agreementRequiredToastText/.test(tsSource), 'login should require agreement before submit');
assert(/this\.setData\(\{ submitting: true \}\)/.test(tsSource), 'login should set submitting lock before navigation');
assert(tsSource.includes('bookingService.login(this.data.phone, this.data.code)'), 'login should use the service boundary');
assert(tsSource.includes('AUTH_TOKEN_STORAGE_KEY'), 'login should persist the returned auth token through a centralized key');
assert(/wx\.reLaunch\(\{ url: pageRoutes\.home \}\)/.test(tsSource), 'login should relaunch to home page after success');

const wxmlSource = readFileSync(resolve(rootDir, 'miniprogram/pages/login/index.wxml'), 'utf8');
assert(/maxlength="11"/.test(wxmlSource), 'phone input should limit to 11 digits');
assert(/maxlength="6"/.test(wxmlSource), 'code input should limit to 6 digits');
assert(/disabled="\{\{submitting\}\}"/.test(wxmlSource), 'login inputs should be disabled while submitting');
assert(/loading="\{\{sendingCode\}\}"/.test(wxmlSource), 'send code button should show sending loading');
assert(/disabled="\{\{submitting \|\| sendingCode \|\| countdown > 0\}\}"/.test(wxmlSource), 'send code button should be disabled during countdown');
assert(/loading="\{\{submitting\}\}"/.test(wxmlSource), 'login button should show submitting loading');
assert(/bindtap="onAgreementChange"/.test(wxmlSource), 'agreement row should toggle agreement state');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Login form smoke passed.');
