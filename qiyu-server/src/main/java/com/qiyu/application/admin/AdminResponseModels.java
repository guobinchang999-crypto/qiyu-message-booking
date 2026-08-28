package com.qiyu.application.admin;

import com.qiyu.application.booking.BookingVO;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Typed administration read models. */
public final class AdminResponseModels {
    private AdminResponseModels() {}
    public record Metric(String name, Object value, String comparison) {}
    public record Utilization(String name, int rate, String text) {}
    public record Alert(String level, String message) {}
    public record Dashboard(List<Metric> statistics, List<Metric> revenueTrend, List<Metric> storeRanking,
                            List<Utilization> therapistUtilization, List<Alert> alerts) {}
    public record BookingPage(List<BookingVO> list, long total, int pageNum, int pageSize) {}
    public record Customer(String id, String name, String phone, String memberLevel,
                           String lastVisitAt, long totalBookings, Number totalSpend) {}
    public record Member(String id, String customerName, String level, Number balance,
                         Number packageBalance, long couponCount, String scope) {}
    public record Coupon(String id, String name, String discount, String scope, String validUntil,
                         long issuedCount, long usedCount, String displayStatus) {}
    public record ScheduleResources(List<ScheduleTherapist> therapistSchedules, List<ScheduleRoom> rooms,
                                    List<String> conflicts) {}
    public record ScheduleTherapist(String id, String name, String storeId, String status,
                                    String statusLabel, List<String> week) {}
    public record ScheduleRoom(String id, String name, String storeId, String status,
                               String statusLabel, String type, String note) {}
}
