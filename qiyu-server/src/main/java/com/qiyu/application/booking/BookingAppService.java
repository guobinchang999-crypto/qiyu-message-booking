package com.qiyu.application.booking;

import com.qiyu.application.booking.dto.BookingCreateCommand;
import com.qiyu.application.booking.dto.BookingOperationVO;
import com.qiyu.application.booking.dto.BookingVO;

import com.qiyu.application.auth.AuditLogService;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingDomainService;
import com.qiyu.domain.booking.BookingFactory;
import com.qiyu.domain.booking.BookingNo;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import com.qiyu.domain.payment.gateway.PaymentGateway;
import com.qiyu.domain.schedule.ScheduleConflictChecker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Command-side booking use cases: creation, state transitions and resource reassignment.
 * Query flows live in {@link BookingQueryService}; shared mapping and authorization live in
 * {@link BookingAssembler} and {@link BookingAuthorizer}.
 */
@Service
public class BookingAppService {
    private final BookingGateway bookingGateway;
    private final CatalogGateway catalogProvider;
    private final AuthAppService authAppService;
    private final AuditLogService auditLogService;
    private final CustomerLookupGateway customerLookupGateway;
    private final PaymentGateway paymentGateway;
    private final BookingAuthorizer authorizer;
    private final BookingAssembler assembler;
    private final BookingPricingCalculator pricingCalculator;
    private final BookingAvailabilityService availability;
    private final ScheduleConflictChecker conflictChecker = new ScheduleConflictChecker();
    private final BookingDomainService bookingDomain = new BookingDomainService();
    private final AtomicInteger sequence = new AtomicInteger(1003);
    private final boolean persistenceEnabled;
    private final int paymentTimeoutMinutes;

    public BookingAppService(BookingGateway bookingGateway, CatalogGateway catalogProvider,
                             AuthAppService authAppService, AuditLogService auditLogService,
                             @Value("${qiyu.auth.persistence:false}") boolean persistenceEnabled,
                             CustomerLookupGateway customerLookupGateway, PaymentGateway paymentGateway,
                             BookingAuthorizer authorizer, BookingAssembler assembler,
                             BookingPricingCalculator pricingCalculator, BookingAvailabilityService availability,
                             @Value("${qiyu.booking.payment-timeout-minutes:15}") int paymentTimeoutMinutes) {
        this.bookingGateway = bookingGateway;
        this.catalogProvider = catalogProvider;
        this.authAppService = authAppService;
        this.auditLogService = auditLogService;
        this.persistenceEnabled = persistenceEnabled;
        this.customerLookupGateway = customerLookupGateway;
        this.paymentGateway = paymentGateway;
        this.authorizer = authorizer;
        this.assembler = assembler;
        this.pricingCalculator = pricingCalculator;
        this.availability = availability;
        this.paymentTimeoutMinutes = paymentTimeoutMinutes;
    }

    /** Creates a customer-owned booking after catalog validation and conflict checking. */
    public synchronized BookingVO create(BookingCreateCommand command) {
        // synchronized only guards the in-memory check-then-save window of this single instance.
        // Multi-instance safety comes from resource row locks and the request_id unique key inside
        // the persistence gateway.
        AuthPrincipal principal = authAppService.requireCustomer();
        return createForCustomer(command, principal.customerId(), BookingStatus.PENDING_PAYMENT, BigDecimal.ZERO);
    }

    /** Creates a booking for an existing customer after staff function and store-scope checks. */
    public synchronized BookingVO createForAdmin(BookingCreateCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("booking:create");
        if (!principal.canAccessStore("booking", "CREATE", command.storeId())) {
            throw new SecurityException("没有权限在该门店创建预约");
        }
        String customerId = customerLookupGateway.findIdByMobile(command.mobile())
                .orElseThrow(() -> new IllegalArgumentException("客户不存在，请先创建客户档案"));
        // On-site staff confirms the reservation and collects the deposit at the counter, so the
        // booking is created BOOKED (with the deposit recorded as paid) instead of waiting for a
        // simulated online payment that must remain fail-closed until a merchant is configured.
        return createForCustomer(command, customerId, BookingStatus.BOOKED, null);
    }

