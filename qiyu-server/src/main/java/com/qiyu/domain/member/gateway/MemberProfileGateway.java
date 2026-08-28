package com.qiyu.domain.member.gateway;

import java.math.BigDecimal;
import java.util.Optional;

public interface MemberProfileGateway {
    Optional<MemberProfile> findByUserId(long userId);

    record MemberProfile(
            String displayName,
            String mobile,
            String avatarUrl,
            String memberLevel,
            BigDecimal balance,
            int couponCount,
            int packageRemainingTimes,
            int favoriteStoreCount
    ) { }
}
