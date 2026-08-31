package com.qiyu.domain.payment.gateway;

import com.qiyu.domain.booking.Booking;

/** Outbound payment port; only a verified provider callback may confirm a deposit. */
public interface PaymentGateway {
    PaymentPreparation prepareDeposit(Booking booking, String requestId);

    void verifyDepositConfirmation(Booking booking, String requestId);

    record PaymentPreparation(String paymentNo, Number amount, PaymentParameters parameters) {}
    record PaymentParameters(String timeStamp, String nonceStr, String packageValue, String signType, String paySign) {}
}