    private BookingVO createForCustomer(BookingCreateCommand command, String customerId,
                                        BookingStatus initialStatus, BigDecimal paidAmountOverride) {
        // Idempotent creation: a retried submission with the same requestId returns the original
        // booking instead of creating a duplicate, even when the first response was lost.
        Booking existing = bookingGateway.findByRequestId(command.requestId()).orElse(null);
        if (existing != null) {
            if (!existing.customerId().equals(customerId) || !existing.storeId().equals(command.storeId()))
                throw new IllegalArgumentException("该提交标识已被使用，请重新创建预约");
            return assembler.toView(existing);
        }
        ServiceItem service = catalogProvider.findService(command.serviceId());
        catalogProvider.findStore(command.storeId());
        String therapistId = command.therapistId();
        if (therapistId == null || therapistId.isBlank()) {
            therapistId = bookingDomain.autoAssignTherapist(
                    catalogProvider.therapists(command.storeId(), command.serviceId())).id();
        }
        Therapist therapist = catalogProvider.findTherapist(therapistId);
        bookingDomain.ensureTherapistBelongsToStore(command.storeId(), therapist);
        String roomId = command.roomId() == null || command.roomId().isBlank()
                ? bookingDomain.defaultRoomId(command.storeId()) : command.roomId();
        String bookingNo = persistenceEnabled ? BookingNo.timestamped().value() : BookingNo.demo(sequence.getAndIncrement()).value();
        BookingPricingCalculator.BookingPricing pricing = pricingCalculator.pricing(service, therapist, customerId, command.couponId(), 1);
        Booking booking = BookingFactory.create(bookingNo, command.storeId(), command.serviceId(),
                therapistId, roomId, command.customerName(), command.mobile(), customerId, LocalDate.parse(command.date()),
                LocalTime.parse(command.startTime()), service.durationMinutes(), initialStatus,
                pricing.itemAmount(), pricing.therapistFee(), pricing.discountAmount(), BigDecimal.ZERO,
                pricing.depositDue(), paidAmountOverride == null ? pricing.depositDue() : paidAmountOverride,
                command.requestId());
        // Validate the complete occupied window, including preparation and cleanup buffers,
        // before any state is persisted.
        availability.validate(booking);
        return assembler.toView(bookingGateway.save(booking));
    }

    /** Checks in a booking and records the state transition in the audit log. */
    public BookingVO checkIn(String bookingId) {
        // Authorization precedes mutation so forbidden requests cannot reveal transition details.
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:checkin", "CHECKIN");
        String beforeStatus = booking.status().name();
        booking.checkIn();
        bookingGateway.save(booking);
        auditLogService.record("booking:checkin", "booking", booking.id(), booking.storeId(),
                Map.of("status", beforeStatus), Map.of("status", booking.status().name()));
        return assembler.toView(booking);
    }

    /** Refreshes the check-in code after verifying booking visibility. */
    public BookingVO refreshVerificationCode(String bookingId) {
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:read", "READ");
        booking.refreshVerificationCode();
        bookingGateway.save(booking);
        return assembler.toView(booking);
    }

    /** Cancels an authorized booking, releases its occupied resources and audits the change. */
    public BookingVO cancel(String bookingId) {
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:cancel", "CANCEL");
        String beforeStatus = booking.status().name();
        booking.cancel();
        bookingGateway.save(booking);
        auditLogService.record("booking:cancel", "booking", booking.id(), booking.storeId(),
                Map.of("status", beforeStatus), Map.of("status", booking.status().name()));
        return assembler.toView(booking);
    }

    /** Creates provider payment parameters; an unavailable provider fails closed instead of faking success. */
    public BookingOperationVO.Payment preparePayment(String bookingId, String requestId) {
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:read", "READ");
        PaymentGateway.PaymentPreparation payment = paymentGateway.prepareDeposit(booking, requestId);
        PaymentGateway.PaymentParameters parameters = payment.parameters();
        return new BookingOperationVO.Payment(booking.id(), payment.amount(), payment.paymentNo(),
                new BookingOperationVO.PaymentParameters(parameters.timeStamp(), parameters.nonceStr(), parameters.packageValue(),
                        parameters.signType(), parameters.paySign()));
    }

    /** Applies the deposit-paid state transition for a customer-owned booking. */
    public BookingVO payDeposit(String bookingId, String requestId) {
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:update", "UPDATE");
        paymentGateway.verifyDepositConfirmation(booking, requestId);
        booking.payDeposit();
        bookingGateway.save(booking);
        return assembler.toView(booking);
    }

    /** Starts service after staff authentication and row-level authorization. */
    public BookingVO startService(String bookingId) {
        Booking booking = authorizer.loadAuthorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.startService();
        bookingGateway.save(booking);
        return assembler.toView(booking);
    }

    /** Finishes service after staff authentication and row-level authorization. */
    public BookingVO finishService(String bookingId) {
        Booking booking = authorizer.loadAuthorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.finishService();
        bookingGateway.save(booking);
        return assembler.toView(booking);
    }

    /** Completes settlement after staff authentication and row-level authorization. */
    public BookingVO completeSettlement(String bookingId) {
        Booking booking = authorizer.loadAuthorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.completeSettlement();
        bookingGateway.save(booking);
        return assembler.toView(booking);
    }

    /** Applies schedule, therapist and room changes atomically in one transaction for staff workflows. */
    public synchronized BookingVO updateBooking(String bookingId, String date, String startTime,
                                                String therapistId, String roomId) {
        Booking booking = authorizer.loadAuthorizedStaff(bookingId, "booking:update", "UPDATE");
        return applyChanges(booking, date, startTime, therapistId, roomId);
    }

