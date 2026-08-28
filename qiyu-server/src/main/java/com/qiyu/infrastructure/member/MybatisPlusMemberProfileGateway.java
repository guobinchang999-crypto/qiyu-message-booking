package com.qiyu.infrastructure.member;

import com.qiyu.domain.member.gateway.MemberProfileGateway;
import com.qiyu.infrastructure.persistence.mapper.MemberProfileMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusMemberProfileGateway implements MemberProfileGateway {
    private final MemberProfileMapper mapper;

    public MybatisPlusMemberProfileGateway(MemberProfileMapper mapper) { this.mapper = mapper; }

    @Override
    public Optional<MemberProfile> findByUserId(long userId) {
        Map<String, Object> row = mapper.findProfile(userId);
        if (row == null || row.isEmpty()) return Optional.empty();
        return Optional.of(new MemberProfile(text(row, "display_name"), text(row, "mobile"), text(row, "avatar_url"),
                text(row, "member_level"), decimal(row, "balance_amount"), number(row, "coupon_count"),
                number(row, "package_count"), number(row, "favorite_count")));
    }

    private static String text(Map<String, Object> row, String key) { Object value = row.get(key); return value == null ? null : String.valueOf(value); }
    private static int number(Map<String, Object> row, String key) { return ((Number) row.getOrDefault(key, 0)).intValue(); }
    private static BigDecimal decimal(Map<String, Object> row, String key) { Object value = row.get(key); return value instanceof BigDecimal decimal ? decimal : new BigDecimal(String.valueOf(value)); }
}
