package com.qiyu.infrastructure.mock;

import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockCustomerLookupGateway implements CustomerLookupGateway {
    private final java.util.Map<String,Customer> customers = new java.util.concurrent.ConcurrentHashMap<>(java.util.Map.of(
        "13800001288", new Customer("customer-mock", "林女士", "13800001288")));
    @Override
    public Optional<String> findIdByMobile(String mobile) { return findByMobile(mobile).map(Customer::id); }
    @Override public Optional<Customer> findByMobile(String mobile) { return Optional.ofNullable(customers.get(mobile)); }
    @Override public Customer create(String mobile, String name) {
        return customers.computeIfAbsent(mobile, key -> new Customer("customer-" + java.util.UUID.randomUUID(), name, mobile));
    }
}
