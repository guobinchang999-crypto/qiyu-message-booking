package com.qiyu.adapter.booking;

/** Identifies the prepared payment that must be verified with the provider. */
public record BookingPaymentConfirmRequest(String requestId) {
}
