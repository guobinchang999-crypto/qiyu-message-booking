package com.qiyu.infrastructure.mock;

import com.qiyu.domain.booking.BookingFactory;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.booking.gateway.BookingGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;

/** Seeds demo bookings when the application runs without persistence, keeping mock data out of application code. */
@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockBookingSeeder {
    private final BookingGateway bookingGateway;

    public MockBookingSeeder(BookingGateway bookingGateway) {
        this.bookingGateway = bookingGateway;
        seed();
    }

    private void seed() {
        // customer-demo matches the mock-mode customer principal; these bookings must stay visible
        // to the logged-in demo customer for acceptance flows and contract tests.
        bookingGateway.save(BookingFactory.demo("BK-202608-1000", "store-jingan", "service-neck", "therapist-anran", "room-jingan-02",
                "林女士", "13800001234", "customer-demo", LocalDate.of(2026, 8, 8), LocalTime.of(10, 0), 60, BookingStatus.BOOKED));
        bookingGateway.save(BookingFactory.demo("BK-202608-1001", "store-jingan", "service-spa", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", "customer-demo", LocalDate.of(2026, 8, 9), LocalTime.of(19, 0), 90, BookingStatus.PENDING_PAYMENT));
        bookingGateway.save(BookingFactory.demo("BK-202608-1002", "store-jingan", "service-neck", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", "customer-demo", LocalDate.of(2026, 8, 11), LocalTime.of(10, 0), 60, BookingStatus.BOOKED));
        bookingGateway.save(BookingFactory.demo("BK-202608-1999", "store-xujiahui", "service-tui-na", "therapist-yuanyuan", "room-xujiahui-01",
                "周女士", "13900005678", "customer-other", LocalDate.of(2026, 8, 12), LocalTime.of(15, 0), 90, BookingStatus.BOOKED));
    }
}
