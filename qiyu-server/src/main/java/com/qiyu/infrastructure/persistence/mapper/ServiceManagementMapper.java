package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.CatalogServiceItemEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/** MyBatis-Plus mapper and typed administration projections for service items. */
public interface ServiceManagementMapper extends BaseMapper<CatalogServiceItemEntity> {
    /** Loads all service items needed by the administration CRUD table. */
    @Select("""
            SELECT si.id AS databaseId,
                   CONCAT('service-', CASE si.service_code
                     WHEN 'NECK_60' THEN 'neck' WHEN 'TUINA_90' THEN 'tui-na'
                     WHEN 'AROMA_90' THEN 'spa' ELSE LOWER(REPLACE(si.service_code, '_', '-')) END) AS id,
                   si.service_code AS code, si.category_id AS categoryId, sc.category_name AS category,
                   si.service_name AS name, si.duration_minutes AS durationMinutes,
                   si.preparation_minutes AS preparationMinutes, si.cleanup_minutes AS cleanupMinutes,
                   si.price_amount AS price, si.member_price_amount AS memberPrice, si.description,
                   si.status, (SELECT COUNT(*) FROM booking b WHERE b.service_item_id=si.id AND b.deleted=0) AS bookingCount,
                   si.sort_order AS sortOrder, si.created_by AS createdBy, si.updated_by AS updatedBy
            FROM service_item si
            JOIN service_category sc ON sc.id=si.category_id AND sc.deleted=0
            WHERE si.deleted=0 ORDER BY si.sort_order, si.id
            """)
    List<ServiceManagementProjection> findAllResources();

    /** Reloads one item after a BaseMapper mutation. */
    @Select("""
            SELECT si.id AS databaseId,
                   CONCAT('service-', CASE si.service_code
                     WHEN 'NECK_60' THEN 'neck' WHEN 'TUINA_90' THEN 'tui-na'
                     WHEN 'AROMA_90' THEN 'spa' ELSE LOWER(REPLACE(si.service_code, '_', '-')) END) AS id,
                   si.service_code AS code, si.category_id AS categoryId, sc.category_name AS category,
                   si.service_name AS name, si.duration_minutes AS durationMinutes,
                   si.preparation_minutes AS preparationMinutes, si.cleanup_minutes AS cleanupMinutes,
                   si.price_amount AS price, si.member_price_amount AS memberPrice, si.description,
                   si.status, (SELECT COUNT(*) FROM booking b WHERE b.service_item_id=si.id AND b.deleted=0) AS bookingCount,
                   si.sort_order AS sortOrder, si.created_by AS createdBy, si.updated_by AS updatedBy
            FROM service_item si JOIN service_category sc ON sc.id=si.category_id AND sc.deleted=0
            WHERE si.id=#{databaseId} AND si.deleted=0
            """)
    ServiceManagementProjection findResourceByDatabaseId(@Param("databaseId") Long databaseId);

    /** Includes soft-deleted rows because the database business-code key remains unique. */
    @Select("SELECT COUNT(*) FROM service_item WHERE service_code=#{code}")
    long countCodeIncludingDeleted(@Param("code") String code);

    /** Resolves a category by its user-facing database name. */
    @Select("SELECT id FROM service_category WHERE category_name=#{name} AND enabled=1 AND deleted=0 LIMIT 1")
    Long findCategoryIdByName(@Param("name") String name);

    /** Counts historical booking references before destructive master-data operations. */
    @Select("SELECT COUNT(*) FROM booking WHERE service_item_id=#{serviceId} AND deleted=0")
    Long countBookingReferences(@Param("serviceId") long serviceId);
}
