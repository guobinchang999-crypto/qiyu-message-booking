package com.qiyu.infrastructure.member;

import com.qiyu.domain.member.gateway.MemberProfileGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "false", matchIfMissing = true)
public class MockMemberProfileGateway implements MemberProfileGateway {
    @Override
    public Optional<MemberProfile> findByUserId(long userId) {
        return Optional.of(new MemberProfile("林知夏", "13800001288", null, "SILVER",
                new BigDecimal("680.00"), 2, 4, 1));
    }
}
