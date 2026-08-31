package com.qiyu.infrastructure.auth;

import com.qiyu.domain.auth.gateway.SmsVerificationGateway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;

/**
 * Local-only SMS substitute backed by the configured Redis instance.
 *
 * <p>The code is random, expires after five minutes and is removed after a successful check.
 * Production never loads this adapter and therefore still requires a real SMS provider.</p>
 */
@Component
@Profile("local")
@ConditionalOnProperty(name = "qiyu.auth.local-sms-enabled", havingValue = "true")
public class LocalRedisSmsVerificationGateway implements SmsVerificationGateway {
    private static final String KEY_PREFIX = "qiyu:auth:sms:";
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final boolean debugCodeEnabled;

    public LocalRedisSmsVerificationGateway(
            StringRedisTemplate redisTemplate,
            @Value("${qiyu.auth.local-sms-debug-code-enabled:false}") boolean debugCodeEnabled
    ) {
        this.redisTemplate = redisTemplate;
        this.debugCodeEnabled = debugCodeEnabled;
    }

    /** Generates and stores a one-time code instead of contacting an external SMS supplier. */
    @Override
    public SendResult send(String mobile) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        redisTemplate.opsForValue().set(key(mobile), code, CODE_TTL);
        return new SendResult(
                "LOCAL-SMS-" + UUID.randomUUID(),
                Math.toIntExact(CODE_TTL.toSeconds()),
                debugCodeEnabled ? code : null,
                false
        );
    }

    /** Compares the issued code and consumes it atomically enough for the single Redis key flow. */
    @Override
    public boolean verify(String mobile, String code) {
        String key = key(mobile);
        String expected = redisTemplate.opsForValue().get(key);
        if (expected == null || !expected.equals(code)) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }

    private static String key(String mobile) {
        return KEY_PREFIX + mobile;
    }
}
