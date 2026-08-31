package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Database projection used to evaluate one currently valid customer coupon. */
public record ApplicableCouponRow(String couponNo, String couponName, String discountType,
                                  BigDecimal discountAmount, BigDecimal discountPercent,
                                  BigDecimal thresholdAmount) {}
