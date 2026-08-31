package com.qiyu.infrastructure.coupon;

import com.qiyu.domain.coupon.gateway.CouponGateway;
import com.qiyu.infrastructure.persistence.mapper.ApplicableCouponRow;
import com.qiyu.infrastructure.persistence.mapper.CouponEligibilityMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** MyBatis-Plus adapter for customer coupon eligibility used in persistence mode. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusCouponGateway implements CouponGateway {
    private final CouponEligibilityMapper mapper;

    public MybatisPlusCouponGateway(CouponEligibilityMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public Optional<ApplicableCoupon> findApplicable(String customerId, String couponNo) {
        ApplicableCouponRow row = mapper.findApplicable(Long.parseLong(customerId), couponNo);
        if (row == null) return Optional.empty();
        return Optional.of(new ApplicableCoupon(row.couponNo(), row.couponName(), row.discountType(),
                row.discountAmount(), row.discountPercent(), row.thresholdAmount()));
    }
}
