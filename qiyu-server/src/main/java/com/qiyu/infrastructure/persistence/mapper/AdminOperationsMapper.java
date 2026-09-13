package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

/**
 * Read-only SQL used by the administration operations view.
 *
 * <p>Every query receives a resolved server-side store scope. Empty non-global scopes deliberately
 * add {@code 1 = 0}; an absent scope must never be interpreted as cross-store access.</p>
 */
public interface AdminOperationsMapper {
    /** Selects real store attributes and resource counts inside the supplied store scope. */
    @Select("""
            <script>
            SELECT CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS id,
                   s.store_code AS code,
                   s.region_id AS regionId,
                   s.store_name AS name,
                   s.phone,
                   s.province,
                   s.city,
                   s.district,
                   s.address,
                   s.longitude,
                   s.latitude,
                   s.business_hours AS businessHours,
                   (
                     SELECT su.display_name
                     FROM staff manager_staff
                     JOIN sys_user su ON su.id=manager_staff.user_id AND su.deleted=0 AND su.status='ENABLED'
                     JOIN sys_user_role sur ON sur.user_id=su.id
                     JOIN sys_role sr ON sr.id=sur.role_id AND sr.deleted=0 AND sr.status='ENABLED'
                     WHERE manager_staff.primary_store_id=s.id
                       AND manager_staff.deleted=0 AND manager_staff.status='ENABLED'
                       AND sr.role_code='STORE_MANAGER'
                     ORDER BY manager_staff.id
                     LIMIT 1
                    ) AS manager,
                    (
                      SELECT manager_staff.position_name
                      FROM staff manager_staff
                      JOIN sys_user su ON su.id=manager_staff.user_id AND su.deleted=0 AND su.status='ENABLED'
                      JOIN sys_user_role sur ON sur.user_id=su.id
                      JOIN sys_role sr ON sr.id=sur.role_id AND sr.deleted=0 AND sr.status='ENABLED'
                      WHERE manager_staff.primary_store_id=s.id
                        AND manager_staff.deleted=0 AND manager_staff.status='ENABLED'
                        AND sr.role_code='STORE_MANAGER'
                      ORDER BY manager_staff.id
                      LIMIT 1
                    ) AS managerPosition,
                    (
                      SELECT manager_staff.mobile
                      FROM staff manager_staff
                      JOIN sys_user su ON su.id=manager_staff.user_id AND su.deleted=0 AND su.status='ENABLED'
                      JOIN sys_user_role sur ON sur.user_id=su.id
                      JOIN sys_role sr ON sr.id=sur.role_id AND sr.deleted=0 AND sr.status='ENABLED'
                      WHERE manager_staff.primary_store_id=s.id
                        AND manager_staff.deleted=0 AND manager_staff.status='ENABLED'
                        AND sr.role_code='STORE_MANAGER'
                      ORDER BY manager_staff.id
                      LIMIT 1
                    ) AS managerMobile,
                    (SELECT COUNT(*) FROM room r
                     WHERE r.store_id=s.id AND r.deleted=0 AND r.enabled=1) AS roomCount,
                   (SELECT COUNT(*) FROM therapist t
                    WHERE t.store_id=s.id AND t.deleted=0 AND t.enabled=1) AS therapistCount,
                   CASE WHEN s.enabled=1 AND s.business_status='OPEN' THEN '营业中' ELSE '休息中' END AS status,
                   s.rating,
                   s.sort_order AS sortOrder,
                   s.enabled=1 AS enabled
            FROM store s
            WHERE s.deleted=0
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            ORDER BY s.sort_order, s.id
            </script>
            """)
    List<AdminStoreProjection> stores(@Param("allStores") boolean allStores,
                                      @Param("storeIds") Collection<String> storeIds);

