package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed SQL projection for administration member accounts. */
public record MemberAccountRow(String id, String customerName, String level, BigDecimal balance,
                               BigDecimal packageBalance, long couponCount, String scope) {}
