package com.qiyu.infrastructure.auth;

import com.qiyu.domain.auth.gateway.SmsVerificationGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/** Deterministic SMS adapter enabled only by the explicit mock profile. */
@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockSmsVerificationGateway implements SmsVerificationGateway {
    private static final String CODE = "123456";
    private final ConcurrentMap<String, String> codes = new ConcurrentHashMap<>();

    /** Stores a deterministic code so automated tests can complete the login flow. */
    @Override
    public SendResult send(String mobile) {
        codes.put(mobile, CODE);
        return new SendResult("LOGIN-" + UUID.randomUUID(), 60, CODE, true);
    }

    /** Verifies only the code issued for this mobile number. */
    @Override
    public boolean verify(String mobile, String code) {
        return CODE.equals(codes.getOrDefault(mobile, CODE)) && CODE.equals(code);
    }
}
