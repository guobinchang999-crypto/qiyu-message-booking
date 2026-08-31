package com.qiyu.application.booking;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuditLogService;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.application.auth.AuthContext;
import com.qiyu.domain.schedule.ScheduleConflictChecker;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import com.qiyu.domain.coupon.gateway.CouponGateway;
import com.qiyu.domain.payment.gateway.PaymentGateway;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Orchestrates booking use cases across authentication, catalog validation, resource conflict
 * detection, persistence and audit logging. State-transition rules themselves stay in the
 * {@link Booking} aggregate.
 */
@Service
public class BookingAppService {
    private final BookingGateway bookingGateway;
    private final CatalogGateway catalogProvider;
    private final AuthAppService authAppService;
    private final DataPermissionService dataPermissionService;
    private final AuditLogService auditLogService;
    private final ScheduleConflictChecker conflictChecker = new ScheduleConflictChecker();
    private final AtomicInteger sequence = new AtomicInteger(1003);
    private final boolean persistenceEnabled;
    private final CustomerLookupGateway customerLookupGateway;
    private final CouponGateway couponGateway;
    private final PaymentGateway paymentGateway;

    public BookingAppService(BookingGateway bookingGateway, CatalogGateway catalogProvider,
                             AuthAppService authAppService,
                             DataPermissionService dataPermissionService, AuditLogService auditLogService,
                             @Value("${qiyu.auth.persistence:false}") boolean persistenceEnabled, CustomerLookupGateway customerLookupGateway,
                             CouponGateway couponGateway, PaymentGateway paymentGateway) {
        this.bookingGateway = bookingGateway;
        this.catalogProvider = catalogProvider;
        this.authAppService = authAppService;
        this.dataPermissionService = dataPermissionService;
        this.auditLogService = auditLogService;
        this.persistenceEnabled = persistenceEnabled;
        this.customerLookupGateway = customerLookupGateway;
        this.couponGateway = couponGateway;
        this.paymentGateway = paymentGateway;
        if (!persistenceEnabled) seedBookings();
    }

    /** Creates a customer-owned booking after catalog validation and conflict checking. */
    public synchronized BookingVO create(BookingCreateCommand command) {
        // A booking belongs to the authenticated customer; callers cannot inject another owner.
        AuthPrincipal principal = authAppService.requireCustomer();
        return createForCustomer(command, principal.customerId(), false);
    }

    /** Creates a booking for an existing customer from an authorized staff workflow. */
    /** Creates a booking for an existing customer after staff function and store-scope checks. */
    public synchronized BookingVO createForAdmin(BookingCreateCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("booking:create");
        if (!principal.canAccessStore("booking", "CREATE", command.storeId())) {
            throw new SecurityException("没有权限在该门店创建预约");
        }
        String customerId = customerLookupGateway.findIdByMobile(command.mobile())
                .orElseThrow(() -> new IllegalArgumentException("客户不存在，请先创建客户档案"));
        return createForCustomer(command, customerId, true);
    }

