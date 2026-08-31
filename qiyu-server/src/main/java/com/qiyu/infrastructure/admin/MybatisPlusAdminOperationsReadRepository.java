package com.qiyu.infrastructure.admin;

import com.qiyu.application.admin.AdminOperationsReadRepository;
import com.qiyu.infrastructure.persistence.mapper.AdminDashboardTotalsRow;
import com.qiyu.infrastructure.persistence.mapper.AdminOperationsMapper;
import com.qiyu.infrastructure.persistence.mapper.AdminScheduleEntryRow;
import com.qiyu.infrastructure.persistence.mapper.AdminScheduleRoomRow;
import com.qiyu.infrastructure.persistence.mapper.AdminScheduleTherapistRow;
import com.qiyu.infrastructure.persistence.mapper.AdminTherapistUtilizationRow;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

/** MyBatis implementation of the administration operational read port. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusAdminOperationsReadRepository implements AdminOperationsReadRepository {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final AdminOperationsMapper mapper;

    public MybatisPlusAdminOperationsReadRepository(AdminOperationsMapper mapper) {
        this.mapper = mapper;
    }

    /** Maps the scoped store query projections to the application read port. */
    @Override
    public List<StoreSnapshot> stores(StoreAccess access) {
        return mapper.stores(access.allStores(), access.storeIds()).stream()
                .map(row -> new StoreSnapshot(row.id(), row.code(), row.regionId(), row.name(), row.phone(),
                        row.province(), row.city(), row.district(), row.address(), row.longitude(), row.latitude(),
                        row.businessHours(), row.manager(), row.roomCount(), row.therapistCount(), row.status(),
                        row.rating(), row.sortOrder(), row.enabled()))
                .toList();
    }

    /** Maps scoped booking aggregates without changing their accounting meaning. */
    @Override
    public List<BusinessReportSnapshot> businessReports(StoreAccess access, LocalDate startDate, LocalDate endDate) {
        return mapper.businessReports(access.allStores(), access.storeIds(), startDate, endDate).stream()
                .map(row -> new BusinessReportSnapshot(row.id(), row.store(), row.bookingCount(),
                        row.completionRate(), row.revenue(), row.averageTicket(), row.topService()))
                .toList();
    }

    /** Maps scoped therapist projections and preserves the database booking-count meaning. */
    @Override
    public List<TherapistProfileSnapshot> therapists(StoreAccess access) {
        return mapper.therapistProfiles(access.allStores(), access.storeIds(), access.therapistId()).stream()
                .map(row -> new TherapistProfileSnapshot(row.id(), row.name(), row.store(), row.level(),
                        skills(row.skills()), row.status(), row.rating(), row.todayBookings(), row.code(),
                        row.storeId(), row.mobile(), row.specifyFee(), row.enabled()))
                .toList();
    }

    /** Loads all dashboard aggregates with the same resolved store boundary. */
    @Override
    public DashboardSnapshot dashboard(StoreAccess access) {
        AdminDashboardTotalsRow totals = mapper.dashboardTotals(access.allStores(), access.storeIds());
        AdminDashboardTotalsRow resolvedTotals = totals == null
                ? new AdminDashboardTotalsRow(0, 0, 0, BigDecimal.ZERO) : totals;
        return new DashboardSnapshot(resolvedTotals.bookingCount(), resolvedTotals.waitingCount(),
                resolvedTotals.inServiceCount(), resolvedTotals.expectedRevenue(),
                mapper.revenueTrend(access.allStores(), access.storeIds()).stream()
                        .map(row -> new MetricSnapshot(row.name(), row.value(), row.comparison())).toList(),
                mapper.storeRanking(access.allStores(), access.storeIds()).stream()
                        .map(row -> new MetricSnapshot(row.name(), row.value(), row.comparison())).toList(),
                mapper.therapistUtilization(access.allStores(), access.storeIds()).stream()
                        .map(MybatisPlusAdminOperationsReadRepository::utilization).toList(),
                mapper.resourceConflicts(access.allStores(), access.storeIds()).stream()
                        .map(row -> new ConflictSnapshot(row.storeName(), row.resourceName(),
                                row.conflictAt() == null ? null : row.conflictAt().toString())).toList());
    }

    /** Loads the actual calendar-week schedule instead of inventing a seven-day roster. */
    @Override
    public ScheduleSnapshot schedule(StoreAccess access, LocalDate weekStart, LocalDate weekEnd) {
        return new ScheduleSnapshot(
                mapper.scheduleTherapists(access.allStores(), access.storeIds(), access.therapistId()).stream()
                        .map(MybatisPlusAdminOperationsReadRepository::therapist).toList(),
                mapper.scheduleEntries(access.allStores(), access.storeIds(), access.therapistId(), weekStart, weekEnd).stream()
                        .map(MybatisPlusAdminOperationsReadRepository::entry).toList(),
                mapper.scheduleRooms(access.allStores(), access.storeIds()).stream()
                        .map(MybatisPlusAdminOperationsReadRepository::room).toList(),
                mapper.resourceConflicts(access.allStores(), access.storeIds()).stream()
                        .map(row -> new ConflictSnapshot(row.storeName(), row.resourceName(),
                                row.conflictAt() == null ? null : row.conflictAt().toString())).toList());
    }

    private static UtilizationSnapshot utilization(AdminTherapistUtilizationRow row) {
        return new UtilizationSnapshot(row.name(), row.bookingCount(), row.scheduledMinutes(), row.bookedMinutes());
    }

    private static TherapistSnapshot therapist(AdminScheduleTherapistRow row) {
        return new TherapistSnapshot(row.id(), row.name(), row.storeId(), row.status(), row.statusLabel(), skills(row.skills()));
    }

    private static ScheduleEntrySnapshot entry(AdminScheduleEntryRow row) {
        return new ScheduleEntrySnapshot(row.therapistId(), row.workDate(), time(row.startTime()), time(row.endTime()),
                row.status(), row.remark());
    }

    private static RoomSnapshot room(AdminScheduleRoomRow row) {
        return new RoomSnapshot(row.id(), row.name(), row.storeId(), row.status(), row.statusLabel(), row.type(), row.note());
    }

    private static List<String> skills(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(",")).map(String::trim).filter(item -> !item.isEmpty()).toList();
    }

    private static String time(java.time.LocalTime value) {
        return value == null ? null : TIME_FORMATTER.format(value);
    }
}
