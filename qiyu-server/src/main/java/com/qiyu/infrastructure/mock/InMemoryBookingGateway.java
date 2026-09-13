package com.qiyu.infrastructure.mock;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.booking.gateway.BookingGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class InMemoryBookingGateway implements BookingGateway {
    private final Map<String, Booking> bookings = new LinkedHashMap<>();
    private final Map<String, Booking> byRequestId = new LinkedHashMap<>();
    private final Map<String, LocalDateTime> createdAt = new LinkedHashMap<>();

    @Override
    public synchronized Collection<Booking> findAll() {
        return bookings.values().stream().toList();
    }

    @Override
    public synchronized Optional<Booking> findById(String id) {
        return Optional.ofNullable(bookings.get(id));
    }

    @Override
    public synchronized Optional<Booking> findByRequestId(String requestId) {
        if (requestId == null || requestId.isBlank()) return Optional.empty();
        return Optional.ofNullable(byRequestId.get(requestId));
    }

    @Override
    public synchronized Collection<Booking> findPendingPaymentBefore(LocalDateTime cutoff) {
        return bookings.values().stream()
                .filter(booking -> booking.status() == BookingStatus.PENDING_PAYMENT)
                .filter(booking -> createdAt.getOrDefault(booking.id(), LocalDateTime.MIN).isBefore(cutoff))
                .toList();
    }

    @Override
    public synchronized Booking save(Booking booking) {
        if (!bookings.containsKey(booking.id())) {
            createdAt.put(booking.id(), LocalDateTime.now());
            if (booking.requestId() != null && !booking.requestId().isBlank()) {
                byRequestId.put(booking.requestId(), booking);
            }
        }
        bookings.put(booking.id(), booking);
        return booking;
    }
}
