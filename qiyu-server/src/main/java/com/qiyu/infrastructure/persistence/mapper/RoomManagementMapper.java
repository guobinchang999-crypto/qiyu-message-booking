package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.RoomEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Collection;
import java.util.List;

/** MyBatis-Plus mapper and typed SQL projections for administration room operations. */
public interface RoomManagementMapper extends BaseMapper<RoomEntity> {
    /** Selects rooms inside a resolved store scope and fails closed for an empty non-global scope. */
    @Select("""
            <script>
            SELECT r.id AS databaseId,
                   CONCAT('room-', LOWER(REPLACE(s.store_code, '_', '-')), '-',
                     CASE WHEN r.room_code REGEXP '^R[0-9]+$' THEN LPAD(SUBSTRING(r.room_code, 2), 2, '0')
                          ELSE LOWER(REPLACE(r.room_code, '_', '-')) END) AS id,
                   s.id AS storeDatabaseId,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   s.store_name AS storeName, r.room_code AS code, r.room_name AS name,
                   r.room_kind AS kind, r.capacity, r.status, r.note, r.sort_order AS sortOrder,
                   r.enabled=1 AS enabled
            FROM room r
            JOIN store s ON s.id=r.store_id AND s.deleted=0
            WHERE r.deleted=0
              AND (#{allStores}=TRUE OR
                <choose>
                  <when test='storeIds != null and !storeIds.isEmpty()'>
                    CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                    <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>
                  </when>
                  <otherwise>1=0</otherwise>
                </choose>)
            ORDER BY s.sort_order, r.sort_order, r.id
            </script>
            """)
    List<RoomManagementRow> findAll(@Param("allStores") boolean allStores,
                                    @Param("storeIds") Collection<String> storeIds);

    /** Resolves one room by the same stable ID exposed by catalog and administration APIs. */
    @Select("""
            SELECT r.id AS databaseId,
                   CONCAT('room-', LOWER(REPLACE(s.store_code, '_', '-')), '-',
                     CASE WHEN r.room_code REGEXP '^R[0-9]+$' THEN LPAD(SUBSTRING(r.room_code, 2), 2, '0')
                          ELSE LOWER(REPLACE(r.room_code, '_', '-')) END) AS id,
                   s.id AS storeDatabaseId,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   s.store_name AS storeName, r.room_code AS code, r.room_name AS name,
                   r.room_kind AS kind, r.capacity, r.status, r.note, r.sort_order AS sortOrder,
                   r.enabled=1 AS enabled
            FROM room r JOIN store s ON s.id=r.store_id AND s.deleted=0
            WHERE r.deleted=0 AND CONCAT('room-', LOWER(REPLACE(s.store_code, '_', '-')), '-',
                     CASE WHEN r.room_code REGEXP '^R[0-9]+$' THEN LPAD(SUBSTRING(r.room_code, 2), 2, '0')
                          ELSE LOWER(REPLACE(r.room_code, '_', '-')) END)=#{roomId}
            LIMIT 1
            """)
    RoomManagementRow findByApiId(@Param("roomId") String roomId);

    /** Reloads one room after insert or update. */
    @Select("""
            SELECT r.id AS databaseId,
                   CONCAT('room-', LOWER(REPLACE(s.store_code, '_', '-')), '-',
                     CASE WHEN r.room_code REGEXP '^R[0-9]+$' THEN LPAD(SUBSTRING(r.room_code, 2), 2, '0')
                          ELSE LOWER(REPLACE(r.room_code, '_', '-')) END) AS id,
                   s.id AS storeDatabaseId,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   s.store_name AS storeName, r.room_code AS code, r.room_name AS name,
                   r.room_kind AS kind, r.capacity, r.status, r.note, r.sort_order AS sortOrder,
                   r.enabled=1 AS enabled
            FROM room r JOIN store s ON s.id=r.store_id AND s.deleted=0
            WHERE r.id=#{databaseId} AND r.deleted=0 LIMIT 1
            """)
    RoomManagementRow findByDatabaseId(@Param("databaseId") long databaseId);

    /** Loads a stable store identity from its external identifier. */
    @Select("""
            SELECT id AS databaseId, CONCAT('store-', LOWER(REPLACE(store_code, '_', '-'))) AS id,
                   store_name AS name
            FROM store
            WHERE CONCAT('store-', LOWER(REPLACE(store_code, '_', '-')))=#{storeId}
              AND enabled=1 AND deleted=0
            LIMIT 1
            """)
    RoomStoreIdentityRow findStore(@Param("storeId") String storeId);

    /** Loads the store identity needed to map one room entity back to its API response. */
    @Select("""
            SELECT id AS databaseId, CONCAT('store-', LOWER(REPLACE(store_code, '_', '-'))) AS id,
                   store_name AS name
            FROM store WHERE id=#{storeDatabaseId} AND deleted=0 LIMIT 1
            """)
    RoomStoreIdentityRow findStoreByDatabaseId(@Param("storeDatabaseId") long storeDatabaseId);

    /** Counts appointments that are future-dated or have not reached a terminal state. */
    @Select("""
            SELECT COUNT(*) FROM booking
            WHERE room_id=#{roomDatabaseId} AND deleted=0
              AND (scheduled_end_at &gt;= CURRENT_TIMESTAMP OR status NOT IN ('COMPLETED','CANCELLED'))
            """)
    long countBlockingBookingReferences(@Param("roomDatabaseId") long roomDatabaseId);
}