    private BookingVO createForCustomer(BookingCreateCommand command, String customerId, boolean staffCreated) {
        ServiceItem service = catalogProvider.findService(command.serviceId());
        catalogProvider.findStore(command.storeId());
        String therapistId = command.therapistId();
        if (therapistId == null || therapistId.isBlank()) {
            therapistId = catalogProvider.therapists(command.storeId(), command.serviceId()).stream()
                    .filter(item -> "AVAILABLE".equals(item.status()))
                    .map(Therapist::id)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("当前门店暂无可用技师"));
        }
        Therapist therapist = catalogProvider.findTherapist(therapistId);
        if (!command.storeId().equals(therapist.storeId())) {
            throw new IllegalArgumentException("所选技师不属于当前门店");
        }
        String roomId = command.roomId() == null || command.roomId().isBlank()
                ? defaultRoomId(command.storeId()) : command.roomId();
        String bookingNo = persistenceEnabled ? "BK-" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS").format(java.time.LocalDateTime.now()) : "BK-202608-" + sequence.getAndIncrement();
        BookingPricing pricing = pricing(service, therapist, customerId, command.couponId(), 1);
        Booking booking = new Booking(bookingNo, command.storeId(), command.serviceId(),
                therapistId, roomId, command.customerName(), command.mobile(), customerId, LocalDate.parse(command.date()),
                LocalTime.parse(command.startTime()), service.durationMinutes(), BookingStatus.PENDING_PAYMENT, null,
                pricing.itemAmount(), pricing.therapistFee(), pricing.discountAmount(), BigDecimal.ZERO,
                pricing.depositDue(), BigDecimal.ZERO);
        // Validate the complete occupied window, including preparation and cleanup buffers,
        // before any state is persisted.
        conflictChecker.ensureAvailable(booking, bookingGateway.findAll());
        return toView(bookingGateway.save(booking));
    }

    /** Calculates the confirmation-page amount breakdown without mutating a booking. */
    public BookingOperationVO.Confirmation confirmation(String storeId, String serviceId, String therapistId, String date,
                                            String startTime, Integer guestCount, String couponId) {
        authAppService.requireCustomer();
        Store store = catalogProvider.findStore(storeId);
        ServiceItem service = catalogProvider.findService(serviceId);
        Therapist therapist = therapistId == null || therapistId.isBlank() ? null : catalogProvider.findTherapist(therapistId);
        int safeGuestCount = guestCount == null || guestCount < 1 ? 1 : guestCount;
        BookingPricing pricing = pricing(service, therapist, AuthContext.current().customerId(), couponId, safeGuestCount);

        return new BookingOperationVO.Confirmation("确认预约",
                new BookingOperationVO.EditActions("修改门店", "修改项目", "修改技师", "修改时间"),
                new BookingOperationVO.ServiceCardMeta("分钟", "已服务", "次"), store, service, therapist,
                therapist == null ? "系统自动分配技师" : therapist.name(), date + " " + startTime,
                new BookingOperationVO.PaymentSummary(money(pricing.itemAmount()), money(pricing.therapistFee()), money(pricing.discountAmount()), 0, money(pricing.depositDue()), money(pricing.depositDue())),
                new BookingOperationVO.FormCopy("服务人数", "预约人", "请输入姓名", "备注", "选填", "请填写预约人姓名", "确认预约"),
                "会员权益 · 全门店通用", (couponId == null || couponId.isBlank() ? "不使用优惠" : couponId) + " ›", "费用明细",
                List.of(new BookingOperationVO.PaymentLine("item", "服务项目", "¥" + money(pricing.itemAmount()), null),
                        new BookingOperationVO.PaymentLine("therapist", "指定技师", "¥" + money(pricing.therapistFee()), null),
                        new BookingOperationVO.PaymentLine("discount", "优惠", "-¥" + money(pricing.discountAmount()), "discount")),
                "应付订金", "我已阅读并同意取消预约规则", "请先阅读并同意取消预约规则", "确认并支付订金 ¥" + money(pricing.depositDue()), safeGuestCount);
    }

    /** Loads one booking only after applying row-level permission checks. */
    public BookingVO detail(String bookingId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        return toView(booking);
    }

    /** Returns the typed success-page payload for an authorized booking. */
    public BookingOperationVO.Success success(String bookingId) {
        return new BookingOperationVO.Success(detail(bookingId), new BookingOperationVO.SuccessCopy(
                "预约成功", "已为你保留安静的放松时光", "预约编号", "到店后可在预约详情或签到页出示预约码。",
                "导航", "联系门店", "到店前 30 分钟将再次提醒你，请提前 10 分钟到店。", "查看预约详情", "返回首页"));
    }

    /** Builds a new-booking draft from an authorized historical booking. */
    public BookingOperationVO.DraftResult rebookDraft(String bookingId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        return new BookingOperationVO.DraftResult(booking.id(), new BookingOperationVO.Draft(booking.storeId(), booking.serviceId(), "auto", null, null, 1, booking.customerName(), "", "", "create", null));
    }

    /** Builds a rescheduling draft and rejects bookings in non-reschedulable states. */
    public BookingOperationVO.DraftResult rescheduleDraft(String bookingId) {
        Booking booking = authorized(bookingId, "booking:update", "UPDATE");
        if (booking.status() != BookingStatus.BOOKED) {
            throw new IllegalArgumentException("当前预约状态不可改期");
        }
        return new BookingOperationVO.DraftResult(booking.id(), new BookingOperationVO.Draft(booking.storeId(), booking.serviceId(), "specified", booking.therapistId(), null, 1, booking.customerName(), "", "", "reschedule", booking.id()));
    }

    /** Checks in a booking and records the state transition in the audit log. */
    public BookingVO checkIn(String bookingId) {
        // Authorization precedes mutation so forbidden requests cannot reveal transition details.
        Booking booking = authorized(bookingId, "booking:checkin", "CHECKIN");
        String beforeStatus = booking.status().name();
        booking.checkIn();
        bookingGateway.save(booking);
        auditLogService.record("booking:checkin", "booking", booking.id(), booking.storeId(),
                Map.of("status", beforeStatus), Map.of("status", booking.status().name()));
        return toView(booking);
    }

    /** Refreshes the check-in code after verifying booking visibility. */
    public BookingVO refreshVerificationCode(String bookingId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        booking.refreshVerificationCode();
        bookingGateway.save(booking);
        return toView(booking);
    }

    /** Cancels an authorized booking, releases its occupied resources and audits the change. */
    public BookingVO cancel(String bookingId) {
        Booking booking = authorized(bookingId, "booking:cancel", "CANCEL");
        String beforeStatus = booking.status().name();
        booking.cancel();
        bookingGateway.save(booking);
        auditLogService.record("booking:cancel", "booking", booking.id(), booking.storeId(),
                Map.of("status", beforeStatus), Map.of("status", booking.status().name()));
        return toView(booking);
    }

    /** Creates provider payment parameters; an unavailable provider fails closed instead of faking success. */
    public BookingOperationVO.Payment preparePayment(String bookingId, String requestId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        PaymentGateway.PaymentPreparation payment = paymentGateway.prepareDeposit(booking, requestId);
        PaymentGateway.PaymentParameters parameters = payment.parameters();
        return new BookingOperationVO.Payment(booking.id(), payment.amount(), payment.paymentNo(),
                new BookingOperationVO.PaymentParameters(parameters.timeStamp(), parameters.nonceStr(), parameters.packageValue(),
                        parameters.signType(), parameters.paySign()));
    }

    /** Applies the deposit-paid state transition for a customer-owned booking. */
    public BookingVO payDeposit(String bookingId, String requestId) {
        Booking booking = authorized(bookingId, "booking:update", "UPDATE");
        paymentGateway.verifyDepositConfirmation(booking, requestId);
        booking.payDeposit();
        bookingGateway.save(booking);
        return toView(booking);
    }

    /** Starts service after staff authentication and row-level authorization. */
    public BookingVO startService(String bookingId) {
        Booking booking = authorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.startService();
        bookingGateway.save(booking);
        return toView(booking);
    }

    /** Finishes service after staff authentication and row-level authorization. */
    public BookingVO finishService(String bookingId) {
        Booking booking = authorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.finishService();
        bookingGateway.save(booking);
        return toView(booking);
    }

    /** Completes settlement after staff authentication and row-level authorization. */
    public BookingVO completeSettlement(String bookingId) {
        Booking booking = authorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.completeSettlement();
        bookingGateway.save(booking);
        return toView(booking);
    }

    /** Reschedules through a detached candidate so failed conflict checks do not mutate state. */
    public synchronized BookingVO reschedule(String bookingId, String date, String startTime) {
        Booking booking = authorized(bookingId, "booking:update", "UPDATE");
        String beforeScheduledAt = booking.timeRange().serviceFrom().toString();
        ServiceItem service = catalogProvider.findService(booking.serviceId());
        // Build a detached candidate first. A failed conflict check must leave the aggregate's
        // original schedule unchanged.
        Booking candidate = new Booking(booking.id(), booking.storeId(), booking.serviceId(), booking.therapistId(), booking.roomId(),
                booking.customerName(), booking.mobile(), booking.customerId(), LocalDate.parse(date), LocalTime.parse(startTime),
                service.durationMinutes(), booking.status(), booking.verificationCode(), booking.itemAmount(), booking.therapistFeeAmount(),
                booking.discountAmount(), booking.balanceDeductionAmount(), booking.depositDueAmount(), booking.paidAmount());
        conflictChecker.ensureAvailable(candidate, bookingGateway.findAll().stream()
                .filter(existing -> !existing.id().equals(booking.id()))
                .toList());
        booking.reschedule(LocalDate.parse(date), LocalTime.parse(startTime), service.durationMinutes());
        bookingGateway.save(booking);
        auditLogService.record("booking:update", "booking", booking.id(), booking.storeId(),
                Map.of("scheduledAt", beforeScheduledAt), Map.of("scheduledAt", booking.timeRange().serviceFrom().toString()));
        return toView(booking);
    }

    /** Returns only bookings allowed by the current principal and optional status filter. */
    public List<BookingVO> list(String status) {
        AuthPrincipal principal = dataPermissionService.requirePermission("booking:read");
        // Data scope is applied before mapping, so list, statistics and sensitive-field handling
        // never receive rows outside the principal's accessible stores or therapist identity.
        return bookingGateway.findAll().stream()
                .filter(booking -> dataPermissionService.canAccessBooking(principal, booking, "READ"))
                .filter(booking -> status == null || status.isBlank() || booking.status().name().equals(status))
                .map(this::toView)
                .toList();
    }

    /** Maps a domain booking while applying sensitive-field permissions before serialization. */
    private BookingVO toView(Booking booking) {
        ServiceItem service = catalogProvider.findService(booking.serviceId());
        Store store = catalogProvider.findStore(booking.storeId());
        // Automatically assigned bookings may legitimately remain without a therapist until
        // store staff completes resource assignment.
        Therapist therapist = booking.therapistId() == null ? null : catalogProvider.findTherapist(booking.therapistId());
        // Field permission is independent of row permission: broad store access does not imply
        // access to a customer's full mobile number.
        boolean revealPhone = dataPermissionService.canRevealCustomerPhone(AuthContext.current(), booking);
        if (revealPhone && AuthContext.current().userType() != com.qiyu.domain.auth.UserType.CUSTOMER) {
            auditLogService.record("customer:reveal_phone", "booking", booking.id(), booking.storeId(), Map.of(), Map.of("field", "mobile"));
        }
        return new BookingVO(booking.id(), booking.status().name(), booking.status().label(),
                com.qiyu.application.catalog.CatalogResourceVO.store(store),
                com.qiyu.application.catalog.CatalogResourceVO.service(service),
                therapist == null ? null : com.qiyu.application.catalog.CatalogResourceVO.therapist(therapist), booking.roomId(),
                booking.customerName(), revealPhone ? booking.mobile() : maskMobile(booking.mobile()),
                booking.customerId(), booking.timeRange().serviceFrom().toLocalDate().toString(),
                booking.timeRange().serviceFrom().toLocalTime().toString(),
                booking.timeRange().serviceTo().toLocalTime().toString(), booking.itemAmount(), booking.therapistFeeAmount(),
                booking.discountAmount(), booking.balanceDeductionAmount(), booking.depositDueAmount(), booking.paidAmount(),
                "会员权益全门店通用", booking.verificationCode(), null, availableActions(booking.status()));
    }

    private void seedBookings() {
        Booking booked = new Booking("BK-202608-1000", "store-jingan", "service-neck", "therapist-anran", "room-jingan-02",
                "林女士", "13800001234", LocalDate.of(2026, 8, 8), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);
        bookingGateway.save(booked);
        Booking pendingPayment = new Booking("BK-202608-1001", "store-jingan", "service-spa", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", LocalDate.of(2026, 8, 9), LocalTime.of(19, 0), 90, BookingStatus.PENDING_PAYMENT);
        bookingGateway.save(pendingPayment);
        Booking reschedulable = new Booking("BK-202608-1002", "store-jingan", "service-neck", "therapist-anran", "room-jingan-01",
                "林女士", "13800001234", LocalDate.of(2026, 8, 11), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);
        bookingGateway.save(reschedulable);
        Booking otherStore = new Booking("BK-202608-1999", "store-xujiahui", "service-tui-na", "therapist-yuanyuan", "room-xujiahui-01",
                "周女士", "13900005678", "customer-other", LocalDate.of(2026, 8, 12), LocalTime.of(15, 0), 90, BookingStatus.BOOKED);
        bookingGateway.save(otherStore);
    }

    /** Loads and authorizes a booking for the current customer or staff principal. */
    private Booking authorized(String bookingId, String permissionCode, String actionCode) {
        Booking booking = bookingGateway.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在"));
        // One guard combines functional permission, explicit deny and row-level data scope.
        dataPermissionService.requireBooking(AuthContext.current(), booking, permissionCode, actionCode);
        return booking;
    }

    /** Loads and authorizes a booking specifically for a staff workflow. */
    private Booking authorizedStaff(String bookingId, String permissionCode, String actionCode) {
        AuthPrincipal principal = authAppService.requireAdmin();
        Booking booking = bookingGateway.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在"));
        dataPermissionService.requireBooking(principal, booking, permissionCode, actionCode);
        return booking;
    }

    private static String maskMobile(String mobile) {
        return mobile.length() < 7 ? mobile : mobile.substring(0, 3) + "****" + mobile.substring(mobile.length() - 4);
    }

    private static String defaultRoomId(String storeId) {
        String suffix = storeId == null ? "default" : storeId.replaceFirst("^store-", "");
        return "room-" + suffix + "-01";
    }

    /** Uses the authenticated customer's coupon ownership as the only source of a booking discount. */
    private BigDecimal resolveDiscount(String customerId, String couponNo, BigDecimal subtotal) {
        if (couponNo == null || couponNo.isBlank()) return BigDecimal.ZERO;
        return couponGateway.findApplicable(customerId, couponNo)
                .map(coupon -> coupon.discountFor(subtotal))
                .orElseThrow(() -> new IllegalArgumentException("优惠券不可用"));
    }

    private BookingPricing pricing(ServiceItem service, Therapist therapist, String customerId, String couponNo, int guestCount) {
        BigDecimal itemAmount = decimal(service.memberPrice()).multiply(BigDecimal.valueOf(guestCount));
        BigDecimal therapistFee = (therapist == null ? BigDecimal.ZERO : decimal(therapist.extraFee())).multiply(BigDecimal.valueOf(guestCount));
        BigDecimal discountAmount = resolveDiscount(customerId, couponNo, itemAmount.add(therapistFee));
        BigDecimal totalAmount = itemAmount.add(therapistFee).subtract(discountAmount).max(BigDecimal.ZERO);
        return new BookingPricing(itemAmount, therapistFee, discountAmount, totalAmount.min(BigDecimal.valueOf(50L * guestCount)));
    }

    /** Server-owned actions keep the client from deriving permissions from a booking status. */
    private static List<String> availableActions(BookingStatus status) {
        return switch (status) {
            case PENDING_PAYMENT -> List.of("pay", "cancel", "view_detail");
            case BOOKED -> List.of("show_code", "refresh_code", "reschedule", "contact", "view_detail");
            case CHECKED_IN -> List.of("refresh_code", "contact", "view_detail");
            case WAITING_SERVICE, IN_SERVICE, PENDING_SETTLEMENT -> List.of("contact", "view_detail");
            case COMPLETED -> List.of("review", "rebook", "view_detail");
            case CANCELLED -> List.of("rebook", "view_detail");
        };
    }

    private static int money(BigDecimal value) {
        return value.setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    private static BigDecimal decimal(Number value) {
        return value instanceof BigDecimal decimal ? decimal : new BigDecimal(value.toString());
    }

    private record BookingPricing(BigDecimal itemAmount, BigDecimal therapistFee, BigDecimal discountAmount,
                                  BigDecimal depositDue) {}
}
