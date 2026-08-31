package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed projection for one authenticated customer's member-center data. */
public record CustomerMemberProfileRow(
        String displayName,
        String mobile,
        String avatarUrl,
        String memberLevel,
        BigDecimal balanceAmount,
        int couponCount,
        int packageCount,
        int favoriteCount
) {}
