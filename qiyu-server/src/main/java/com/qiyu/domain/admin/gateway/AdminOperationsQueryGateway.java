package com.qiyu.domain.admin.gateway;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface AdminOperationsQueryGateway {
    DashboardData dashboard(StoreAccess access);
    List<StoreData> stores(StoreAccess access);
    List<ServiceData> services(StoreAccess access);
    List<TherapistData> therapists(StoreAccess access);
    List<RoomData> rooms(StoreAccess access);
    List<ScheduleData> schedules(StoreAccess access);
    List<DailyReportData> dailyReport(StoreAccess access, LocalDate startDate, LocalDate endDate);

    record StoreAccess(boolean allStores, Set<String> storeIds) {
        public StoreAccess {
            storeIds = Set.copyOf(storeIds);
        }

        public boolean allows(String storeId) {
            return allStores || storeIds.contains(storeId);
        }
    }

    record DashboardData(
            long bookingCount,
            long waitingCount,
            long inServiceCount,
            BigDecimal expectedRevenue,
            List<MetricData> revenueTrend,
            List<MetricData> storeRanking,
            List<UtilizationData> therapistUtilization,
            List<AlertData> alerts
    ) { }

    record MetricData(String name, Object value, String comparison) { }
    record UtilizationData(String name, int rate, String text) { }
    record AlertData(String level, String message) { }

    record StoreData(String id, String code, String name, String address, String phone, String businessHours,
                     String status, BigDecimal rating, String coverUrl) { }

    record ServiceData(String id, String code, String name, String category, int durationMinutes,
                       BigDecimal price, BigDecimal memberPrice, String status, String coverUrl) { }

    record TherapistData(String id, String code, String storeId, String storeName, String name, String level,
                         String status, BigDecimal rating, int experienceYears, int serviceCount, String portraitUrl) { }

    record RoomData(String id, String code, String storeId, String storeName, String name, String kind,
                    int capacity, String status) { }

    record ScheduleData(String id, String therapistId, String therapistName, String storeId, LocalDate workDate,
                        String startTime, String endTime, String status, String remark) { }

    record DailyReportData(LocalDate statDate, String storeId, String storeName, int bookingCount,
                           int completedOrderCount, int cancelledBookingCount, int checkedInCount,
                           BigDecimal grossAmount, BigDecimal paidAmount, BigDecimal refundAmount,
                           int newCustomerCount, int reviewCount, BigDecimal averageRating) { }
}
