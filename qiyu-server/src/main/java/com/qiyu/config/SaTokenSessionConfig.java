package com.qiyu.config;

import cn.dev33.satoken.dao.SaTokenDaoRedisJackson;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;

/**
 * Registers the Redis-backed session DAO only for persistence profiles.
 *
 * <p>The {@code sa-token-redis-jackson} auto-configuration is excluded globally because it
 * requires a live Redis connection at startup, which the H2-based mock test profile does not
 * provide. This conditional bean restores Redis sessions for local/dev/prod while the mock
 * profile keeps Sa-Token's default in-memory DAO.</p>
 */
@Configuration(proxyBeanMethods = false)
public class SaTokenSessionConfig {

    @Bean
    @ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
    SaTokenDaoRedisJackson saTokenDaoRedisJackson(RedisConnectionFactory redisConnectionFactory) {
        SaTokenDaoRedisJackson dao = new SaTokenDaoRedisJackson();
        dao.init(redisConnectionFactory);
        return dao;
    }
}
