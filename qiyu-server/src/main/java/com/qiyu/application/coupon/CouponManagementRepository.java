package com.qiyu.application.coupon;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** Persistence port for coupon-template administration. */
public interface CouponManagementRepository {
    List<CouponTemplate> list();
    Optional<CouponTemplate> find(String couponId);
    boolean codeExists(String code);
    CouponTemplate save(CouponTemplate template);
    long customerCouponCount(long databaseId);
    void delete(long databaseId);

    record CouponTemplate(Long databaseId, String id, String code, String name, String discountType,
                          BigDecimal discountAmount, BigDecimal discountPercent, BigDecimal thresholdAmount,
                          LocalDateTime validStartAt, LocalDateTime validEndAt, int issuedCount, int usedCount,
                          String status, String createdBy, String updatedBy) {}
}
