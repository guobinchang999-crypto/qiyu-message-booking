package com.qiyu.infrastructure.payment;

import com.qiyu.domain.payment.gateway.PaymentGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Registers the fail-closed payment adapter only when no provider adapter is available. */
@Configuration(proxyBeanMethods = false)
public class PaymentGatewayConfiguration {

    /** Prevents bookings from being marked paid when payment credentials are not configured. */
    @Bean
    @ConditionalOnMissingBean(PaymentGateway.class)
    PaymentGateway unavailablePaymentGateway() {
        return new UnavailablePaymentGateway();
    }
}
