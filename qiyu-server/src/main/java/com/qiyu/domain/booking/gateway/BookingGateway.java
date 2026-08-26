package com.qiyu.domain.booking.gateway;

import com.qiyu.domain.booking.Booking;

import java.util.Collection;
import java.util.Optional;

public interface BookingGateway {
    Collection<Booking> findAll();
    Optional<Booking> findById(String id);
    Booking save(Booking booking);
}
