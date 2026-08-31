import { bookingService } from '../services/booking-service';
import { Booking } from '../types/domain';

export const payBookingDeposit = async (bookingId: string): Promise<Booking> => {
  const requestId = `pay-${Date.now()}`;
  const payment = await bookingService.prepareBookingPayment(bookingId, requestId);
  await new Promise<void>((resolve, reject) => {
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
  return bookingService.payBooking(bookingId, requestId);
};
