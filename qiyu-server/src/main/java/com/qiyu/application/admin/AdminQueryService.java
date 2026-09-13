package com.qiyu.application.admin;

import com.qiyu.application.admin.dto.AdminResponseModels;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.DataPermissionService;
import com.qiyu.application.booking.BookingQueryService;
import com.qiyu.application.booking.dto.BookingVO;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.infrastructure.persistence.mapper.BookingMapper;
import com.qiyu.infrastructure.persistence.mapper.MemberProfileMapper;
import com.qiyu.infrastructure.persistence.mapper.CatalogMapper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminQueryService {
    private final CatalogGateway catalogProvider;
    private final AuthAppService authAppService;
    private final DataPermissionService dataPermissionService;
    private final BookingMapper bookingMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final CatalogMapper catalogMapper;
    private final ObjectProvider<AdminOperationsReadRepository> operationsReadRepository;
    private final BookingQueryService bookingQueryService;

    public AdminQueryService(CatalogGateway catalogProvider, AuthAppService authAppService,
                             DataPermissionService dataPermissionService, BookingMapper bookingMapper,
                             MemberProfileMapper memberProfileMapper, CatalogMapper catalogMapper,
                             ObjectProvider<AdminOperationsReadRepository> operationsReadRepository,
                             BookingQueryService bookingQueryService) {
        this.catalogProvider = catalogProvider;
        this.authAppService = authAppService;
        this.dataPermissionService = dataPermissionService;
        this.bookingMapper = bookingMapper;
        this.memberProfileMapper = memberProfileMapper;
        this.catalogMapper = catalogMapper;
        this.operationsReadRepository = operationsReadRepository;
        this.bookingQueryService = bookingQueryService;
    }

    /** Returns customer profiles available to the current staff principal. */
    public List<AdminResponseModels.Customer> customers() {
        AuthPrincipal principal = authAppService.requirePermission("customer:read");
        AdminOperationsReadRepository.StoreAccess access = storeAccess(principal, "customer", "READ");
        boolean revealPhone = principal.hasPermission("customer:reveal_phone");
        return bookingMapper.customerProfiles(access.allStores(), access.storeIds(), principal.therapistId()).stream()
                .map(row -> new AdminResponseModels.Customer(row.id(), row.name(),
                        revealPhone ? row.phone() : maskPhone(row.phone()), row.memberLevel(), row.lastVisitAt(),
                        row.totalBookings(), row.totalSpend())).toList();
    }

    /** Returns member accounts available to the current staff principal. */
    public List<AdminResponseModels.Member> members() {
        AuthPrincipal principal = authAppService.requirePermission("member:read");
        AdminOperationsReadRepository.StoreAccess access = storeAccess(principal, "member", "READ");
        return memberProfileMapper.memberAccounts(access.allStores(), access.storeIds(), principal.therapistId()).stream()
                .map(row -> new AdminResponseModels.Member(row.id(), row.customerName(), row.level(), row.balance(),
                        row.packageBalance(), row.couponCount(), row.scope())).toList();
    }

    /** Returns coupon campaigns available to the current staff principal. */
    public List<AdminResponseModels.Coupon> coupons() {
        authAppService.requirePermission("coupon:read");
        return catalogMapper.coupons().stream().map(row -> new AdminResponseModels.Coupon(row.id(), row.name(), row.discount(), row.scope(), row.validUntil(), row.issuedCount(), row.usedCount(), row.displayStatus())).toList();
    }

    /** Returns real store profiles limited by the principal's store READ data scope. */
    public List<AdminResponseModels.StoreProfile> stores() {
        AuthPrincipal principal = dataPermissionService.requirePermission("store:read");
        AdminOperationsReadRepository repository = operationsReadRepository.getIfAvailable();
        if (repository == null) {
            return List.of();
        }
        return repository.stores(storeAccess(principal, "store", "READ")).stream()
                .map(row -> new AdminResponseModels.StoreProfile(row.id(), row.code(), row.regionId(), row.name(),
                        row.phone(), row.province(), row.city(), row.district(), row.address(), row.longitude(),
                        row.latitude(), row.businessHours(), row.manager(), row.managerPosition(), row.managerMobile(),
                        row.roomCount(), row.therapistCount(),
                        row.status(), row.rating(), row.sortOrder(), row.enabled()))
                .toList();
    }

    /**
     * Returns store-level operating results for an inclusive date range after applying the
     * principal's report READ data scope. Request dates can narrow time, never store access.
     */
    public List<AdminResponseModels.BusinessReport> businessReports(LocalDate startDate, LocalDate endDate) {
        AuthPrincipal principal = dataPermissionService.requirePermission("report:read");
        LocalDate resolvedStart = startDate == null ? LocalDate.now() : startDate;
        LocalDate resolvedEnd = endDate == null ? resolvedStart : endDate;
        if (resolvedEnd.isBefore(resolvedStart)) {
            throw new IllegalArgumentException("报表结束日期不能早于开始日期");
        }
        AdminOperationsReadRepository repository = operationsReadRepository.getIfAvailable();
        if (repository == null) {
            return List.of();
        }
        return repository.businessReports(storeAccess(principal, "report", "READ"), resolvedStart, resolvedEnd).stream()
                .map(row -> new AdminResponseModels.BusinessReport(row.id(), row.store(), row.bookingCount(),
                        row.completionRate(), row.revenue(), row.averageTicket(), row.topService()))
                .toList();
    }

    /** Returns therapist rows and today's booking load inside the effective therapist READ scope. */
    public List<AdminResponseModels.TherapistProfile> therapists() {
        AuthPrincipal principal = dataPermissionService.requirePermission("therapist:read");
        AdminOperationsReadRepository repository = operationsReadRepository.getIfAvailable();
        if (repository == null) {
            return List.of();
        }
        return repository.therapists(storeAccess(principal, "therapist", "READ")).stream()
                .map(row -> new AdminResponseModels.TherapistProfile(row.id(), row.name(), row.store(), row.level(),
                        row.skills(), row.status(), row.rating(), row.todayBookings(), row.code(), row.storeId(),
                        row.mobile(), row.specifyFee(), row.enabled()))
                .toList();
    }

    /** Builds dashboard metrics only from rows already restricted by the current data scope. */
    public AdminResponseModels.Dashboard dashboard() {
        AuthPrincipal principal = authAppService.requirePermission("dashboard:read");
        // The dashboard aggregates operations in the same all/primary-store/region boundary as
        // business reports, so it reuses the report data scope (no separate "dashboard" scope exists).
        AdminOperationsReadRepository.DashboardSnapshot snapshot = operationsReadRepository.getIfAvailable() == null
                ? emptyDashboard() : operationsReadRepository.getObject().dashboard(storeAccess(principal, "report", "READ"));
        return new AdminResponseModels.Dashboard(List.of(
                statistic("今日预约", snapshot.bookingCount() + " 单"),
                statistic("待到店", snapshot.waitingCount() + " 单"),
                statistic("服务中", snapshot.inServiceCount() + " 单"),
                statistic("预计营业额", money(snapshot.expectedRevenue()))),
                snapshot.revenueTrend().stream().map(AdminQueryService::metric).toList(),
                snapshot.storeRanking().stream().map(AdminQueryService::metric).toList(),
                snapshot.therapistUtilization().stream().map(AdminQueryService::utilization).toList(),
                snapshot.conflicts().stream().map(AdminQueryService::conflictAlert).toList());
    }

    /** Returns a scoped booking page for the administration table. */
    public AdminResponseModels.BookingPage bookings(String pageNum, String pageSize, String status) {
        authAppService.requirePermission("booking:read");
        List<BookingVO> list = bookingQueryService.list(status);
        int page = pageNum == null ? 1 : Integer.parseInt(pageNum);
        int size = pageSize == null ? 10 : Integer.parseInt(pageSize);
        if (page < 1 || size < 1 || size > 200) throw new IllegalArgumentException("分页范围无效");
        return new AdminResponseModels.BookingPage(list.stream().skip((long)(page-1)*size).limit(size).toList(), list.size(), page, size);
    }

    /** Returns schedule resources restricted to stores visible to the current operator. */
    public AdminResponseModels.ScheduleResources scheduleResources() {
        AuthPrincipal principal = dataPermissionService.requirePermission("schedule:read");
        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);
        AdminOperationsReadRepository.ScheduleSnapshot snapshot = operationsReadRepository.getIfAvailable() == null
                ? emptySchedule() : operationsReadRepository.getObject().schedule(storeAccess(principal, "schedule", "READ"), weekStart, weekEnd);
        Map<String, List<AdminOperationsReadRepository.ScheduleEntrySnapshot>> entriesByTherapist = snapshot.entries().stream()
                .collect(Collectors.groupingBy(AdminOperationsReadRepository.ScheduleEntrySnapshot::therapistId));
        List<AdminResponseModels.ScheduleTherapist> therapists = snapshot.therapists().stream()
                .filter(therapist -> entriesByTherapist.containsKey(therapist.id()))
                .map(therapist -> new AdminResponseModels.ScheduleTherapist(therapist.id(), therapist.name(), therapist.storeId(),
                        therapist.status(), therapist.statusLabel(), therapist.skills(),
                        weekEntries(entriesByTherapist.get(therapist.id()), weekStart)))
                .toList();
        List<AdminResponseModels.ScheduleRoom> rooms = snapshot.rooms().stream()
                .map(room -> new AdminResponseModels.ScheduleRoom(room.id(), room.name(), room.storeId(), room.status(),
                        room.statusLabel(), room.type(), room.note())).toList();
        List<String> conflicts = snapshot.conflicts().stream().map(AdminQueryService::conflictText).toList();
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

    private static AdminOperationsReadRepository.StoreAccess storeAccess(AuthPrincipal principal, String resource, String action) {
        var scope = principal.scopeFor(resource, action);
        String therapistId = scope.scopeTypes().contains(DataScopeType.SELF) ? principal.therapistId() : null;
        return new AdminOperationsReadRepository.StoreAccess(scope.allowsAllStores(), scope.storeIds(), therapistId);
    }

    private static AdminOperationsReadRepository.DashboardSnapshot emptyDashboard() {
        return new AdminOperationsReadRepository.DashboardSnapshot(0, 0, 0, BigDecimal.ZERO,
                List.of(), List.of(), List.of(), List.of());
    }

    private static AdminOperationsReadRepository.ScheduleSnapshot emptySchedule() {
        return new AdminOperationsReadRepository.ScheduleSnapshot(List.of(), List.of(), List.of(), List.of());
    }

    private static AdminResponseModels.Statistic statistic(String name, String value) {
        return new AdminResponseModels.Statistic(name, value, null);
    }

    private static AdminResponseModels.Metric metric(AdminOperationsReadRepository.MetricSnapshot value) {
        return new AdminResponseModels.Metric(value.name(), value.value(), value.comparison());
    }

    private static AdminResponseModels.Utilization utilization(AdminOperationsReadRepository.UtilizationSnapshot value) {
        int rate = value.scheduledMinutes() == 0 ? 0
                : BigDecimal.valueOf(value.bookedMinutes()).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(value.scheduledMinutes()), 0, RoundingMode.HALF_UP).min(BigDecimal.valueOf(100)).intValue();
        return new AdminResponseModels.Utilization(value.name(), rate,
                value.bookingCount() + " 单已排 / " + value.scheduledMinutes() + " 分钟");
    }

    private static AdminResponseModels.Alert conflictAlert(AdminOperationsReadRepository.ConflictSnapshot value) {
        return new AdminResponseModels.Alert("error", conflictText(value));
    }

    private static String conflictText(AdminOperationsReadRepository.ConflictSnapshot value) {
        String time = value.conflictAt() == null ? "" : " " + value.conflictAt();
        return value.storeName() + " · " + value.resourceName() + time + " 存在资源冲突";
    }

    private static List<String> weekEntries(List<AdminOperationsReadRepository.ScheduleEntrySnapshot> entries, LocalDate weekStart) {
        Map<LocalDate, List<AdminOperationsReadRepository.ScheduleEntrySnapshot>> entriesByDate = entries.stream()
                .collect(Collectors.groupingBy(AdminOperationsReadRepository.ScheduleEntrySnapshot::workDate));
        List<String> values = new ArrayList<>(7);
        for (int offset = 0; offset < 7; offset++) {
            List<AdminOperationsReadRepository.ScheduleEntrySnapshot> dayEntries = entriesByDate.getOrDefault(weekStart.plusDays(offset), List.of());
            values.add(dayEntries.stream().sorted(Comparator.comparing(AdminOperationsReadRepository.ScheduleEntrySnapshot::startTime))
                    .map(AdminQueryService::scheduleLabel).collect(Collectors.joining(" / ")));
        }
        return List.copyOf(values);
    }

    private static String scheduleLabel(AdminOperationsReadRepository.ScheduleEntrySnapshot entry) {
        String label = switch (entry.status()) {
            case "WORK" -> "上班";
            case "REST" -> "休息";
            case "LEAVE" -> "请假";
            default -> entry.status();
        };
        if (entry.startTime() == null || entry.endTime() == null) {
            return label;
        }
        return label + " " + entry.startTime() + "-" + entry.endTime();
    }

    private static String money(BigDecimal value) {
        return "¥" + value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    /** Masks customer mobile numbers unless a separate field permission grants disclosure. */
    private static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

}
