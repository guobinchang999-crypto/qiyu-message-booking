package com.qiyu.infrastructure.mock;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.gateway.BookingGateway;
import org.springframework.stereotype.Repository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class InMemoryBookingGateway implements BookingGateway {
    private final Map<String, Booking> bookings = new LinkedHashMap<>();

    @Override
    public synchronized Collection<Booking> findAll() {
        return bookings.values().stream().toList();
    }

    @Override
    public synchronized Optional<Booking> findById(String id) {
        return Optional.ofNullable(bookings.get(id));
    }

    @Override
    public synchronized Booking save(Booking booking) {
        bookings.put(booking.id(), booking);
        return booking;
    }
}
