import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { bookingService } = require(resolve(rootDir, 'miniprogram/services/booking-service.js'));
const { payBookingDeposit } = require(resolve(rootDir, 'miniprogram/utils/payment.js'));

const originalPrepare = bookingService.prepareBookingPayment;
const originalPay = bookingService.payBooking;
const originalWx = global.wx;
const originalDateNow = Date.now;
const errors = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const paymentParameters = {
  timeStamp: '1786630000',
  nonceStr: 'nonce',
  package: 'prepay_id=test',
  signType: 'RSA',
  paySign: 'sign'
};
const paidBooking = { id:'booking-1001', status:'BOOKED' };

const resetService = () => {
  bookingService.prepareBookingPayment = originalPrepare;
  bookingService.payBooking = originalPay;
  global.wx = originalWx;
  Date.now = originalDateNow;
};

try {
  Date.now = () => 1786630000000;

  let preparedRequestId = '';
  let paidRequestId = '';
  let receivedPaymentPayload = null;
  bookingService.prepareBookingPayment = async (_bookingId, requestId) => {
    preparedRequestId = requestId;
    return { bookingId:_bookingId, parameters:paymentParameters };
  };
  bookingService.payBooking = async (_bookingId, requestId) => {
    paidRequestId = requestId;
    return paidBooking;
  };
  global.wx = {
    requestPayment: (payload) => {
      receivedPaymentPayload = payload;
      payload.success();
    }
  };
  await payBookingDeposit('booking-1001');
  assert(receivedPaymentPayload?.timeStamp === paymentParameters.timeStamp, 'real payment should pass timeStamp to wx.requestPayment');
  assert(receivedPaymentPayload?.nonceStr === paymentParameters.nonceStr, 'real payment should pass nonceStr to wx.requestPayment');
  assert(receivedPaymentPayload?.package === paymentParameters.package, 'real payment should pass package to wx.requestPayment');
  assert(receivedPaymentPayload?.signType === paymentParameters.signType, 'real payment should pass signType to wx.requestPayment');
  assert(receivedPaymentPayload?.paySign === paymentParameters.paySign, 'real payment should pass paySign to wx.requestPayment');
  assert(paidRequestId === preparedRequestId, 'successful wx payment should confirm with same request id');

  let payCalledAfterFailure = false;
  bookingService.prepareBookingPayment = async (_bookingId, requestId) => {
    preparedRequestId = requestId;
    return { bookingId:_bookingId, parameters:paymentParameters };
  };
  bookingService.payBooking = async () => {
    payCalledAfterFailure = true;
    return paidBooking;
  };
  global.wx = {
    requestPayment: (payload) => {
      payload.fail(new Error('payment failed'));
    }
  };
  try {
    await payBookingDeposit('booking-1001');
    errors.push('failed wx payment should reject');
  } catch (error) {
    assert(!payCalledAfterFailure, 'failed wx payment should not confirm payBooking');
  }
} finally {
  resetService();
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Payment smoke passed.');