    /**
     * Aggregates report values from booking rows so missing metric snapshots never produce
     * fabricated values. Revenue and average ticket use completed appointments only.
     */
    @Select("""
            <script>
            WITH scoped_bookings AS (
              SELECT b.id, b.store_id, b.service_item_id, b.status,
                     b.item_amount + b.therapist_fee_amount - b.discount_amount
                       - b.balance_deduction_amount AS net_amount
              FROM booking b
              JOIN store scoped_store ON scoped_store.id=b.store_id AND scoped_store.deleted=0
              WHERE b.deleted=0
                AND b.scheduled_start_at &gt;= #{startDate}
                AND b.scheduled_start_at &lt; DATE_ADD(#{endDate}, INTERVAL 1 DAY)
                AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(scoped_store.store_code, '_', '-'))) IN
                  <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            ), service_rank AS (
              SELECT sb.store_id, si.service_name,
                     ROW_NUMBER() OVER (
                       PARTITION BY sb.store_id
                       ORDER BY COUNT(*) DESC, MIN(si.id)
                     ) AS ranking
              FROM scoped_bookings sb
              JOIN service_item si ON si.id=sb.service_item_id AND si.deleted=0
              WHERE sb.status &lt;&gt; 'CANCELLED'
              GROUP BY sb.store_id, si.id, si.service_name
            )
            SELECT CONCAT('report-', LOWER(REPLACE(s.store_code, '_', '-'))) AS id,
                   s.store_name AS store,
                   COUNT(sb.id) AS bookingCount,
                   COALESCE(ROUND(100 * SUM(CASE WHEN sb.status='COMPLETED' THEN 1 ELSE 0 END)
                     / NULLIF(COUNT(sb.id), 0), 0), 0) AS completionRate,
                   COALESCE(SUM(CASE WHEN sb.status='COMPLETED' THEN sb.net_amount ELSE 0 END), 0) AS revenue,
                   COALESCE(ROUND(SUM(CASE WHEN sb.status='COMPLETED' THEN sb.net_amount ELSE 0 END)
                     / NULLIF(SUM(CASE WHEN sb.status='COMPLETED' THEN 1 ELSE 0 END), 0), 2), 0) AS averageTicket,
                   MAX(CASE WHEN service_rank.ranking=1 THEN service_rank.service_name END) AS topService
            FROM store s
            LEFT JOIN scoped_bookings sb ON sb.store_id=s.id
            LEFT JOIN service_rank ON service_rank.store_id=s.id AND service_rank.ranking=1
            WHERE s.deleted=0
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            GROUP BY s.id, s.store_code, s.store_name
            ORDER BY s.sort_order, s.id
            </script>
            """)
    List<AdminBusinessReportProjection> businessReports(@Param("allStores") boolean allStores,
                                                         @Param("storeIds") Collection<String> storeIds,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);

    /** Selects therapists and counts only today's non-cancelled bookings in the resolved scope. */
    @Select("""
            <script>
            SELECT CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS id,
                   t.therapist_name AS name,
                   s.store_name AS store,
                   t.level_name AS level,
                   GROUP_CONCAT(DISTINCT skill.skill_name ORDER BY skill.sort_order SEPARATOR ',') AS skills,
                   COALESCE(status_item.item_label, t.status) AS status,
                   t.rating,
                   COUNT(DISTINCT today_booking.id) AS todayBookings,
                   t.therapist_code AS code,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   staff.mobile,
                   t.specify_fee_amount AS specifyFee,
                   t.enabled=1 AS enabled
            FROM therapist t
            JOIN store s ON s.id=t.store_id AND s.deleted=0
            LEFT JOIN staff ON staff.id=t.staff_id AND staff.deleted=0
            LEFT JOIN therapist_skill skill ON skill.therapist_id=t.id AND skill.deleted=0
            LEFT JOIN dict_item status_item ON status_item.type_code='therapist_status'
              AND status_item.item_value=t.status AND status_item.enabled=1 AND status_item.deleted=0
            LEFT JOIN booking today_booking ON today_booking.therapist_id=t.id AND today_booking.deleted=0
              AND today_booking.status &lt;&gt; 'CANCELLED'
              AND today_booking.scheduled_start_at &gt;= CURRENT_DATE
              AND today_booking.scheduled_start_at &lt; CURRENT_DATE + INTERVAL 1 DAY
            WHERE t.deleted=0 AND t.enabled=1
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>
                OR CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) = #{therapistId})
            GROUP BY t.id, s.store_name, s.store_code, staff.mobile, status_item.item_label
            ORDER BY s.sort_order, t.sort_order, t.id
            </script>
            """)
    List<AdminTherapistProfileProjection> therapistProfiles(@Param("allStores") boolean allStores,
                                                             @Param("storeIds") Collection<String> storeIds,
                                                             @Param("therapistId") String therapistId);

    @Select("""
            <script>
            SELECT COUNT(*) AS bookingCount,
                   COALESCE(SUM(CASE WHEN b.status='BOOKED' THEN 1 ELSE 0 END), 0) AS waitingCount,
                   COALESCE(SUM(CASE WHEN b.status='IN_SERVICE' THEN 1 ELSE 0 END), 0) AS inServiceCount,
                   COALESCE(SUM(CASE WHEN b.status &lt;&gt; 'CANCELLED'
                                     THEN b.item_amount + b.therapist_fee_amount - b.discount_amount - b.balance_deduction_amount
                                     ELSE 0 END), 0) AS expectedRevenue
            FROM booking b JOIN store s ON s.id=b.store_id AND s.deleted=0
            WHERE b.deleted=0
              AND b.scheduled_start_at &gt;= CURRENT_DATE
              AND b.scheduled_start_at &lt; CURRENT_DATE + INTERVAL 1 DAY
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            </script>
            """)
    AdminDashboardTotalsRow dashboardTotals(@Param("allStores") boolean allStores,
                                             @Param("storeIds") Collection<String> storeIds);

