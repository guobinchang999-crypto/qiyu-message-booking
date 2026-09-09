package com.qiyu.application.admin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Outbound read port for operational administration data.
 *
 * <p>The application layer passes only a server-resolved access scope. Infrastructure is
 * responsible for applying that scope to every SQL aggregation.</p>
 */
public interface AdminOperationsReadRepository {
    /** Loads store profiles after applying the server-resolved store READ scope. */
    List<StoreSnapshot> stores(StoreAccess access);

    /** Aggregates operating results inside the inclusive reporting period and report READ scope. */
    List<BusinessReportSnapshot> businessReports(StoreAccess access, LocalDate startDate, LocalDate endDate);

    /** Loads therapist administration rows and today's scoped booking counts. */
    List<TherapistProfileSnapshot> therapists(StoreAccess access);

    DashboardSnapshot dashboard(StoreAccess access);

    ScheduleSnapshot schedule(StoreAccess access, LocalDate weekStart, LocalDate weekEnd);

    record StoreAccess(boolean allStores, Set<String> storeIds, String therapistId) {
        private static final String NO_ACCESS_STORE = "__NO_ACCESS_STORE__";

        public StoreAccess {
            storeIds = storeIds == null || storeIds.isEmpty() ? Set.of(NO_ACCESS_STORE) : Set.copyOf(storeIds);
            therapistId = therapistId == null || therapistId.isBlank() ? null : therapistId;
        }

        /** Convenience constructor for resources that only support store-based scopes. */
        public StoreAccess(boolean allStores, Set<String> storeIds) {
            this(allStores, storeIds, null);
        }
    }

    record StoreSnapshot(String id, String code, Long regionId, String name, String phone, String province,
                         String city, String district, String address, BigDecimal longitude, BigDecimal latitude,
                         String businessHours, String manager, String managerPosition, String managerMobile,
                         long roomCount, long therapistCount, String status,
                         BigDecimal rating, Integer sortOrder, Boolean enabled) {
    }

    record BusinessReportSnapshot(String id, String store, long bookingCount, BigDecimal completionRate,
                                  BigDecimal revenue, BigDecimal averageTicket, String topService) {
        public BusinessReportSnapshot {
            completionRate = completionRate == null ? BigDecimal.ZERO : completionRate;
            revenue = revenue == null ? BigDecimal.ZERO : revenue;
            averageTicket = averageTicket == null ? BigDecimal.ZERO : averageTicket;
        }
    }

    record TherapistProfileSnapshot(String id, String name, String store, String level, List<String> skills,
                                     String status, BigDecimal rating, long todayBookings, String code,
                                     String storeId, String mobile, BigDecimal specifyFee, boolean enabled) {
        public TherapistProfileSnapshot {
            skills = List.copyOf(skills);
            rating = rating == null ? BigDecimal.ZERO : rating;
        }
    }

    record DashboardSnapshot(long bookingCount, long waitingCount, long inServiceCount,
                             BigDecimal expectedRevenue, List<MetricSnapshot> revenueTrend,
                             List<MetricSnapshot> storeRanking, List<UtilizationSnapshot> therapistUtilization,
                             List<ConflictSnapshot> conflicts) {
        public DashboardSnapshot {
            expectedRevenue = expectedRevenue == null ? BigDecimal.ZERO : expectedRevenue;
            revenueTrend = List.copyOf(revenueTrend);
            storeRanking = List.copyOf(storeRanking);
            therapistUtilization = List.copyOf(therapistUtilization);
            conflicts = List.copyOf(conflicts);
        }
    }

    record MetricSnapshot(String name, BigDecimal value, String comparison) {
        public MetricSnapshot {
            value = value == null ? BigDecimal.ZERO : value;
        }
    }

    record UtilizationSnapshot(String name, long bookingCount, long scheduledMinutes, long bookedMinutes) {
    }

    record ConflictSnapshot(String storeName, String resourceName, String conflictAt) {
    }

    record ScheduleSnapshot(List<TherapistSnapshot> therapists, List<ScheduleEntrySnapshot> entries,
                            List<RoomSnapshot> rooms, List<ConflictSnapshot> conflicts) {
        public ScheduleSnapshot {
            therapists = List.copyOf(therapists);
            entries = List.copyOf(entries);
            rooms = List.copyOf(rooms);
            conflicts = List.copyOf(conflicts);
        }
    }

    record TherapistSnapshot(String id, String name, String storeId, String status, String statusLabel,
                             List<String> skills) {
        public TherapistSnapshot {
            skills = List.copyOf(skills);
        }
    }

    record ScheduleEntrySnapshot(String therapistId, LocalDate workDate, String startTime, String endTime,
                                 String status, String remark) {
    }

    record RoomSnapshot(String id, String name, String storeId, String status, String statusLabel,
                        String type, String note) {
    }
}
