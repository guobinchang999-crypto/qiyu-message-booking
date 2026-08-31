package com.qiyu.infrastructure.auth;

import com.qiyu.domain.auth.gateway.SmsVerificationGateway;

/** Fails closed until an actual SMS provider and credentials are configured. */
public class UnavailableSmsVerificationGateway implements SmsVerificationGateway {
    private static final String MESSAGE = "短信验证码服务尚未配置";

    @Override
    public SendResult send(String mobile) {
        throw new IllegalStateException(MESSAGE);
    }

    @Override
    public boolean verify(String mobile, String code) {
        throw new IllegalStateException(MESSAGE);
    }
}
