package com.qiyu.application.booking;

import com.qiyu.application.auth.AuditLogService;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthContext;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.domain.auth.UserType;
import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.gateway.BookingGateway;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Shared authorization boundary for booking use cases: loads a booking and enforces functional,
 * deny and data-scope permissions in one guard, plus the phone-reveal audit capability.
 */
@Component
public class BookingAuthorizer {
    private final BookingGateway bookingGateway;
    private final DataPermissionService dataPermissionService;
    private final AuthAppService authAppService;
    private final AuditLogService auditLogService;

    public BookingAuthorizer(BookingGateway bookingGateway, DataPermissionService dataPermissionService,
                             AuthAppService authAppService, AuditLogService auditLogService) {
        this.bookingGateway = bookingGateway;
        this.dataPermissionService = dataPermissionService;
        this.authAppService = authAppService;
        this.auditLogService = auditLogService;
    }

    /** Loads and authorizes a booking for the current customer or staff principal. */
    public Booking loadAuthorized(String bookingId, String permissionCode, String actionCode) {
        Booking booking = bookingGateway.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在"));
        // One guard combines functional permission, explicit deny and row-level data scope.
        dataPermissionService.requireBooking(AuthContext.current(), booking, permissionCode, actionCode);
        return booking;
    }

    /** Loads and authorizes a booking specifically for a staff workflow. */
    public Booking loadAuthorizedStaff(String bookingId, String permissionCode, String actionCode) {
        AuthPrincipal principal = authAppService.requireAdmin();
        Booking booking = bookingGateway.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("预约不存在"));
        dataPermissionService.requireBooking(principal, booking, permissionCode, actionCode);
        return booking;
    }

    /**
     * Audits the reveal capability once per request for staff principals who hold the
     * {@code customer:reveal_phone} permission, instead of once per booking row.
     */
    public void recordPhoneReveal(String storeId, String resourceId) {
        AuthPrincipal principal = AuthContext.current();
        if (principal.userType() == UserType.CUSTOMER
                || !principal.hasPermission("customer:reveal_phone")) {
            return;
        }
        auditLogService.record("customer:reveal_phone", "booking", resourceId, storeId, Map.of(), Map.of("field", "mobile"));
    }
}
