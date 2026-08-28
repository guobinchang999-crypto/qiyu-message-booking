package com.qiyu.domain.customer.gateway;

import java.util.Optional;

/** Resolves an existing customer without exposing persistence details to application use cases. */
public interface CustomerLookupGateway {
    Optional<String> findIdByMobile(String mobile);
}
