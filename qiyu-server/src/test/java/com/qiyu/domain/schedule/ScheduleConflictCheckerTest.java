package com.qiyu.domain.schedule;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingFactory;
import com.qiyu.domain.booking.BookingStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Conflict checks must consider occupied buffers, resource sharing rules and terminal states. */
class ScheduleConflictCheckerTest {
    private final ScheduleConflictChecker checker = new ScheduleConflictChecker();

    private Booking booking(String id, String therapistId, String roomId, LocalDate date, LocalTime start,
                            int durationMinutes, BookingStatus status) {
        return BookingFactory.demo(id, "store-jingan", "service-neck", therapistId, roomId,
                "林女士", "13800001234", "customer-1", date, start, durationMinutes, status);
    }

    @Test
    void rejectsOverlappingTherapistBookings() {
        Booking existing = booking("BK-1", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);
        Booking candidate = booking("BK-2", "therapist-anran", "room-jingan-02",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 30), 60, BookingStatus.PENDING_PAYMENT);

        assertThatThrownBy(() -> checker.ensureAvailable(candidate, List.of(existing)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("时段已有预约");
    }

    @Test
    void rejectsOverlappingRoomBookingsEvenWithDifferentTherapists() {
        Booking existing = booking("BK-1", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);
        Booking candidate = booking("BK-2", "therapist-yuanyuan", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 30), 60, BookingStatus.BOOKED);

        assertThatThrownBy(() -> checker.ensureAvailable(candidate, List.of(existing)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void preparationAndCleanupBuffersCountAsOccupied() {
        // Service ends at 11:00 with 10-minute cleanup; a booking starting service at 11:05
        // still collides with the cleanup buffer even though service times do not overlap.
        Booking existing = booking("BK-1", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);
        Booking candidate = booking("BK-2", "therapist-anran", "room-jingan-02",
                LocalDate.of(2026, 9, 1), LocalTime.of(11, 5), 60, BookingStatus.BOOKED);

        assertThatThrownBy(() -> checker.ensureAvailable(candidate, List.of(existing)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void allowsBookingsAfterTheCleanupBuffer() {
        // Existing occupied window ends at 11:10; the candidate's preparation buffer starts at 11:10.
        Booking existing = booking("BK-1", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);
        Booking candidate = booking("BK-2", "therapist-anran", "room-jingan-02",
                LocalDate.of(2026, 9, 1), LocalTime.of(11, 20), 60, BookingStatus.BOOKED);

        assertThatCode(() -> checker.ensureAvailable(candidate, List.of(existing))).doesNotThrowAnyException();
    }

    @Test
    void ignoresCancelledAndCompletedBookings() {
        Booking cancelled = booking("BK-1", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.CANCELLED);
        Booking completed = booking("BK-2", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.COMPLETED);
        Booking candidate = booking("BK-3", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);

        assertThatCode(() -> checker.ensureAvailable(candidate, List.of(cancelled, completed)))
                .doesNotThrowAnyException();
    }

    @Test
    void ignoresOtherStores() {
        Booking existing = BookingFactory.demo("BK-1", "store-xujiahui", "service-neck", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", "customer-1", LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);
        Booking candidate = booking("BK-2", "therapist-anran", "room-jingan-01",
                LocalDate.of(2026, 9, 1), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);

        assertThatCode(() -> checker.ensureAvailable(candidate, List.of(existing))).doesNotThrowAnyException();
    }
}
