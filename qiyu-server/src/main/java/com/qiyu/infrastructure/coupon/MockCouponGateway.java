package com.qiyu.infrastructure.coupon;

import com.qiyu.domain.coupon.gateway.CouponGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

/** Keeps the explicitly selected Mock profile self-contained without affecting persistence mode. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockCouponGateway implements CouponGateway {
    @Override
    public Optional<ApplicableCoupon> findApplicable(String customerId, String couponNo) {
        if (!"新人体验券 ¥20".equals(couponNo)) return Optional.empty();
        return Optional.of(new ApplicableCoupon(couponNo, couponNo, "AMOUNT", new BigDecimal("20"),
                BigDecimal.ZERO, BigDecimal.ZERO));
    }
}