    /** Reschedules through a detached candidate so failed conflict checks do not mutate state. */
    public synchronized BookingVO reschedule(String bookingId, String date, String startTime) {
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:update", "UPDATE");
        return applyChanges(booking, date, startTime, null, null);
    }

    /** Reassigns the therapist for an existing booking after store and conflict validation. */
    public synchronized BookingVO changeTherapist(String bookingId, String therapistId) {
        Booking booking = authorizer.loadAuthorizedStaff(bookingId, "booking:update", "UPDATE");
        return applyChanges(booking, null, null, therapistId, null);
    }

    /** Assigns or swaps the service room after store and conflict validation. */
    public synchronized BookingVO assignRoom(String bookingId, String roomId) {
        Booking booking = authorizer.loadAuthorizedStaff(bookingId, "booking:update", "UPDATE");
        return applyChanges(booking, null, null, null, roomId);
    }

    /**
     * Validates all requested resource changes against a detached candidate first, then applies
     * them to the aggregate and persists once. A failed conflict check leaves the original
     * schedule, therapist and room unchanged.
     */
    private BookingVO applyChanges(Booking booking, String date, String startTime, String therapistId, String roomId) {
        boolean reschedule = date != null && !date.isBlank() && startTime != null && !startTime.isBlank();
        if ((date == null || date.isBlank()) != (startTime == null || startTime.isBlank())) {
            throw new IllegalArgumentException("预约日期和时间必须同时修改");
        }
        boolean changeTherapist = therapistId != null && !therapistId.isBlank();
        boolean changeRoom = roomId != null && !roomId.isBlank();
        if (!reschedule && !changeTherapist && !changeRoom) {
            throw new IllegalArgumentException("没有需要修改的内容");
        }
        ServiceItem service = catalogProvider.findService(booking.serviceId());
        if (changeTherapist) {
            Therapist therapist = catalogProvider.findTherapist(therapistId);
            bookingDomain.ensureTherapistBelongsToStore(booking.storeId(), therapist);
        }
        if (changeRoom) {
            Room room = catalogProvider.findRoom(roomId);
            bookingDomain.ensureRoomBelongsToStore(booking.storeId(), room);
        }
        LocalDate nextDate = reschedule ? LocalDate.parse(date) : booking.timeRange().serviceFrom().toLocalDate();
        LocalTime nextStart = reschedule ? LocalTime.parse(startTime) : booking.timeRange().serviceFrom().toLocalTime();
        String nextTherapistId = changeTherapist ? therapistId : booking.therapistId();
        String nextRoomId = changeRoom ? roomId : booking.roomId();
        Booking candidate = booking.candidate(nextTherapistId, nextRoomId, nextDate, nextStart, service.durationMinutes());
        availability.validate(candidate);
        conflictChecker.ensureAvailable(candidate, bookingGateway.findAll().stream()
                .filter(existing -> !existing.id().equals(booking.id()))
                .toList());
        Map<String, Object> before = new LinkedHashMap<>();
        Map<String, Object> after = new LinkedHashMap<>();
        if (reschedule) {
            before.put("scheduledAt", booking.timeRange().serviceFrom().toString());
            booking.reschedule(nextDate, nextStart, service.durationMinutes());
            after.put("scheduledAt", booking.timeRange().serviceFrom().toString());
        }
        if (changeTherapist) {
            before.put("therapistId", nonNull(booking.therapistId()));
            booking.changeTherapist(therapistId);
            after.put("therapistId", nonNull(booking.therapistId()));
        }
        if (changeRoom) {
            before.put("roomId", nonNull(booking.roomId()));
            booking.assignRoom(roomId);
            after.put("roomId", nonNull(booking.roomId()));
        }
        bookingGateway.save(booking);
        auditLogService.record("booking:update", "booking", booking.id(), booking.storeId(), before, after);
        return assembler.toView(booking);
    }

    /** Cancels unpaid bookings whose payment window expired and returns how many were released. */
    public int releaseExpiredPendingPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(paymentTimeoutMinutes);
        int released = 0;
        for (Booking booking : bookingGateway.findPendingPaymentBefore(cutoff)) {
            try {
                String beforeStatus = booking.status().name();
                booking.cancel();
                bookingGateway.save(booking);
                auditLogService.record("booking:timeout", "booking", booking.id(), booking.storeId(),
                        Map.of("status", beforeStatus), Map.of("status", booking.status().name()));
                released++;
            } catch (IllegalArgumentException ignored) {
                // Payment or another action changed the booking concurrently; skip it this round.
            }
        }
        return released;
    }

    private static String nonNull(String value) { return value == null ? "" : value; }
}