    @Select("""
            <script>
            SELECT DATE_FORMAT(MIN(b.scheduled_start_at), '%m-%d') AS name,
                   COALESCE(SUM(b.item_amount + b.therapist_fee_amount - b.discount_amount - b.balance_deduction_amount), 0) AS value,
                   NULL AS comparison
            FROM booking b JOIN store s ON s.id=b.store_id AND s.deleted=0
            WHERE b.deleted=0 AND b.status &lt;&gt; 'CANCELLED'
              AND b.scheduled_start_at &gt;= CURRENT_DATE - INTERVAL 6 DAY
              AND b.scheduled_start_at &lt; CURRENT_DATE + INTERVAL 1 DAY
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            GROUP BY DATE(b.scheduled_start_at)
            ORDER BY DATE(b.scheduled_start_at)
            </script>
            """)
    List<AdminMetricRow> revenueTrend(@Param("allStores") boolean allStores,
                                      @Param("storeIds") Collection<String> storeIds);

    @Select("""
            <script>
            SELECT s.store_name AS name,
                   COALESCE(SUM(CASE WHEN b.status &lt;&gt; 'CANCELLED'
                                     THEN b.item_amount + b.therapist_fee_amount - b.discount_amount - b.balance_deduction_amount
                                     ELSE 0 END), 0) AS value,
                   CAST(COALESCE(ROUND(100 * SUM(CASE WHEN b.status IN ('CHECKED_IN','WAITING_SERVICE','IN_SERVICE','PENDING_SETTLEMENT','COMPLETED') THEN 1 ELSE 0 END)
                         / NULLIF(SUM(CASE WHEN b.status &lt;&gt; 'CANCELLED' THEN 1 ELSE 0 END), 0)), 0) AS CHAR) AS comparison
            FROM store s LEFT JOIN booking b ON b.store_id=s.id AND b.deleted=0
              AND b.scheduled_start_at &gt;= CURRENT_DATE
              AND b.scheduled_start_at &lt; CURRENT_DATE + INTERVAL 1 DAY
            WHERE s.deleted=0
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            GROUP BY s.id, s.store_name
            HAVING COUNT(b.id) &gt; 0
            ORDER BY value DESC, s.id
            </script>
            """)
    List<AdminMetricRow> storeRanking(@Param("allStores") boolean allStores,
                                      @Param("storeIds") Collection<String> storeIds);

    @Select("""
            <script>
            SELECT t.therapist_name AS name,
                   COALESCE(booked.booking_count, 0) AS bookingCount,
                   COALESCE(worked.scheduled_minutes, 0) AS scheduledMinutes,
                   COALESCE(booked.booked_minutes, 0) AS bookedMinutes
            FROM therapist t JOIN store s ON s.id=t.store_id AND s.deleted=0
            JOIN (
              SELECT ts.therapist_id, SUM(TIMESTAMPDIFF(MINUTE, ts.start_time, ts.end_time)) AS scheduled_minutes
              FROM therapist_schedule ts WHERE ts.deleted=0 AND ts.schedule_status='WORK' AND ts.work_date=CURRENT_DATE
              GROUP BY ts.therapist_id
            ) worked ON worked.therapist_id=t.id
            LEFT JOIN (
              SELECT b.therapist_id, COUNT(*) AS booking_count,
                     SUM(TIMESTAMPDIFF(MINUTE, b.scheduled_start_at, b.scheduled_end_at)) AS booked_minutes
              FROM booking b WHERE b.deleted=0 AND b.status &lt;&gt; 'CANCELLED'
                AND b.scheduled_start_at &gt;= CURRENT_DATE AND b.scheduled_start_at &lt; CURRENT_DATE + INTERVAL 1 DAY
              GROUP BY b.therapist_id
            ) booked ON booked.therapist_id=t.id
            WHERE t.deleted=0 AND t.enabled=1
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            ORDER BY bookedMinutes DESC, t.id
            </script>
            """)
    List<AdminTherapistUtilizationRow> therapistUtilization(@Param("allStores") boolean allStores,
                                                            @Param("storeIds") Collection<String> storeIds);

