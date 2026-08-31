package com.qiyu.domain.booking;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The aggregate is the single authority for lifecycle transitions; every illegal step must fail. */
class BookingTest {

    private Booking booking(BookingStatus status) {
        return BookingFactory.demo("BK-1", "store-jingan", "service-neck", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", "customer-1", LocalDate.of(2026, 9, 1), LocalTime.of(10, 0),
                60, status);
    }

    @Test
    void pendingPaymentBecomesBookedAfterDeposit() {
        Booking booking = booking(BookingStatus.PENDING_PAYMENT);
        booking.payDeposit();
        assertThat(booking.status()).isEqualTo(BookingStatus.BOOKED);
    }

    @Test
    void bookedBecomesCheckedInAndThenInService() {
        Booking booking = booking(BookingStatus.BOOKED);
        booking.checkIn();
        assertThat(booking.status()).isEqualTo(BookingStatus.CHECKED_IN);
        booking.startService();
        assertThat(booking.status()).isEqualTo(BookingStatus.IN_SERVICE);
    }

    @Test
    void serviceFlowsThroughSettlementToCompleted() {
        Booking booking = booking(BookingStatus.IN_SERVICE);
        booking.finishService();
        assertThat(booking.status()).isEqualTo(BookingStatus.PENDING_SETTLEMENT);
        booking.completeSettlement();
        assertThat(booking.status()).isEqualTo(BookingStatus.COMPLETED);
    }

    @Test
    void rejectsIllegalTransitions() {
        assertThatThrownBy(() -> booking(BookingStatus.PENDING_PAYMENT).checkIn())
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> booking(BookingStatus.COMPLETED).cancel())
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> booking(BookingStatus.BOOKED).payDeposit())
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> booking(BookingStatus.BOOKED).startService())
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> booking(BookingStatus.CHECKED_IN).finishService())
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> booking(BookingStatus.IN_SERVICE).completeSettlement())
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void onlyCancellableStatesCancel() {
        assertThat(booking(BookingStatus.PENDING_PAYMENT).status()).isEqualTo(BookingStatus.PENDING_PAYMENT);
        Booking booked = booking(BookingStatus.BOOKED);
        booked.cancel();
        assertThat(booked.status()).isEqualTo(BookingStatus.CANCELLED);
        assertThatThrownBy(() -> booking(BookingStatus.IN_SERVICE).cancel())
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rescheduleOnlyAllowedForBooked() {
        Booking booking = booking(BookingStatus.BOOKED);
        booking.reschedule(LocalDate.of(2026, 9, 2), LocalTime.of(15, 0), 60);
        assertThat(booking.timeRange().serviceFrom()).isEqualTo(LocalDate.of(2026, 9, 2).atTime(15, 0));
        assertThatThrownBy(() -> booking(BookingStatus.CHECKED_IN).reschedule(
                LocalDate.of(2026, 9, 2), LocalTime.of(15, 0), 60))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void cancelledAndCompletedDoNotOccupyResources() {
        assertThat(booking(BookingStatus.BOOKED).occupiesResource()).isTrue();
        assertThat(booking(BookingStatus.PENDING_PAYMENT).occupiesResource()).isTrue();
        assertThat(booking(BookingStatus.CANCELLED).occupiesResource()).isFalse();
        assertThat(booking(BookingStatus.COMPLETED).occupiesResource()).isFalse();
    }

    @Test
    void candidateNeverMutatesTheOriginalBooking() {
        Booking booking = booking(BookingStatus.BOOKED);
        Booking candidate = booking.candidate("therapist-yuanyuan", "room-jingan-02",
                LocalDate.of(2026, 9, 3), LocalTime.of(18, 0), 60);

        assertThat(candidate.therapistId()).isEqualTo("therapist-yuanyuan");
        assertThat(booking.therapistId()).isEqualTo("therapist-anran");
        assertThat(booking.roomId()).isEqualTo("room-jingan-01");
        assertThat(booking.timeRange().serviceFrom()).isEqualTo(LocalDate.of(2026, 9, 1).atTime(10, 0));
        assertThat(candidate.version()).isEqualTo(booking.version());
        assertThat(candidate.requestId()).isEqualTo(booking.requestId());
    }

    @Test
    void refreshVerificationCodeOnlyForActiveStates() {
        Booking booking = booking(BookingStatus.BOOKED);
        String before = booking.verificationCode();
        booking.refreshVerificationCode();
        assertThat(booking.verificationCode()).isNotEqualTo(before);
        assertThatThrownBy(() -> booking(BookingStatus.CANCELLED).refreshVerificationCode())
                .isInstanceOf(IllegalArgumentException.class);
    }
}
