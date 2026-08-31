package com.qiyu.domain.coupon.gateway;

import java.math.BigDecimal;
import java.util.Optional;

/** Resolves customer-owned coupons before an amount is presented or a booking is created. */
public interface CouponGateway {
    Optional<ApplicableCoupon> findApplicable(String customerId, String couponNo);

    record ApplicableCoupon(String couponNo, String couponName, String discountType,
                            BigDecimal discountAmount, BigDecimal discountPercent,
                            BigDecimal thresholdAmount) {
        /** Calculates the discount only when the booking subtotal reaches the configured threshold. */
        public BigDecimal discountFor(BigDecimal subtotal) {
            if (subtotal.compareTo(thresholdAmount) < 0) return BigDecimal.ZERO;
            if ("PERCENT".equals(discountType)) {
                return subtotal.multiply(discountPercent).movePointLeft(2).min(subtotal);
            }
            return discountAmount.min(subtotal);
        }
    }
}
