package com.qiyu.infrastructure.payment;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.payment.gateway.PaymentGateway;

/** Fails closed until a verified payment-provider adapter and merchant credentials are configured. */
public class UnavailablePaymentGateway implements PaymentGateway {
    private static final String MESSAGE = "微信支付服务尚未配置，不能确认订金支付";

    @Override
    public PaymentPreparation prepareDeposit(Booking booking, String requestId) {
        throw new IllegalStateException(MESSAGE);
    }

    @Override
    public void verifyDepositConfirmation(Booking booking, String requestId) {
        throw new IllegalStateException(MESSAGE);
    }
}
