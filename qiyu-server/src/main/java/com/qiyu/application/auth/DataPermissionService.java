package com.qiyu.application.auth;

import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.auth.UserType;
import com.qiyu.domain.booking.Booking;
import org.springframework.stereotype.Service;

/**
 * Applies functional and row-level authorization to business data.
 * Request parameters may narrow a query but must never expand the server-resolved scope.
 */
@Service
public class DataPermissionService {
    public AuthPrincipal requirePermission(String permissionCode) {
        AuthPrincipal principal = AuthContext.current();
        if (!principal.hasPermission(permissionCode)) {
            throw new SecurityException("没有权限执行该操作");
        }
        return principal;
    }

    public boolean canAccessBooking(AuthPrincipal principal, Booking booking, String actionCode) {
        // Customers are isolated by customer ownership; staff are filtered by store or therapist ownership.
        if (principal.userType() == UserType.CUSTOMER) {
            return booking.customerId().equals(principal.customerId());
        }
        DataAccessScope scope = principal.scopeFor("booking", actionCode);
        return scope.allowsStore(booking.storeId())
                || (scope.allowsSelf() && principal.therapistId() != null && principal.therapistId().equals(booking.therapistId()));
    }

    public void requireBooking(AuthPrincipal principal, Booking booking, String permissionCode, String actionCode) {
        // Both dimensions are mandatory: a function permission never bypasses the applicable data scope.
        if (!principal.hasPermission(permissionCode) || !canAccessBooking(principal, booking, actionCode)) {
            throw new SecurityException("没有权限访问该预约");
        }
    }

    public boolean canRevealCustomerPhone(AuthPrincipal principal, Booking booking) {
        return principal.userType() == UserType.CUSTOMER && booking.customerId().equals(principal.customerId())
                || principal.hasPermission("customer:reveal_phone");
    }
}
