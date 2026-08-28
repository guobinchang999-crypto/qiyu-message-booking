package com.qiyu.infrastructure.mock;

import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockCustomerLookupGateway implements CustomerLookupGateway {
    @Override
    public Optional<String> findIdByMobile(String mobile) { return Optional.of("customer-mock"); }
}
