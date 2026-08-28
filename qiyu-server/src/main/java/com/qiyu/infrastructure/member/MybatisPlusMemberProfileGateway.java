package com.qiyu.infrastructure.member;

import com.qiyu.domain.member.gateway.MemberProfileGateway;
import com.qiyu.infrastructure.persistence.mapper.CustomerMemberProfileRow;
import com.qiyu.infrastructure.persistence.mapper.MemberProfileMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusMemberProfileGateway implements MemberProfileGateway {
    private final MemberProfileMapper mapper;

    public MybatisPlusMemberProfileGateway(MemberProfileMapper mapper) { this.mapper = mapper; }

    @Override
    public Optional<MemberProfile> findByUserId(long userId) {
        CustomerMemberProfileRow row = mapper.findProfile(userId);
        if (row == null) return Optional.empty();
        return Optional.of(new MemberProfile(row.displayName(), row.mobile(), row.avatarUrl(), row.memberLevel(),
                row.balanceAmount(), row.couponCount(), row.packageCount(), row.favoriteCount()));
    }
}
