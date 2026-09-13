package com.qiyu.application.booking;

import com.qiyu.application.booking.dto.BookingOperationVO;
import com.qiyu.application.booking.dto.BookingVO;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthContext;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingStatus;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Read-side booking use cases: confirmation previews, drafts, details and filtered lists.
 * Queries stay pragmatic and delegate authorization to the shared authorizer.
 */
@Service
public class BookingQueryService {
    private final AuthAppService authAppService;
    private final DataPermissionService dataPermissionService;
    private final CatalogGateway catalogProvider;
    private final com.qiyu.domain.booking.gateway.BookingGateway bookingGateway;
    private final BookingAuthorizer authorizer;
    private final BookingAssembler assembler;
    private final BookingPricingCalculator pricingCalculator;

    public BookingQueryService(AuthAppService authAppService, DataPermissionService dataPermissionService,
                               CatalogGateway catalogProvider, com.qiyu.domain.booking.gateway.BookingGateway bookingGateway,
                               BookingAuthorizer authorizer, BookingAssembler assembler,
                               BookingPricingCalculator pricingCalculator) {
        this.authAppService = authAppService;
        this.dataPermissionService = dataPermissionService;
        this.catalogProvider = catalogProvider;
        this.bookingGateway = bookingGateway;
        this.authorizer = authorizer;
        this.assembler = assembler;
        this.pricingCalculator = pricingCalculator;
    }

    /** Calculates the confirmation-page amount breakdown without mutating a booking. */
    public BookingOperationVO.Confirmation confirmation(String storeId, String serviceId, String therapistId, String date,
                                            String startTime, Integer guestCount, String couponId) {
        authAppService.requireCustomer();
        Store store = catalogProvider.findStore(storeId);
        ServiceItem service = catalogProvider.findService(serviceId);
        Therapist therapist = therapistId == null || therapistId.isBlank() ? null : catalogProvider.findTherapist(therapistId);
        int safeGuestCount = guestCount == null || guestCount < 1 ? 1 : guestCount;
        BookingPricingCalculator.BookingPricing pricing = pricingCalculator.pricing(service, therapist, AuthContext.current().customerId(), couponId, safeGuestCount);

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
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:read", "READ");
        authorizer.recordPhoneReveal(booking.storeId(), booking.id());
        return assembler.toView(booking);
    }

    /** Returns the typed success-page payload for an authorized booking. */
    public BookingOperationVO.Success success(String bookingId) {
        return new BookingOperationVO.Success(detail(bookingId), new BookingOperationVO.SuccessCopy(
                "预约成功", "已为你保留安静的放松时光", "预约编号", "到店后可在预约详情或签到页出示预约码。",
                "导航", "联系门店", "到店前 30 分钟将再次提醒你，请提前 10 分钟到店。", "查看预约详情", "返回首页"));
    }

    /** Builds a new-booking draft from an authorized historical booking. */
    public BookingOperationVO.DraftResult rebookDraft(String bookingId) {
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:read", "READ");
        return new BookingOperationVO.DraftResult(booking.id(), new BookingOperationVO.Draft(booking.storeId(), booking.serviceId(), "auto", null, null, 1, booking.customerName(), "", "", "create", null));
    }

    /** Builds a rescheduling draft and rejects bookings in non-reschedulable states. */
    public BookingOperationVO.DraftResult rescheduleDraft(String bookingId) {
        Booking booking = authorizer.loadAuthorized(bookingId, "booking:update", "UPDATE");
        if (booking.status() != BookingStatus.BOOKED) {
            throw new IllegalArgumentException("当前预约状态不可改期");
        }
        return new BookingOperationVO.DraftResult(booking.id(), new BookingOperationVO.Draft(booking.storeId(), booking.serviceId(), "specified", booking.therapistId(), null, 1, booking.customerName(), "", "", "reschedule", booking.id()));
    }

    /** Returns only bookings allowed by the current principal and optional status filter. */
    public List<BookingVO> list(String status) {
        AuthPrincipal principal = dataPermissionService.requirePermission("booking:read");
        // Data scope is applied before mapping, so list, statistics and sensitive-field handling
        // never receive rows outside the principal's accessible stores or therapist identity.
        List<BookingVO> rows = bookingGateway.findAll().stream()
                .filter(booking -> dataPermissionService.canAccessBooking(principal, booking, "READ"))
                .filter(booking -> status == null || status.isBlank() || booking.status().name().equals(status))
                .map(assembler::toView)
                .toList();
        // Phone reveal is a request-level capability, not a per-row event; one audit entry avoids
        // flooding the log for a single list that exposes N customer numbers.
        if (!rows.isEmpty()) {
            authorizer.recordPhoneReveal(null, "LIST");
        }
        return rows;
    }

    private static int money(java.math.BigDecimal value) {
        return BookingPricingCalculator.money(value);
    }
}
