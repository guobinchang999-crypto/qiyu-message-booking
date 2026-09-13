package com.qiyu.domain.customer.gateway;

import java.util.Optional;

/** Resolves an existing customer without exposing persistence details to application use cases. */
public interface CustomerLookupGateway {
    Optional<String> findIdByMobile(String mobile);
    default Optional<Customer> findByMobile(String mobile) {
        return findIdByMobile(mobile).map(id -> new Customer(id, "", mobile));
    }
    default Customer create(String mobile, String name) { throw new UnsupportedOperationException("暂不支持客户建档"); }
    record Customer(String id, String name, String mobile) {}
}
