package com.qiyu.application.admin.dto;

import java.math.BigDecimal;
import java.util.List;

/** Query contracts for administration; existing mini-program contracts remain unchanged. */
public final class ManagementModels {
    private ManagementModels() {}
    public record Query(String keyword, String storeId, String status, String category, String level,
                        String region, Boolean enabled, String startDate, String endDate,
                        Integer pageNum, Integer pageSize, String sort, String order, String customerId) {
        public int page() { return pageNum == null ? 1 : pageNum; }
        public int size() { return pageSize == null ? 20 : pageSize; }
        public void validate() { if (page()<1 || size()<1 || size()>200) throw new IllegalArgumentException("分页范围无效"); }
    }
    public record Page<T>(List<T> list, long total, int pageNum, int pageSize) {}
    public record Option(String value, String label) {}
    public record Customer(String id, String memberId, String name, String phone, String memberLevel,
                           String lastVisitAt, long totalBookings, BigDecimal totalSpend,
                           BigDecimal balance, int packageBalance, int couponCount) {}
    public record Ledger(String id, String type, BigDecimal amount, BigDecimal balanceAfter,
                         String remark, String operator, String createdAt) {}
    public record CouponRecord(String id, String customerId, String name, String status,
                               String validStartAt, String validEndAt, String usedAt, String bookingId) {}
    public record Metric(String id, String name, long bookingCount, long completedCount,
                         BigDecimal revenue, BigDecimal completionRate, BigDecimal averageTicket) {}
    public record Analytics(Metric summary, List<Metric> trend, Page<Metric> stores,
                            String updatedAt, String definition) {}
}
