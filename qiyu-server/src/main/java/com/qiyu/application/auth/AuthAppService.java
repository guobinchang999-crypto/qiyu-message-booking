package com.qiyu.application.auth;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/** Mock authentication boundary until WeChat login and SMS providers are configured. */
@Service
public class AuthAppService {
    private static final String MOCK_CODE = "123456";
    private final ConcurrentMap<String, String> verificationCodes = new ConcurrentHashMap<>();

    public Map<String, Object> sendCode(String mobile) {
        String requestId = "LOGIN-" + UUID.randomUUID();
        verificationCodes.put(mobile, MOCK_CODE);
        return Map.of(
                "mobile", mobile,
                "requestId", requestId,
                "expiresIn", 60,
                "verificationCode", MOCK_CODE,
                "mock", true
        );
    }

    public Map<String, Object> login(String mobile, String code) {
        String expectedCode = verificationCodes.getOrDefault(mobile, MOCK_CODE);
        if (!expectedCode.equals(code)) {
            throw new IllegalArgumentException("验证码不正确");
        }
        return Map.of(
                "token", "mock-token-" + UUID.randomUUID(),
                "expiresIn", 7200,
                "user", Map.of(
                        "mobile", mobile,
                        "name", "林知夏",
                        "avatarText", "林"
                ),
                "mock", true
        );
    }
}
