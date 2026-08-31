package com.qiyu.domain.booking.gateway;

import com.qiyu.domain.booking.Booking;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface BookingGateway {
    Collection<Booking> findAll();
    Optional<Booking> findById(String id);
    Optional<Booking> findByRequestId(String requestId);
    Collection<Booking> findPendingPaymentBefore(LocalDateTime cutoff);
    Booking save(Booking booking);
}
