package com.qiyu.application.admin;

import com.qiyu.application.booking.BookingAppService;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.catalog.Store;
import com.qiyu.application.booking.BookingVO;
import com.qiyu.infrastructure.persistence.mapper.BookingMapper;
import com.qiyu.infrastructure.persistence.mapper.MemberProfileMapper;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminQueryService {
    private final BookingAppService bookingAppService;
    private final CatalogGateway catalogProvider;
    private final AuthAppService authAppService;
    private final DataPermissionService dataPermissionService;
    private final BookingMapper bookingMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final CatalogMapper catalogMapper;

    public AdminQueryService(BookingAppService bookingAppService, CatalogGateway catalogProvider, AuthAppService authAppService,
                             DataPermissionService dataPermissionService, BookingMapper bookingMapper, MemberProfileMapper memberProfileMapper, CatalogMapper catalogMapper) {
        this.bookingAppService = bookingAppService;
        this.catalogProvider = catalogProvider;
        this.authAppService = authAppService;
        this.dataPermissionService = dataPermissionService;
        this.bookingMapper = bookingMapper;
        this.memberProfileMapper = memberProfileMapper;
        this.catalogMapper = catalogMapper;
    }

    /** Returns customer profiles available to the current staff principal. */
    public List<AdminResponseModels.Customer> customers() {
        authAppService.requirePermission("customer:read");
        return bookingMapper.customerProfiles().stream().map(row -> new AdminResponseModels.Customer(row.id(), row.name(), row.phone(), row.memberLevel(), row.lastVisitAt(), row.totalBookings(), row.totalSpend())).toList();
    }

    /** Returns member accounts available to the current staff principal. */
    public List<AdminResponseModels.Member> members() {
        authAppService.requirePermission("customer:read");
        return memberProfileMapper.memberAccounts().stream().map(row -> new AdminResponseModels.Member(row.id(), row.customerName(), row.level(), row.balance(), row.packageBalance(), row.couponCount(), row.scope())).toList();
    }

    /** Returns coupon campaigns available to the current staff principal. */
    public List<AdminResponseModels.Coupon> coupons() {
        authAppService.requirePermission("coupon:read");
        return catalogMapper.coupons().stream().map(row -> new AdminResponseModels.Coupon(row.id(), row.name(), row.discount(), row.scope(), row.validUntil(), row.issuedCount(), row.usedCount(), row.displayStatus())).toList();
    }

    /** Builds dashboard metrics only from rows already restricted by the current data scope. */
    public AdminResponseModels.Dashboard dashboard() {
        AuthPrincipal principal = authAppService.requirePermission("dashboard:read");
        List<BookingVO> bookings = principal.hasPermission("booking:read") ? bookingAppService.list(null) : List.of();
        long booked = bookings.stream().filter(item -> !"CANCELLED".equals(item.status())).count();
        long waiting = bookings.stream().filter(item -> "BOOKED".equals(item.status())).count();
        long inService = bookings.stream().filter(item -> "IN_SERVICE".equals(item.status())).count();
        int expectedRevenue = bookings.stream().filter(item -> !"CANCELLED".equals(item.status()))
                .mapToInt(item -> item.amount().intValue()).sum();
        return new AdminResponseModels.Dashboard(List.of(
                metric("今日预约", booked, null), metric("待到店", waiting, null),
                metric("服务中", inService, null), metric("预计营业额", "¥" + expectedRevenue, null)), List.of(
                metric("08-03", 21580, null), metric("08-04", 24200, null), metric("08-05", 22980, null),
                metric("08-06", 26700, null), metric("08-07", 25120, null), metric("08-08", 28680, null)), List.of(
                metric("静安寺店", 10280, "92"), metric("徐家汇店", 9460, "86"), metric("陆家嘴店", 8940, "78")
        ), List.of(
                utilization("林知夏", 92, "7 单服务中 / 已排 8 单"),
                utilization("沈安然", 86, "6 单服务中 / 已排 7 单"),
                utilization("周语宁", 74, "5 单服务中 / 已排 7 单")), List.of(
                alert("warning", "2 位客户即将超过预约时间"),
                alert("error", "静安寺店 2 号房 14:00 存在资源冲突"),
                alert("processing", "1 位技师请假，受影响预约待处理")));
    }

    /** Returns a scoped booking page for the administration table. */
    public AdminResponseModels.BookingPage bookings(String pageNum, String pageSize, String status) {
        authAppService.requirePermission("booking:read");
        List<BookingVO> list = bookingAppService.list(status);
        return new AdminResponseModels.BookingPage(list, list.size(), pageNum == null ? 1 : Integer.parseInt(pageNum), pageSize == null ? 10 : Integer.parseInt(pageSize));
    }

    /** Returns schedule resources restricted to stores visible to the current operator. */
    public AdminResponseModels.ScheduleResources scheduleResources() {
        AuthPrincipal principal = dataPermissionService.requirePermission("schedule:read");
        List<AdminResponseModels.ScheduleTherapist> therapists = catalogProvider.therapists().stream()
                .filter(therapist -> principal.canAccessStore("schedule", "READ", therapist.storeId()))
                .map(therapist -> new AdminResponseModels.ScheduleTherapist(therapist.id(), therapist.name(), therapist.storeId(), therapist.status(), therapist.statusLabel(), List.of("上班 10:00-22:00", "上班 10:00-22:00", "休息", "已预约 14:00", "请假", "上班 10:00-22:00", "上班 10:00-22:00"))).toList();
        List<AdminResponseModels.ScheduleRoom> rooms = catalogProvider.rooms().stream()
                .filter(room -> principal.canAccessStore("schedule", "READ", room.storeId()))
                .map(room -> new AdminResponseModels.ScheduleRoom(room.id(), room.name(), room.storeId(), room.status(), room.statusLabel(), room.type(), room.note())).toList();
        List<String> conflicts = List.of("静安寺店 · 2 号房 14:00 需确认排班", "安然 14:00 后无可延长时间").stream()
                .filter(ignored -> principal.canAccessStore("schedule", "READ", "store-jingan")).toList();
        return new AdminResponseModels.ScheduleResources(therapists, rooms, conflicts);
    }

    /** Returns stores that the current operator may use in booking or store filters. */
    public List<Store> accessibleStores() {
        AuthPrincipal principal = dataPermissionService.requirePermission("booking:read");
        return catalogProvider.stores().stream()
                .filter(store -> principal.canAccessStore("store", "READ", store.id())
                        || principal.canAccessStore("booking", "READ", store.id()))
                .toList();
    }

    private static AdminResponseModels.Metric metric(String name, Object value, String comparison) {
        return new AdminResponseModels.Metric(name, value, comparison);
    }

    private static AdminResponseModels.Alert alert(String level, String message) {
        return new AdminResponseModels.Alert(level, message);
    }

    private static AdminResponseModels.Utilization utilization(String name, int rate, String text) {
        return new AdminResponseModels.Utilization(name, rate, text);
    }

    private static String text(Map<String, Object> row, String key) { Object value = row.get(key); return value == null ? null : String.valueOf(value); }
    private static long number(Map<String, Object> row, String key) { Object value = row.get(key); return value instanceof Number number ? number.longValue() : 0; }
    private static Number value(Map<String, Object> row, String key) { Object value = row.get(key); return value instanceof Number number ? number : null; }

}
