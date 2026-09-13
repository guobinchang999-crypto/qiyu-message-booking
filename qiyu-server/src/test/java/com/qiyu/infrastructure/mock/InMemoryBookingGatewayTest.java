package com.qiyu.infrastructure.mock;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingFactory;
import com.qiyu.domain.booking.BookingStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

/** Verifies the in-memory gateway honors idempotency lookups and payment-window queries. */
class InMemoryBookingGatewayTest {

    private Booking booking(String id, String requestId, BookingStatus status) {
        return BookingFactory.restore(id, "store-jingan", "service-neck", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", "customer-1", LocalDate.of(2026, 9, 1), LocalTime.of(10, 0),
                60, status, null, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO, 0L, requestId);
    }

    @Test
    void findsSavedBookingByRequestId() {
        InMemoryBookingGateway gateway = new InMemoryBookingGateway();
        Booking saved = booking("BK-T-1", "request-1", BookingStatus.PENDING_PAYMENT);
        gateway.save(saved);

        assertThat(gateway.findByRequestId("request-1")).contains(saved);
        assertThat(gateway.findByRequestId("missing")).isEmpty();
        assertThat(gateway.findByRequestId(null)).isEmpty();
    }

    @Test
    void returnsOnlyExpiredPendingPaymentBookings() {
        InMemoryBookingGateway gateway = new InMemoryBookingGateway();
        gateway.save(booking("BK-T-1", "request-1", BookingStatus.PENDING_PAYMENT));
        gateway.save(booking("BK-T-2", "request-2", BookingStatus.BOOKED));

        assertThat(gateway.findPendingPaymentBefore(LocalDateTime.now().plusMinutes(1)))
                .extracting(Booking::id)
                .containsExactly("BK-T-1");
        assertThat(gateway.findPendingPaymentBefore(LocalDateTime.now().minusMinutes(30))).isEmpty();
    }
}
