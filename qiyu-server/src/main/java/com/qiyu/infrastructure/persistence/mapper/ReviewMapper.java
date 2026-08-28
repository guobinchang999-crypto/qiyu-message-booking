package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.ServiceReviewEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

public interface ReviewMapper extends BaseMapper<ServiceReviewEntity> {
    @Select("""
            <script>
            SELECT r.id,
                   CONCAT('store-', LOWER(REPLACE(REPLACE(s.store_code, 'STORE_', ''), '_', '-'))) storeId,
                   CASE si.service_code
                     WHEN 'SERVICE_NECK_60' THEN 'service-neck'
                     WHEN 'SERVICE_TUINA_90' THEN 'service-tui-na'
                     WHEN 'SERVICE_AROMA_90' THEN 'service-spa'
                     ELSE CONCAT('service-', LOWER(REPLACE(REPLACE(si.service_code, 'SERVICE_', ''), '_', '-')))
                   END serviceId,
                   CASE WHEN r.anonymous = 1 THEN '匿名用户' ELSE b.contact_name END userName,
                   r.service_rating rating, r.content, DATE_FORMAT(r.created_at, '%Y-%m-%d') createdAt
            FROM service_review r
            JOIN booking b ON b.id = r.booking_id
            JOIN store s ON s.id = r.store_id
            JOIN service_item si ON si.id = r.service_item_id
            WHERE r.deleted = 0 AND r.status = 'PUBLISHED'
            <if test="storeId != null and storeId != ''">
              AND CONCAT('store-', LOWER(REPLACE(REPLACE(s.store_code, 'STORE_', ''), '_', '-'))) = #{storeId}
            </if>
            <if test="serviceId != null and serviceId != ''">
              AND (CASE si.service_code
                     WHEN 'SERVICE_NECK_60' THEN 'service-neck'
                     WHEN 'SERVICE_TUINA_90' THEN 'service-tui-na'
                     WHEN 'SERVICE_AROMA_90' THEN 'service-spa'
                     ELSE CONCAT('service-', LOWER(REPLACE(REPLACE(si.service_code, 'SERVICE_', ''), '_', '-')))
                   END) = #{serviceId}
            </if>
            ORDER BY r.created_at DESC, r.id DESC LIMIT #{offset}, #{pageSize}
            </script>
            """)
    List<Map<String, Object>> listPublished(@Param("storeId") String storeId,
                                            @Param("serviceId") String serviceId,
                                            @Param("offset") int offset,
                                            @Param("pageSize") int pageSize);

    @Select("""
            <script>
            SELECT COUNT(*) FROM service_review r
            JOIN store s ON s.id = r.store_id JOIN service_item si ON si.id = r.service_item_id
            WHERE r.deleted = 0 AND r.status = 'PUBLISHED'
            <if test="storeId != null and storeId != ''">
              AND CONCAT('store-', LOWER(REPLACE(REPLACE(s.store_code, 'STORE_', ''), '_', '-'))) = #{storeId}
            </if>
            <if test="serviceId != null and serviceId != ''">
              AND (CASE si.service_code
                     WHEN 'SERVICE_NECK_60' THEN 'service-neck'
                     WHEN 'SERVICE_TUINA_90' THEN 'service-tui-na'
                     WHEN 'SERVICE_AROMA_90' THEN 'service-spa'
                     ELSE CONCAT('service-', LOWER(REPLACE(REPLACE(si.service_code, 'SERVICE_', ''), '_', '-')))
                   END) = #{serviceId}
            </if>
            </script>
            """)
    long countPublished(@Param("storeId") String storeId, @Param("serviceId") String serviceId);

    @Select("""
            SELECT b.id bookingId, b.customer_id customerId, b.store_id storeId,
                   b.therapist_id therapistId, b.service_item_id serviceItemId
            FROM booking b WHERE b.booking_no = #{bookingNo} AND b.deleted = 0
            """)
    Map<String, Object> bookingReference(String bookingNo);
}
