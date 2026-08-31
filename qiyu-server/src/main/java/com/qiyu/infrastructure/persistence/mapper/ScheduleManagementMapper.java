package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.TherapistScheduleEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

/** MyBatis-Plus mapper and typed conflict queries for schedule management. */
public interface ScheduleManagementMapper extends BaseMapper<TherapistScheduleEntity> {
    /** Lists schedules inside the already resolved server-side store scope. */
    @Select("""
            <script>
            SELECT ts.id AS databaseId, CONCAT('schedule-', ts.id) AS id, t.id AS therapistDatabaseId,
                   CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS therapistId,
                   t.therapist_name AS therapistName, s.id AS storeDatabaseId,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   ts.work_date AS workDate, ts.start_time AS startTime, ts.end_time AS endTime,
                   ts.schedule_status AS status, ts.remark, ts.created_by AS createdBy, ts.updated_by AS updatedBy
            FROM therapist_schedule ts
            JOIN therapist t ON t.id=ts.therapist_id AND t.deleted=0
            JOIN store s ON s.id=ts.store_id AND s.deleted=0
            WHERE ts.deleted=0 AND ts.work_date BETWEEN #{startDate} AND #{endDate}
              AND (#{allStores}=TRUE OR
                <choose><when test='storeIds != null and !storeIds.isEmpty()'>
                  CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                  <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>
                </when><otherwise>1=0</otherwise></choose>)
            ORDER BY ts.work_date, ts.start_time, t.id
            </script>
            """)
    List<ScheduleManagementRow> list(@Param("allStores") boolean allStores,
                                     @Param("storeIds") Collection<String> storeIds,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate);

    /** Loads one schedule by public ID for scope checks and updates. */
    @Select("""
            SELECT ts.id AS databaseId, CONCAT('schedule-', ts.id) AS id, t.id AS therapistDatabaseId,
                   CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS therapistId,
                   t.therapist_name AS therapistName, s.id AS storeDatabaseId,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   ts.work_date AS workDate, ts.start_time AS startTime, ts.end_time AS endTime,
                   ts.schedule_status AS status, ts.remark, ts.created_by AS createdBy, ts.updated_by AS updatedBy
            FROM therapist_schedule ts JOIN therapist t ON t.id=ts.therapist_id AND t.deleted=0
            JOIN store s ON s.id=ts.store_id AND s.deleted=0
            WHERE ts.id=#{databaseId} AND ts.deleted=0 LIMIT 1
            """)
    ScheduleManagementRow findByDatabaseId(@Param("databaseId") long databaseId);

    /** Resolves a therapist and its current primary store from the public API ID. */
    @Select("""
            SELECT t.id AS databaseId,
                   CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS id,
                   s.id AS storeDatabaseId,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   t.therapist_name AS name
            FROM therapist t JOIN store s ON s.id=t.store_id AND s.enabled=1 AND s.deleted=0
            WHERE t.enabled=1 AND t.deleted=0 AND CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END)=#{therapistId}
            LIMIT 1
            """)
    ScheduleTherapistIdentityRow findTherapist(@Param("therapistId") String therapistId);

    /** Detects interval overlap; touching boundaries are allowed. */
    @Select("""
            <script>
            SELECT COUNT(*) FROM therapist_schedule
            WHERE therapist_id=#{therapistId} AND work_date=#{workDate} AND deleted=0
              AND start_time &lt; #{endTime} AND end_time &gt; #{startTime}
              <if test='excludedId != null'>AND id &lt;&gt; #{excludedId}</if>
            </script>
            """)
    long scheduleOverlapCount(@Param("therapistId") long therapistId,
                              @Param("workDate") LocalDate workDate,
                              @Param("startTime") LocalTime startTime,
                              @Param("endTime") LocalTime endTime,
                              @Param("excludedId") Long excludedId);

    /** Detects non-cancelled bookings intersecting a proposed leave or rest interval. */
    @Select("""
            SELECT COUNT(*) FROM booking
            WHERE therapist_id=#{therapistId} AND deleted=0 AND status&lt;&gt;'CANCELLED'
              AND scheduled_start_at &lt; TIMESTAMP(#{workDate}, #{endTime})
              AND scheduled_end_at &gt; TIMESTAMP(#{workDate}, #{startTime})
            """)
    long bookingOverlapCount(@Param("therapistId") long therapistId,
                             @Param("workDate") LocalDate workDate,
                             @Param("startTime") LocalTime startTime,
                             @Param("endTime") LocalTime endTime);
}
