package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Select;

import java.util.Map;
import java.util.List;

public interface MemberProfileMapper {
    @Select("""
            SELECT ma.id, c.nickname AS customer_name, c.member_level AS level, ma.balance_amount AS balance,
              COALESCE((SELECT SUM(pc.remaining_times) FROM member_package_card pc WHERE pc.customer_id=c.id AND pc.status='ACTIVE' AND pc.deleted=0),0) package_balance,
              COALESCE((SELECT COUNT(*) FROM customer_coupon cc WHERE cc.customer_id=c.id AND cc.status='UNUSED' AND cc.deleted=0),0) coupon_count,
              '全门店通用' AS scope
            FROM member_account ma JOIN customer c ON c.id=ma.customer_id AND c.deleted=0
            WHERE ma.deleted=0 ORDER BY ma.id
            """)
    List<MemberAccountRow> memberAccounts();
    @Select("""
            SELECT u.display_name, c.mobile, COALESCE(c.avatar_url,u.avatar_url) avatar_url,
              c.member_level, COALESCE(ma.balance_amount,0) balance_amount,
              (SELECT COUNT(*) FROM customer_coupon cc WHERE cc.customer_id=c.id AND cc.status='UNUSED' AND cc.deleted=0
                AND cc.valid_start_at<=CURRENT_TIMESTAMP AND cc.valid_end_at>CURRENT_TIMESTAMP) coupon_count,
              (SELECT COALESCE(SUM(pc.remaining_times),0) FROM member_package_card pc WHERE pc.customer_id=c.id
                AND pc.status='ACTIVE' AND pc.deleted=0 AND pc.valid_start_date<=CURRENT_DATE AND pc.valid_end_date>=CURRENT_DATE) package_count,
              (SELECT COUNT(*) FROM customer_favorite_store fs WHERE fs.customer_id=c.id AND fs.deleted=0) favorite_count
            FROM sys_user u JOIN customer c ON c.user_id=u.id AND c.deleted=0 AND c.status='ENABLED'
            LEFT JOIN member_account ma ON ma.customer_id=c.id AND ma.deleted=0 AND ma.status='ACTIVE'
            WHERE u.id=#{userId} AND u.user_type='CUSTOMER' AND u.deleted=0 AND u.status='ENABLED'
            """)
    Map<String, Object> findProfile(long userId);
}
