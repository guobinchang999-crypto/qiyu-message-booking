package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

public interface MemberProfileMapper {
    @Select("""
            <script>
            SELECT CONCAT('member-', ma.id) AS id, c.nickname AS customer_name, c.member_level AS level, ma.balance_amount AS balance,
              COALESCE((SELECT SUM(pc.remaining_times) FROM member_package_card pc WHERE pc.customer_id=c.id AND pc.status='ACTIVE' AND pc.deleted=0),0) package_balance,
              COALESCE((SELECT COUNT(*) FROM customer_coupon cc WHERE cc.customer_id=c.id AND cc.status='UNUSED' AND cc.deleted=0),0) coupon_count,
              '全门店通用' AS scope
            FROM member_account ma JOIN customer c ON c.id=ma.customer_id AND c.deleted=0
            WHERE ma.deleted=0 AND (#{allStores}=TRUE OR EXISTS (
              SELECT 1 FROM booking b
              JOIN store bs ON bs.id=b.store_id AND bs.deleted=0
              LEFT JOIN therapist bt ON bt.id=b.therapist_id AND bt.deleted=0
              WHERE b.customer_id=c.id AND b.deleted=0 AND (
                CONCAT('store-', LOWER(REPLACE(bs.store_code, '_', '-'))) IN
                  <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>
                OR (#{therapistId} IS NOT NULL AND CONCAT('therapist-', CASE bt.therapist_code
                  WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                  WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(bt.therapist_code, '_', '-')) END)=#{therapistId})
              )
            )) ORDER BY ma.id
            </script>
            """)
    List<MemberAccountRow> memberAccounts(@Param("allStores") boolean allStores,
                                          @Param("storeIds") Set<String> storeIds,
                                          @Param("therapistId") String therapistId);
    @Select("""
            SELECT u.display_name, c.mobile, COALESCE(c.avatar_url,u.avatar_url) avatar_url,
              c.member_level, COALESCE(ma.balance_amount,0) balance_amount,
              (SELECT COUNT(*) FROM customer_coupon cc WHERE cc.customer_id=c.id AND cc.status='UNUSED' AND cc.deleted=0
                AND cc.valid_start_at<=CURRENT_TIMESTAMP AND cc.valid_end_at>CURRENT_TIMESTAMP) coupon_count,
              (SELECT COALESCE(SUM(pc.remaining_times),0) FROM member_package_card pc WHERE pc.customer_id=c.id
                AND pc.status='ACTIVE' AND pc.deleted=0 AND pc.valid_start_date<=CURRENT_DATE AND pc.valid_end_date>=CURRENT_DATE) package_count,
              ((SELECT COUNT(*) FROM customer_favorite_store fs WHERE fs.customer_id=c.id AND fs.deleted=0)
               + (SELECT COUNT(*) FROM customer_favorite_service fsi WHERE fsi.customer_id=c.id AND fsi.deleted=0)) favorite_count
            FROM sys_user u JOIN customer c ON c.user_id=u.id AND c.deleted=0 AND c.status='ENABLED'
            LEFT JOIN member_account ma ON ma.customer_id=c.id AND ma.deleted=0 AND ma.status='ACTIVE'
            WHERE u.id=#{userId} AND u.user_type='CUSTOMER' AND u.deleted=0 AND u.status='ENABLED'
            """)
    CustomerMemberProfileRow findProfile(long userId);
}
