package com.qiyu.application.admin.dto;

import com.qiyu.application.booking.dto.BookingVO;
import java.math.BigDecimal;
import java.util.List;

/** Typed administration read models. */
public final class AdminResponseModels {
    private AdminResponseModels() {}
    public record Statistic(String name, String value, String comparison) {}
    public record Metric(String name, BigDecimal value, String comparison) {}
    public record Utilization(String name, int rate, String text) {}
    public record Alert(String level, String message) {}
    public record Dashboard(List<Statistic> statistics, List<Metric> revenueTrend, List<Metric> storeRanking,
                            List<Utilization> therapistUtilization, List<Alert> alerts) {}
    public record BookingPage(List<BookingVO> list, long total, int pageNum, int pageSize) {}
    public record Customer(String id, String name, String phone, String memberLevel,
                           String lastVisitAt, long totalBookings, Number totalSpend) {}
    public record Member(String id, String customerName, String level, Number balance,
                         Number packageBalance, long couponCount, String scope) {}
    public record Coupon(String id, String name, String discount, String scope, String validUntil,
                         long issuedCount, long usedCount, String displayStatus) {}
    public record StoreProfile(String id, String code, Long regionId, String name, String phone, String province,
                               String city, String district, String address, BigDecimal longitude,
                               BigDecimal latitude, String businessHours, String manager, String managerPosition,
                               String managerMobile, long roomCount,
                               long therapistCount, String status, BigDecimal rating, Integer sortOrder,
                               Boolean enabled) {}
    public record BusinessReport(String id, String store, long bookingCount, BigDecimal completionRate,
                                 BigDecimal revenue, BigDecimal averageTicket, String topService) {}
    public record TherapistProfile(String id, String name, String store, String level, List<String> skills,
                                   String status, BigDecimal rating, long todayBookings, String code,
                                   String storeId, String mobile, BigDecimal specifyFee, boolean enabled) {}
    public record ScheduleResources(List<ScheduleTherapist> therapistSchedules, List<ScheduleRoom> rooms,
                                    List<String> conflicts) {}
    public record ScheduleTherapist(String id, String name, String storeId, String status,
                                    String statusLabel, List<String> skills, List<String> week) {}
    public record ScheduleRoom(String id, String name, String storeId, String status,
                               String statusLabel, String type, String note) {}
}
