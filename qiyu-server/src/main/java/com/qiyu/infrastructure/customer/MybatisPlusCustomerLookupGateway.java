package com.qiyu.infrastructure.customer;

import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import com.qiyu.infrastructure.persistence.mapper.BookingMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import com.qiyu.infrastructure.persistence.mapper.ReceptionMapper;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;

/** MyBatis-Plus-backed customer lookup used by staff-created bookings. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusCustomerLookupGateway implements CustomerLookupGateway {
    private final BookingMapper mapper;
    private final ReceptionMapper reception;

    public MybatisPlusCustomerLookupGateway(BookingMapper mapper, ReceptionMapper reception) { this.mapper = mapper; this.reception = reception; }

    @Override
    public Optional<String> findIdByMobile(String mobile) {
        return Optional.ofNullable(mapper.customerIdByMobile(mobile)).map(String::valueOf);
    }
    @Override public Optional<Customer> findByMobile(String mobile) { return Optional.ofNullable(reception.customer(mobile)); }
    @Override @Transactional public Customer create(String mobile, String name) {
        Customer existing = reception.customer(mobile);
        if (existing != null) return existing;
        var user = new HashMap<String,Object>(); user.put("name", name);
        reception.insertUser(user);
        reception.insertCustomer(((Number)user.get("id")).longValue(), mobile, name);
        return reception.customer(mobile);
    }
}
