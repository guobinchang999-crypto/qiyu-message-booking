package com.qiyu.application.auth;

/** Typed response returned when a mock or real verification code is requested. */
public record SendCodeResponse(String mobile, String requestId, int expiresIn,
                               String verificationCode, boolean mock) {}
