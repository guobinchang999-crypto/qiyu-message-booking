package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/** Reads coupon ownership and validity without exposing persistence details to booking use cases. */
public interface CouponEligibilityMapper {
    @Select("""
            SELECT cc.coupon_no, ct.coupon_name, ct.discount_type, COALESCE(ct.discount_amount, 0) AS discount_amount,
                   COALESCE(ct.discount_percent, 0) AS discount_percent, ct.threshold_amount
            FROM customer_coupon cc
            JOIN coupon_template ct ON ct.id = cc.coupon_template_id AND ct.deleted = 0 AND ct.status = 'ACTIVE'
            WHERE cc.customer_id = #{customerId} AND cc.coupon_no = #{couponNo}
              AND cc.status = 'UNUSED' AND cc.deleted = 0
              AND cc.valid_start_at <= CURRENT_TIMESTAMP AND cc.valid_end_at > CURRENT_TIMESTAMP
              AND ct.valid_start_at <= CURRENT_TIMESTAMP AND ct.valid_end_at > CURRENT_TIMESTAMP
            LIMIT 1
            """)
    ApplicableCouponRow findApplicable(@Param("customerId") long customerId, @Param("couponNo") String couponNo);
}
