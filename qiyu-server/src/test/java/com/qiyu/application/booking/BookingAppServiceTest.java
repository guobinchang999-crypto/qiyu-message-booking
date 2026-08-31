package com.qiyu.application.booking;

import com.qiyu.application.auth.AuditLogService;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingFactory;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.coupon.gateway.CouponGateway;
import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import com.qiyu.domain.payment.gateway.PaymentGateway;
import com.qiyu.infrastructure.mock.InMemoryBookingGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/** Verifies the orchestration of the expired-payment release job against a live in-memory gateway. */
class BookingAppServiceTest {
    private InMemoryBookingGateway bookingGateway;
    private AuditLogService auditLogService;
    private BookingAppService service;

    @BeforeEach
    void setUp() {
        bookingGateway = new InMemoryBookingGateway();
        auditLogService = mock(AuditLogService.class);
        AuthAppService authAppService = mock(AuthAppService.class);
        DataPermissionService dataPermissionService = mock(DataPermissionService.class);
        CatalogGateway catalogGateway = mock(CatalogGateway.class);
        CouponGateway couponGateway = mock(CouponGateway.class);
        BookingAssembler assembler = new BookingAssembler(catalogGateway, dataPermissionService);
        BookingPricingCalculator pricingCalculator = new BookingPricingCalculator(couponGateway);
        BookingAuthorizer authorizer = new BookingAuthorizer(bookingGateway, dataPermissionService,
                authAppService, auditLogService);
        // persistenceEnabled=true skips demo seeding; a negative timeout makes just-created
        // bookings count as expired so the test does not wait.
        service = new BookingAppService(bookingGateway, catalogGateway, authAppService, auditLogService,
                true, mock(CustomerLookupGateway.class), mock(PaymentGateway.class), authorizer, assembler,
                pricingCalculator, -1);
    }

    @Test
    void cancelsExpiredPendingPaymentBookingsAndAuditsTheTransition() {
        Booking pending = BookingFactory.demo("BK-T-1", "store-jingan", "service-neck", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", "customer-1", LocalDate.of(2026, 9, 1), LocalTime.of(10, 0),
                60, BookingStatus.PENDING_PAYMENT);
        bookingGateway.save(pending);

        int released = service.releaseExpiredPendingPayments();

        assertThat(released).isEqualTo(1);
        assertThat(bookingGateway.findById("BK-T-1").orElseThrow().status()).isEqualTo(BookingStatus.CANCELLED);
        verify(auditLogService).record(eq("booking:timeout"), eq("booking"), eq("BK-T-1"), eq("store-jingan"), any(), any());
    }

    @Test
    void leavesBookedBookingsUntouched() {
        bookingGateway.save(BookingFactory.demo("BK-T-2", "store-jingan", "service-neck", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", "customer-1", LocalDate.of(2026, 9, 1), LocalTime.of(10, 0),
                60, BookingStatus.BOOKED));

        assertThat(service.releaseExpiredPendingPayments()).isZero();
        assertThat(bookingGateway.findById("BK-T-2").orElseThrow().status()).isEqualTo(BookingStatus.BOOKED);
    }
}
