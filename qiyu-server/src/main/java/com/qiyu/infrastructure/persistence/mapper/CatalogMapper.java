package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.CatalogStoreEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/** Database read model for customer and administration catalog resources. */
public interface CatalogMapper extends BaseMapper<CatalogStoreEntity> {
    @Select("""
            SELECT id, coupon_name AS name,
              CASE WHEN discount_type='FIXED' THEN CONCAT('减 ¥', discount_amount) ELSE CONCAT(discount_percent, '% 折扣') END AS discount,
              '全门店通用' AS scope, DATE_FORMAT(valid_end_at, '%Y-%m-%d') AS valid_until,
              issued_count, used_count,
              CASE status WHEN 'ACTIVE' THEN '投放中' WHEN 'ENDED' THEN '已结束' ELSE '草稿' END AS display_status
            FROM coupon_template WHERE deleted=0 ORDER BY id DESC
            """)
    List<CouponRow> coupons();
    @Select("""
            SELECT CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS id,
                   s.store_name AS name, s.address, s.phone, s.latitude, s.longitude,
                   '' AS distance, s.rating, s.business_status AS businessStatusCode,
                   COALESCE(di.item_label, s.business_status) AS businessStatusLabel,
                   '近期可约' AS nextAvailableAt, s.business_hours AS businessHours,
                   FALSE AS frequent, s.cover_url AS coverImageUrl
            FROM store s
            LEFT JOIN dict_item di ON di.type_code='business_status'
              AND di.item_value=s.business_status AND di.enabled=1 AND di.deleted=0
            WHERE s.enabled=1 AND s.deleted=0
            ORDER BY s.sort_order, s.id
            """)
    List<Map<String, Object>> stores();

    @Select("""
            SELECT CONCAT('service-', CASE si.service_code
                     WHEN 'NECK_60' THEN 'neck' WHEN 'TUINA_90' THEN 'tui-na'
                     WHEN 'AROMA_90' THEN 'spa' ELSE LOWER(REPLACE(si.service_code, '_', '-')) END) AS id,
                   si.service_name AS name, si.duration_minutes AS durationMinutes,
                   si.preparation_minutes AS preparationMinutes, si.cleanup_minutes AS cleanupMinutes,
                   si.price_amount AS price, si.member_price_amount AS memberPrice,
                   sc.category_name AS category, si.sales_count AS salesCount,
                   si.description, si.service_steps AS processSteps, si.suitable_people AS suitableFor,
                   si.notices, si.cover_url AS coverImageUrl, si.cover_url AS bannerImageUrl,
                   GROUP_CONCAT(DISTINCT sit.tag_name ORDER BY sit.sort_order SEPARATOR ',') AS tags
            FROM service_item si
            JOIN service_category sc ON sc.id=si.category_id AND sc.enabled=1 AND sc.deleted=0
            LEFT JOIN service_item_tag sit ON sit.service_item_id=si.id AND sit.deleted=0
            WHERE si.status='ON_SHELF' AND si.deleted=0
            GROUP BY si.id, sc.category_name
            ORDER BY si.sort_order, si.id
            """)
    List<Map<String, Object>> services();

    @Select("""
            <script>
            SELECT CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS id,
                   t.therapist_name AS name,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   t.level_name AS level, t.rating, t.experience_years AS experienceYears,
                   t.specify_fee_amount AS extraFee, t.status,
                   COALESCE(di.item_label, t.status) AS statusLabel,
                   '请查看可约时间' AS nextAvailable, t.avatar_url AS avatarUrl,
                   t.portrait_url AS portraitUrl, t.introduction,
                   GROUP_CONCAT(DISTINCT ts.skill_name ORDER BY ts.sort_order SEPARATOR ',') AS skills
            FROM therapist t
            JOIN store s ON s.id=t.store_id AND s.enabled=1 AND s.deleted=0
            LEFT JOIN therapist_skill ts ON ts.therapist_id=t.id AND ts.deleted=0
            LEFT JOIN dict_item di ON di.type_code='therapist_status'
              AND di.item_value=t.status AND di.enabled=1 AND di.deleted=0
            WHERE t.enabled=1 AND t.deleted=0
            <if test='storeId != null and storeId != ""'>
              AND CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-')))=#{storeId}
            </if>
            <if test='serviceId != null and serviceId != ""'>
              AND (NOT EXISTS (SELECT 1 FROM therapist_service capability WHERE capability.therapist_id=t.id)
                   OR EXISTS (SELECT 1 FROM therapist_service capability
                     JOIN service_item item ON item.id=capability.service_item_id
                     WHERE capability.therapist_id=t.id AND capability.enabled=1
                       AND CONCAT('service-', CASE item.service_code WHEN 'NECK_60' THEN 'neck'
                         WHEN 'TUINA_90' THEN 'tui-na' WHEN 'AROMA_90' THEN 'spa'
                         ELSE LOWER(REPLACE(item.service_code, '_', '-')) END)=#{serviceId}))
            </if>
            GROUP BY t.id, s.store_code, di.item_label
            ORDER BY t.sort_order, t.id
            </script>
            """)
    List<Map<String, Object>> therapists(@Param("storeId") String storeId, @Param("serviceId") String serviceId);

    @Select("""
            <script>
            SELECT CONCAT('room-', LOWER(REPLACE(s.store_code, '_', '-')), '-',
                          LPAD(TRIM(LEADING 'R' FROM r.room_code), 2, '0')) AS id,
                   CONCAT(s.store_name, ' · ', r.room_name) AS name,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   r.status, COALESCE(di.item_label, r.status) AS statusLabel,
                   CONCAT(r.room_kind, ' · 容量 ', r.capacity) AS type, NULL AS note,
                   r.capacity, r.room_kind AS roomKind
            FROM room r JOIN store s ON s.id=r.store_id AND s.enabled=1 AND s.deleted=0
            LEFT JOIN dict_item di ON di.type_code='room_status'
              AND di.item_value=r.status AND di.enabled=1 AND di.deleted=0
            WHERE r.enabled=1 AND r.deleted=0
            <if test='storeId != null and storeId != ""'>
              AND CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-')))=#{storeId}
            </if>
            <if test='status != null and status != ""'>AND r.status=#{status}</if>
            ORDER BY s.sort_order, r.sort_order, r.id
            </script>
            """)
    List<Map<String, Object>> rooms(@Param("storeId") String storeId, @Param("status") String status);
}
