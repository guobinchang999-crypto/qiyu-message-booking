package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.TherapistEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/** MyBatis-Plus mapper with typed lookups needed by therapist mutation use cases. */
public interface TherapistManagementMapper extends BaseMapper<TherapistEntity> {
    @Select("SELECT id FROM store WHERE store_code=#{storeCode} AND deleted=0 AND enabled=1 LIMIT 1")
    Long activeStoreId(@Param("storeCode") String storeCode);

    @Select("SELECT store_name FROM store WHERE id=#{storeId} AND deleted=0 LIMIT 1")
    String storeName(@Param("storeId") long storeId);

    @Select("SELECT store_code FROM store WHERE id=#{storeId} AND deleted=0 LIMIT 1")
    String storeCode(@Param("storeId") long storeId);

    @Select("SELECT mobile FROM staff WHERE id=#{staffId} AND deleted=0 LIMIT 1")
    String staffMobile(@Param("staffId") long staffId);

    @Select("""
            SELECT COUNT(*) FROM booking
            WHERE therapist_id=#{therapistId} AND deleted=0
              AND status NOT IN ('COMPLETED', 'CANCELLED')
            """)
    long unfinishedBookingCount(@Param("therapistId") long therapistId);

    @Select("""
            SELECT COUNT(*) FROM booking
            WHERE therapist_id=#{therapistId} AND deleted=0 AND status <> 'CANCELLED'
              AND scheduled_start_at >= CURRENT_DATE
              AND scheduled_start_at < CURRENT_DATE + INTERVAL 1 DAY
            """)
    long todayBookingCount(@Param("therapistId") long therapistId);

    /** Returns the mutation response with dictionary label, skills, store name, and live workload. */
    @Select("""
            SELECT CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS id,
                   t.therapist_name AS name, s.store_name AS store, t.level_name AS level,
                   GROUP_CONCAT(skill.skill_name ORDER BY skill.sort_order SEPARATOR ',') AS skills,
                   COALESCE(di.item_label, t.status) AS status, t.rating,
                   (SELECT COUNT(*) FROM booking b WHERE b.therapist_id=t.id AND b.deleted=0
                     AND b.status&lt;&gt;'CANCELLED' AND b.scheduled_start_at&gt;=CURRENT_DATE
                     AND b.scheduled_start_at&lt;CURRENT_DATE + INTERVAL 1 DAY) AS todayBookings,
                   t.therapist_code AS code,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   staff.mobile,
                   t.specify_fee_amount AS specifyFee,
                   t.enabled=1 AS enabled
            FROM therapist t JOIN store s ON s.id=t.store_id AND s.deleted=0
            LEFT JOIN staff ON staff.id=t.staff_id AND staff.deleted=0
            LEFT JOIN therapist_skill skill ON skill.therapist_id=t.id AND skill.deleted=0
            LEFT JOIN dict_item di ON di.type_code='therapist_status' AND di.item_value=t.status
              AND di.enabled=1 AND di.deleted=0
            WHERE t.id=#{therapistId} AND t.deleted=0
            GROUP BY t.id, s.store_name, s.store_code, staff.mobile, di.item_label
            """)
    TherapistManagementProjection profile(@Param("therapistId") long therapistId);
}
