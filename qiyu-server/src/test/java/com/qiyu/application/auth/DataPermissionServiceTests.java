package com.qiyu.application.auth;

import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.domain.auth.UserType;
import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class DataPermissionServiceTests {
    private final DataPermissionService service = new DataPermissionService();
    private final Booking jinganBooking = new Booking("BK-1", "store-jingan", "service-neck", "therapist-anran", "room-1",
            "林女士", "13800001234", "customer-1", LocalDate.of(2026, 8, 8), LocalTime.of(10, 0), 60, BookingStatus.BOOKED);

    @Test
    void employeeCanOnlyReadOwnTherapistBookings() {
        AuthPrincipal employee = principal("therapist-anran", Set.of("booking:read"), Set.of(),
                scope("booking", "READ", DataScopeType.SELF, Set.of()));
        AuthPrincipal anotherEmployee = principal("therapist-other", Set.of("booking:read"), Set.of(),
                scope("booking", "READ", DataScopeType.SELF, Set.of()));

        assertThat(service.canAccessBooking(employee, jinganBooking, "READ")).isTrue();
        assertThat(service.canAccessBooking(anotherEmployee, jinganBooking, "READ")).isFalse();
    }

    @Test
    void assignedStoreScopeCannotExpandToAnotherStore() {
        AuthPrincipal manager = principal(null, Set.of("booking:read"), Set.of(),
                scope("booking", "READ", DataScopeType.ASSIGNED_STORES, Set.of("store-xujiahui")));

        assertThat(service.canAccessBooking(manager, jinganBooking, "READ")).isFalse();
    }

    @Test
    void explicitDenyWinsOverRolePermission() {
        AuthPrincipal deniedManager = principal(null, Set.of("booking:read", "customer:reveal_phone"), Set.of("customer:reveal_phone"),
                scope("booking", "READ", DataScopeType.ALL_STORES, Set.of()));

        assertThat(deniedManager.hasPermission("customer:reveal_phone")).isFalse();
        assertThat(service.canRevealCustomerPhone(deniedManager, jinganBooking)).isFalse();
    }

    @Test
    void primaryStoreManagerCanReadOwnStoreBookingDetail() {
        AuthPrincipal manager = principal(null, Set.of("booking:read"), Set.of(),
                scope("booking", "READ", DataScopeType.PRIMARY_STORE, Set.of("store-jingan")));

        assertThat(service.canAccessBooking(manager, jinganBooking, "READ")).isTrue();
    }

    @Test
    void primaryStoreManagerCannotReadCrossStoreBookingDetail() {
        AuthPrincipal manager = principal(null, Set.of("booking:read"), Set.of(),
                scope("booking", "READ", DataScopeType.PRIMARY_STORE, Set.of("store-xujiahui")));

        assertThat(service.canAccessBooking(manager, jinganBooking, "READ")).isFalse();
    }

    @Test
    void selfScopedTherapistCannotReadBookingOfAnotherTherapistForReports() {
        AuthPrincipal therapist = principal("therapist-other", Set.of("booking:read", "report:read"), Set.of(),
                scope("booking", "READ", DataScopeType.SELF, Set.of()));

        assertThat(service.canAccessBooking(therapist, jinganBooking, "READ")).isFalse();
    }

    @Test
    void missingScopeFailsClosedInsteadOfGrantingAccess() {
        AuthPrincipal manager = principal(null, Set.of("booking:read"), Set.of(), DataAccessScope.none("booking", "READ"));

        assertThat(service.canAccessBooking(manager, jinganBooking, "READ")).isFalse();
    }

    @Test
    void managerWithoutRevealPermissionSeesMaskedPhone() {
        AuthPrincipal manager = principal(null, Set.of("booking:read"), Set.of(),
                scope("booking", "READ", DataScopeType.ALL_STORES, Set.of()));

        assertThat(service.canRevealCustomerPhone(manager, jinganBooking)).isFalse();
    }

    @Test
    void managerWithRevealPermissionSeesFullPhone() {
        AuthPrincipal manager = principal(null, Set.of("booking:read", "customer:reveal_phone"), Set.of(),
                scope("booking", "READ", DataScopeType.ALL_STORES, Set.of()));

        assertThat(service.canRevealCustomerPhone(manager, jinganBooking)).isTrue();
    }

    @Test
    void customerCanRevealOwnPhoneButNotAnotherCustomers() {
        AuthPrincipal owner = new AuthPrincipal(9002L, UserType.CUSTOMER, "customer-1", null, Set.of(),
                Set.of(), DataScopeType.SELF, Set.of(), Set.of(), List.of(), Set.of(), "顾客甲", null);
        AuthPrincipal stranger = new AuthPrincipal(9003L, UserType.CUSTOMER, "customer-2", null, Set.of(),
                Set.of(), DataScopeType.SELF, Set.of(), Set.of(), List.of(), Set.of(), "顾客乙", null);

        assertThat(owner.hasPermission("customer:reveal_phone")).isFalse();
        assertThat(service.canRevealCustomerPhone(owner, jinganBooking)).isTrue();
        assertThat(service.canRevealCustomerPhone(stranger, jinganBooking)).isFalse();
    }

    private static AuthPrincipal principal(String therapistId, Set<String> permissions, Set<String> denied, DataAccessScope scope) {
        return new AuthPrincipal(9001L, UserType.STAFF, null, therapistId, Set.of("TEST"), permissions,
                scope.scopeTypes().iterator().next(), scope.storeIds(), scope.regionIds(), List.of(scope), denied, "测试人员", null);
    }

    private static DataAccessScope scope(String resource, String action, DataScopeType type, Set<String> stores) {
        return new DataAccessScope(resource, action, Set.of(type), stores, Set.of());
    }
}
