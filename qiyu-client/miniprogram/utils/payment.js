"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payBookingDeposit = void 0;
const booking_service_1 = require("../services/booking-service");
const payBookingDeposit = async (bookingId) => {
    const requestId = `pay-${Date.now()}`;
    const payment = await booking_service_1.bookingService.prepareBookingPayment(bookingId, requestId);
    await new Promise((resolve, reject) => {
        wx.requestPayment({
            timeStamp: payment.parameters.timeStamp,
            nonceStr: payment.parameters.nonceStr,
            package: payment.parameters.package,
            signType: payment.parameters.signType,
            paySign: payment.parameters.paySign,
            success: () => resolve(),
            fail: reject
        });
    });
    return booking_service_1.bookingService.payBooking(bookingId, requestId);
};
exports.payBookingDeposit = payBookingDeposit;
