package com.qiyu.infrastructure.customer;

import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import com.qiyu.infrastructure.persistence.mapper.BookingMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** MyBatis-Plus-backed customer lookup used by staff-created bookings. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusCustomerLookupGateway implements CustomerLookupGateway {
    private final BookingMapper mapper;

    public MybatisPlusCustomerLookupGateway(BookingMapper mapper) { this.mapper = mapper; }

    @Override
    public Optional<String> findIdByMobile(String mobile) {
        return Optional.ofNullable(mapper.customerIdByMobile(mobile)).map(String::valueOf);
    }
}