    @Select("""
            <script>
            SELECT s.store_name AS storeName,
                   COALESCE(t.therapist_name, r.room_name, CONCAT(first.resource_type, '#', first.resource_id)) AS resourceName,
                   first.occupied_start_at AS conflictAt
            FROM resource_occupation first
            JOIN resource_occupation second ON second.id &gt; first.id
              AND second.resource_type=first.resource_type AND second.resource_id=first.resource_id
              AND second.deleted=0 AND second.occupation_status IN ('HELD','OCCUPIED')
              AND second.occupied_start_at &lt; first.occupied_end_at AND second.occupied_end_at &gt; first.occupied_start_at
            JOIN store s ON s.id=first.store_id AND s.deleted=0
            LEFT JOIN therapist t ON first.resource_type='THERAPIST' AND t.id=first.resource_id AND t.deleted=0
            LEFT JOIN room r ON first.resource_type='ROOM' AND r.id=first.resource_id AND r.deleted=0
            WHERE first.deleted=0 AND first.occupation_status IN ('HELD','OCCUPIED')
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            ORDER BY first.occupied_start_at
            </script>
            """)
    List<AdminResourceConflictRow> resourceConflicts(@Param("allStores") boolean allStores,
                                                     @Param("storeIds") Collection<String> storeIds);

    @Select("""
            <script>
            SELECT CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS id,
                   t.therapist_name AS name,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   t.status,
                   COALESCE(di.item_label, t.status) AS statusLabel,
                   GROUP_CONCAT(DISTINCT skill.skill_name ORDER BY skill.sort_order SEPARATOR ',') AS skills
            FROM therapist t JOIN store s ON s.id=t.store_id AND s.deleted=0
            LEFT JOIN dict_item di ON di.type_code='therapist_status' AND di.item_value=t.status AND di.enabled=1 AND di.deleted=0
            LEFT JOIN therapist_skill skill ON skill.therapist_id=t.id AND skill.deleted=0
            WHERE t.deleted=0 AND t.enabled=1
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>
                OR CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) = #{therapistId})
            GROUP BY t.id, s.store_code, di.item_label
            ORDER BY s.sort_order, t.sort_order, t.id
            </script>
            """)
    List<AdminScheduleTherapistRow> scheduleTherapists(@Param("allStores") boolean allStores,
                                                        @Param("storeIds") Collection<String> storeIds,
                                                        @Param("therapistId") String therapistId);

    @Select("""
            <script>
            SELECT CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) AS therapistId,
                   ts.work_date AS workDate, ts.start_time AS startTime, ts.end_time AS endTime,
                   ts.schedule_status AS status, ts.remark
            FROM therapist_schedule ts
            JOIN therapist t ON t.id=ts.therapist_id AND t.deleted=0
            JOIN store s ON s.id=ts.store_id AND s.deleted=0
            WHERE ts.deleted=0 AND ts.work_date BETWEEN #{weekStart} AND #{weekEnd}
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>
                OR CONCAT('therapist-', CASE t.therapist_code
                     WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                     WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code, '_', '-')) END) = #{therapistId})
            ORDER BY t.id, ts.work_date, ts.start_time
            </script>
            """)
    List<AdminScheduleEntryRow> scheduleEntries(@Param("allStores") boolean allStores,
                                                 @Param("storeIds") Collection<String> storeIds,
                                                 @Param("therapistId") String therapistId,
                                                 @Param("weekStart") LocalDate weekStart,
                                                 @Param("weekEnd") LocalDate weekEnd);

    @Select("""
            <script>
            SELECT CONCAT('room-', LOWER(REPLACE(s.store_code, '_', '-')), '-',
                          LPAD(TRIM(LEADING 'R' FROM r.room_code), 2, '0')) AS id,
                   CONCAT(s.store_name, ' · ', r.room_name) AS name,
                   CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) AS storeId,
                   r.status, COALESCE(di.item_label, r.status) AS statusLabel,
                   CONCAT(r.room_kind, ' · 容量 ', r.capacity) AS type,
                   NULL AS note
            FROM room r JOIN store s ON s.id=r.store_id AND s.deleted=0
            LEFT JOIN dict_item di ON di.type_code='room_status' AND di.item_value=r.status AND di.enabled=1 AND di.deleted=0
            WHERE r.deleted=0 AND r.enabled=1
              AND (#{allStores} = TRUE OR CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>)
            ORDER BY s.sort_order, r.sort_order, r.id
            </script>
            """)
    List<AdminScheduleRoomRow> scheduleRooms(@Param("allStores") boolean allStores,
                                              @Param("storeIds") Collection<String> storeIds);

}
