package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.CustomerFavoriteStoreEntity;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/** MyBatis-Plus mapper for customer store and service favorites. */
public interface CustomerFavoriteMapper extends BaseMapper<CustomerFavoriteStoreEntity> {
    @Select("""
            SELECT COUNT(*) FROM customer_favorite_store f
            JOIN store s ON s.id=f.store_id AND s.deleted=0
            WHERE f.customer_id=#{customerId} AND f.deleted=0
              AND CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-')))=#{resourceId}
            """)
    long favoriteStoreCount(@Param("customerId") long customerId, @Param("resourceId") String resourceId);

    @Select("""
            SELECT COUNT(*) FROM customer_favorite_service f
            JOIN service_item s ON s.id=f.service_item_id AND s.deleted=0
            WHERE f.customer_id=#{customerId} AND f.deleted=0
              AND CONCAT('service-', CASE s.service_code
                WHEN 'NECK_60' THEN 'neck' WHEN 'TUINA_90' THEN 'tui-na'
                WHEN 'AROMA_90' THEN 'spa' ELSE LOWER(REPLACE(s.service_code, '_', '-')) END)=#{resourceId}
            """)
    long favoriteServiceCount(@Param("customerId") long customerId, @Param("resourceId") String resourceId);

    @Insert("""
            INSERT INTO customer_favorite_store (customer_id, store_id, visit_count, is_pinned, sort_order, deleted)
            SELECT #{customerId}, s.id, 0, 0, 0, 0 FROM store s
            WHERE s.deleted=0 AND CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-')))=#{resourceId}
            ON DUPLICATE KEY UPDATE deleted=0, updated_at=CURRENT_TIMESTAMP
            """)
    int saveStore(@Param("customerId") long customerId, @Param("resourceId") String resourceId);

    @Insert("""
            INSERT INTO customer_favorite_service (customer_id, service_item_id, sort_order, deleted)
            SELECT #{customerId}, s.id, 0, 0 FROM service_item s
            WHERE s.deleted=0 AND CONCAT('service-', CASE s.service_code
              WHEN 'NECK_60' THEN 'neck' WHEN 'TUINA_90' THEN 'tui-na'
              WHEN 'AROMA_90' THEN 'spa' ELSE LOWER(REPLACE(s.service_code, '_', '-')) END)=#{resourceId}
            ON DUPLICATE KEY UPDATE deleted=0, updated_at=CURRENT_TIMESTAMP
            """)
    int saveService(@Param("customerId") long customerId, @Param("resourceId") String resourceId);

    @Update("""
            UPDATE customer_favorite_store f JOIN store s ON s.id=f.store_id
            SET f.deleted=1, f.updated_at=CURRENT_TIMESTAMP
            WHERE f.customer_id=#{customerId} AND f.deleted=0
              AND CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-')))=#{resourceId}
            """)
    int deleteStore(@Param("customerId") long customerId, @Param("resourceId") String resourceId);

    @Update("""
            UPDATE customer_favorite_service f JOIN service_item s ON s.id=f.service_item_id
            SET f.deleted=1, f.updated_at=CURRENT_TIMESTAMP
            WHERE f.customer_id=#{customerId} AND f.deleted=0
              AND CONCAT('service-', CASE s.service_code
                WHEN 'NECK_60' THEN 'neck' WHEN 'TUINA_90' THEN 'tui-na'
                WHEN 'AROMA_90' THEN 'spa' ELSE LOWER(REPLACE(s.service_code, '_', '-')) END)=#{resourceId}
            """)
    int deleteService(@Param("customerId") long customerId, @Param("resourceId") String resourceId);
}
