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
import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.LocalTime;
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
    private final MockCatalogProvider copyProvider;
    private final AuthAppService authAppService;
    private final DataPermissionService dataPermissionService;
    private final AuditLogService auditLogService;
    private final ScheduleConflictChecker conflictChecker = new ScheduleConflictChecker();
    private final AtomicInteger sequence = new AtomicInteger(1003);
    private final boolean persistenceEnabled;
    private final CustomerLookupGateway customerLookupGateway;

    public BookingAppService(BookingGateway bookingGateway, CatalogGateway catalogProvider, MockCatalogProvider copyProvider,
                             AuthAppService authAppService,
                             DataPermissionService dataPermissionService, AuditLogService auditLogService,
                             @Value("${qiyu.auth.persistence:false}") boolean persistenceEnabled, CustomerLookupGateway customerLookupGateway) {
        this.bookingGateway = bookingGateway;
        this.catalogProvider = catalogProvider;
        this.copyProvider = copyProvider;
        this.authAppService = authAppService;
        this.dataPermissionService = dataPermissionService;
        this.auditLogService = auditLogService;
        this.persistenceEnabled = persistenceEnabled;
        this.customerLookupGateway = customerLookupGateway;
        if (!persistenceEnabled) seedBookings();
    }

    public synchronized Map<String, Object> create(BookingCreateCommand command) {
        // A booking belongs to the authenticated customer; callers cannot inject another owner.
        AuthPrincipal principal = authAppService.requireCustomer();
        return createForCustomer(command, principal.customerId(), false);
    }

    /** Creates a booking for an existing customer from an authorized staff workflow. */
    public synchronized Map<String, Object> createForAdmin(BookingCreateCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("booking:create");
        if (!principal.canAccessStore("booking", "CREATE", command.storeId())) {
            throw new SecurityException("没有权限在该门店创建预约");
        }
        String customerId = customerLookupGateway.findIdByMobile(command.mobile())
                .orElseThrow(() -> new IllegalArgumentException("客户不存在，请先创建客户档案"));
        return createForCustomer(command, customerId, true);
    }

    private Map<String, Object> createForCustomer(BookingCreateCommand command, String customerId, boolean staffCreated) {
        Map<String, Object> service = catalogProvider.findService(command.serviceId());
        catalogProvider.findStore(command.storeId());
        String therapistId = command.therapistId();
        if (therapistId == null || therapistId.isBlank()) {
            therapistId = catalogProvider.therapists(command.storeId(), command.serviceId()).stream()
                    .filter(item -> "AVAILABLE".equals(item.get("status")))
                    .map(item -> String.valueOf(item.get("id")))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("当前门店暂无可用技师"));
        }
        Map<String, Object> therapist = catalogProvider.findTherapist(therapistId);
        if (!command.storeId().equals(therapist.get("storeId"))) {
            throw new IllegalArgumentException("所选技师不属于当前门店");
        }
        String roomId = command.roomId() == null || command.roomId().isBlank()
                ? defaultRoomId(command.storeId()) : command.roomId();
        String bookingNo = persistenceEnabled ? "BK-" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS").format(java.time.LocalDateTime.now()) : "BK-202608-" + sequence.getAndIncrement();
        Booking booking = new Booking(bookingNo, command.storeId(), command.serviceId(),
                therapistId, roomId, command.customerName(), command.mobile(), customerId, LocalDate.parse(command.date()),
                LocalTime.parse(command.startTime()), (Integer) service.get("durationMinutes"), BookingStatus.BOOKED);
        // Validate the complete occupied window, including preparation and cleanup buffers,
        // before any state is persisted.
        conflictChecker.ensureAvailable(booking, bookingGateway.findAll());
        return toView(bookingGateway.save(booking));
    }

    public Map<String, Object> confirmation(String storeId, String serviceId, String therapistId, String date,
                                            String startTime, Integer guestCount, String couponId) {
        authAppService.requireCustomer();
        Map<String, Object> store = catalogProvider.findStore(storeId);
        Map<String, Object> service = catalogProvider.findService(serviceId);
        Map<String, Object> therapist = therapistId == null || therapistId.isBlank() ? null : catalogProvider.findTherapist(therapistId);
        int safeGuestCount = guestCount == null || guestCount < 1 ? 1 : guestCount;
        int itemAmount = numberValue(service, "memberPrice") * safeGuestCount;
        int therapistFee = (therapist == null ? 0 : numberValue(therapist, "extraFee")) * safeGuestCount;
        int discountAmount = couponId == null || couponId.isBlank() ? 0 : 20;
        int totalAmount = Math.max(0, itemAmount + therapistFee - discountAmount);
        int depositDue = Math.min(totalAmount, 50 * safeGuestCount);

        Map<String, Object> payment = new LinkedHashMap<>();
        payment.put("itemAmount", itemAmount);
        payment.put("therapistFee", therapistFee);
        payment.put("discountAmount", discountAmount);
        payment.put("balanceDeduction", 0);
        payment.put("depositDue", depositDue);
        payment.put("paidAmount", depositDue);

        Map<String, Object> formCopy = new LinkedHashMap<>();
        formCopy.put("guestCountLabel", "服务人数");
        formCopy.put("contactLabel", "预约人");
        formCopy.put("contactPlaceholder", "请输入姓名");
        formCopy.put("remarkLabel", "备注");
        formCopy.put("remarkPlaceholder", "选填");
        formCopy.put("contactRequiredMessage", "请填写预约人姓名");
        formCopy.put("submitFallbackText", "确认预约");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pageTitle", "确认预约");
        result.put("editActions", Map.of(
                "store", "修改门店",
                "service", "修改项目",
                "therapist", "修改技师",
                "time", "修改时间"
        ));
        result.put("cardMeta", Map.of("durationUnit", "分钟", "servedPrefix", "已服务", "servedSuffix", "次"));
        result.put("store", store);
        result.put("service", service);
        result.put("therapist", therapist);
        result.put("therapistDisplayName", therapist == null ? "系统自动分配技师" : therapist.get("name"));
        result.put("scheduledAt", date + " " + startTime);
        result.put("payment", payment);
        result.put("formCopy", formCopy);
        result.put("benefitTitle", "会员权益 · 全门店通用");
        result.put("benefitSelectionText", (couponId == null || couponId.isBlank() ? "不使用优惠" : couponId) + " ›");
        result.put("paymentTitle", "费用明细");
        result.put("paymentLines", List.of(
                Map.of("key", "item", "label", "服务项目", "amountText", "¥" + itemAmount),
                Map.of("key", "therapist", "label", "指定技师", "amountText", "¥" + therapistFee),
                Map.of("key", "discount", "label", "优惠", "amountText", "-¥" + discountAmount, "tone", "discount")
        ));
        result.put("totalLabel", "应付订金");
        result.put("agreementText", "我已阅读并同意取消预约规则");
        result.put("agreementRequiredMessage", "请先阅读并同意取消预约规则");
        result.put("depositButtonText", "确认并支付订金 ¥" + depositDue);
        result.put("guestCount", safeGuestCount);
        return result;
    }

    public Map<String, Object> detail(String bookingId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        return toView(booking);
    }

    public Map<String, Object> success(String bookingId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("booking", detail(bookingId));
        result.put("copy", copyProvider.successCopy());
        return result;
    }

    public Map<String, Object> rebookDraft(String bookingId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        Map<String, Object> draft = new LinkedHashMap<>();
        draft.put("storeId", booking.storeId());
        draft.put("serviceId", booking.serviceId());
        draft.put("therapistMode", "auto");
        draft.put("therapistId", null);
        draft.put("slotId", null);
        draft.put("guestCount", 1);
        draft.put("contact", booking.customerName());
        draft.put("remark", "");
        draft.put("benefitSelection", "");
        draft.put("flow", "create");
        draft.put("sourceBookingId", null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sourceBookingId", booking.id());
        result.put("draft", draft);
        return result;
    }

    public Map<String, Object> rescheduleDraft(String bookingId) {
        Booking booking = authorized(bookingId, "booking:update", "UPDATE");
        if (booking.status() != BookingStatus.BOOKED) {
            throw new IllegalArgumentException("当前预约状态不可改期");
        }
        Map<String, Object> draft = new LinkedHashMap<>();
        draft.put("storeId", booking.storeId());
        draft.put("serviceId", booking.serviceId());
        draft.put("therapistMode", "specified");
        draft.put("therapistId", booking.therapistId());
        draft.put("slotId", null);
        draft.put("guestCount", 1);
        draft.put("contact", booking.customerName());
        draft.put("remark", "");
        draft.put("benefitSelection", "");
        draft.put("flow", "reschedule");
        draft.put("sourceBookingId", booking.id());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sourceBookingId", booking.id());
        result.put("draft", draft);
        return result;
    }

    public Map<String, Object> checkIn(String bookingId) {
        // Authorization precedes mutation so forbidden requests cannot reveal transition details.
        Booking booking = authorized(bookingId, "booking:checkin", "CHECKIN");
        String beforeStatus = booking.status().name();
        booking.checkIn();
        bookingGateway.save(booking);
        auditLogService.record("booking:checkin", "booking", booking.id(), booking.storeId(),
                Map.of("status", beforeStatus), Map.of("status", booking.status().name()));
        return toView(booking);
    }

    public Map<String, Object> refreshVerificationCode(String bookingId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        booking.refreshVerificationCode();
        bookingGateway.save(booking);
        return toView(booking);
    }

    public Map<String, Object> cancel(String bookingId) {
        Booking booking = authorized(bookingId, "booking:cancel", "CANCEL");
        String beforeStatus = booking.status().name();
        booking.cancel();
        bookingGateway.save(booking);
        auditLogService.record("booking:cancel", "booking", booking.id(), booking.storeId(),
                Map.of("status", beforeStatus), Map.of("status", booking.status().name()));
        return toView(booking);
    }

    public Map<String, Object> preparePayment(String bookingId, String requestId) {
        Booking booking = authorized(bookingId, "booking:read", "READ");
        Map<String, Object> service = catalogProvider.findService(booking.serviceId());
        String paymentNo = "PAY-" + booking.id() + "-" + (requestId == null || requestId.isBlank() ? "mock" : requestId);

        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("timeStamp", String.valueOf(System.currentTimeMillis() / 1000));
        parameters.put("nonceStr", "mock-" + booking.id());
        parameters.put("package", "prepay_id=mock-" + booking.id());
        parameters.put("signType", "RSA");
        parameters.put("paySign", "mock-signature");
        parameters.put("mockPayment", true);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("bookingId", booking.id());
        result.put("amount", service.get("memberPrice"));
        result.put("paymentNo", paymentNo);
        result.put("parameters", parameters);
        return result;
    }

    public Map<String, Object> payDeposit(String bookingId) {
        Booking booking = authorized(bookingId, "booking:update", "UPDATE");
        booking.payDeposit();
        bookingGateway.save(booking);
        return toView(booking);
    }

    public Map<String, Object> startService(String bookingId) {
        Booking booking = authorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.startService();
        bookingGateway.save(booking);
        return toView(booking);
    }

    public Map<String, Object> finishService(String bookingId) {
        Booking booking = authorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.finishService();
        bookingGateway.save(booking);
        return toView(booking);
    }

    public Map<String, Object> completeSettlement(String bookingId) {
        Booking booking = authorizedStaff(bookingId, "booking:update", "UPDATE");
        booking.completeSettlement();
        bookingGateway.save(booking);
        return toView(booking);
    }

    public synchronized Map<String, Object> reschedule(String bookingId, String date, String startTime) {
        Booking booking = authorized(bookingId, "booking:update", "UPDATE");
        String beforeScheduledAt = booking.timeRange().serviceFrom().toString();
        Map<String, Object> service = catalogProvider.findService(booking.serviceId());
        // Build a detached candidate first. A failed conflict check must leave the aggregate's
        // original schedule unchanged.
        Booking candidate = new Booking(booking.id(), booking.storeId(), booking.serviceId(), booking.therapistId(), booking.roomId(),
                booking.customerName(), booking.mobile(), booking.customerId(), LocalDate.parse(date), LocalTime.parse(startTime),
                numberValue(service, "durationMinutes"), booking.status());
        conflictChecker.ensureAvailable(candidate, bookingGateway.findAll().stream()
                .filter(existing -> !existing.id().equals(booking.id()))
                .toList());
        booking.reschedule(LocalDate.parse(date), LocalTime.parse(startTime), numberValue(service, "durationMinutes"));
        bookingGateway.save(booking);
        auditLogService.record("booking:update", "booking", booking.id(), booking.storeId(),
                Map.of("scheduledAt", beforeScheduledAt), Map.of("scheduledAt", booking.timeRange().serviceFrom().toString()));
        return toView(booking);
    }

    public List<Map<String, Object>> list(String status) {
        AuthPrincipal principal = dataPermissionService.requirePermission("booking:read");
        // Data scope is applied before mapping, so list, statistics and sensitive-field handling
        // never receive rows outside the principal's accessible stores or therapist identity.
        return bookingGateway.findAll().stream()
                .filter(booking -> dataPermissionService.canAccessBooking(principal, booking, "READ"))
                .filter(booking -> status == null || status.isBlank() || booking.status().name().equals(status))
                .map(this::toView)
                .toList();
    }

    private Map<String, Object> toView(Booking booking) {
        Map<String, Object> service = catalogProvider.findService(booking.serviceId());
        Map<String, Object> store = catalogProvider.findStore(booking.storeId());
        Map<String, Object> therapist = catalogProvider.findTherapist(booking.therapistId());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", booking.id());
        result.put("status", booking.status().name());
        result.put("statusLabel", booking.status().label());
        result.put("store", store);
        result.put("service", service);
        result.put("therapist", therapist);
        result.put("roomId", booking.roomId());
        result.put("customerName", booking.customerName());
        // Field permission is independent of row permission: broad store access does not imply
        // access to a customer's full mobile number.
        boolean revealPhone = dataPermissionService.canRevealCustomerPhone(AuthContext.current(), booking);
        result.put("mobile", revealPhone ? booking.mobile() : maskMobile(booking.mobile()));
        result.put("customerId", booking.customerId());
        result.put("appointmentDate", booking.timeRange().serviceFrom().toLocalDate().toString());
        result.put("startTime", booking.timeRange().serviceFrom().toLocalTime().toString());
        result.put("endTime", booking.timeRange().serviceTo().toLocalTime().toString());
        result.put("amount", service.get("memberPrice"));
        result.put("memberBenefit", "会员权益全门店通用");
        result.put("verificationCode", booking.verificationCode());
        result.put("verificationQrImageUrl", "https://mock-cdn.qiyu.local/checkin/" + booking.verificationCode() + ".png");
        if (revealPhone && AuthContext.current().userType() != com.qiyu.domain.auth.UserType.CUSTOMER) {
            auditLogService.record("customer:reveal_phone", "booking", booking.id(), booking.storeId(), Map.of(), Map.of("field", "mobile"));
        }
        return result;
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

    private Booking authorized(String bookingId, String permissionCode, String actionCode) {
        Booking booking = bookingGateway.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在"));
        // One guard combines functional permission, explicit deny and row-level data scope.
        dataPermissionService.requireBooking(AuthContext.current(), booking, permissionCode, actionCode);
        return booking;
    }

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

    private static int numberValue(Map<String, Object> item, String key) {
        Object value = item.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private static String defaultRoomId(String storeId) {
        String suffix = storeId == null ? "default" : storeId.replaceFirst("^store-", "");
        return "room-" + suffix + "-01";
    }
}
