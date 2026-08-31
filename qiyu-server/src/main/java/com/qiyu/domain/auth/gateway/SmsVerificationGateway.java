package com.qiyu.domain.auth.gateway;

/** Outbound port for sending and verifying one-time mobile login codes. */
public interface SmsVerificationGateway {
    SendResult send(String mobile);

    boolean verify(String mobile, String code);

    record SendResult(String requestId, int expiresIn, String debugCode, boolean mock) {
    }
}
