package com.qiyu.infrastructure.auth;

import com.qiyu.domain.auth.gateway.SmsVerificationGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Supplies the fail-closed SMS adapter when no provider integration exists. */
@Configuration(proxyBeanMethods = false)
public class SmsVerificationConfiguration {
    @Bean
    @ConditionalOnMissingBean(SmsVerificationGateway.class)
    SmsVerificationGateway unavailableSmsVerificationGateway() {
        return new UnavailableSmsVerificationGateway();
    }
}
