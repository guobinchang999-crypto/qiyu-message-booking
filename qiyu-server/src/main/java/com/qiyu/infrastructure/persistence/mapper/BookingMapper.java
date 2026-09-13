package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.BookingEntity;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.annotations.Delete;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingMapper extends BaseMapper<BookingEntity> {
    @Select("SELECT id FROM customer WHERE mobile=#{mobile} AND status='ENABLED' AND deleted=0 LIMIT 1")
    Long customerIdByMobile(String mobile);
    @Select("""
            <script>
            SELECT c.id, c.nickname AS name, c.mobile AS phone, COALESCE(c.member_level, 'REGULAR') AS member_level,
                   DATE_FORMAT(MAX(b.created_at), '%Y-%m-%d %H:%i') AS last_visit_at,
                   COUNT(b.id) AS total_bookings, COALESCE(SUM(b.paid_amount), 0) AS total_spend
            FROM customer c
            LEFT JOIN booking b ON b.customer_id=c.id AND b.deleted=0
            LEFT JOIN store bs ON bs.id=b.store_id AND bs.deleted=0
            LEFT JOIN therapist bt ON bt.id=b.therapist_id AND bt.deleted=0
            WHERE c.deleted=0 AND (#{allStores}=TRUE
              OR CONCAT('store-', LOWER(REPLACE(bs.store_code, '_', '-'))) IN
                <foreach collection='storeIds' item='storeId' open='(' separator=',' close=')'>#{storeId}</foreach>
              OR (#{therapistId} IS NOT NULL AND CONCAT('therapist-', CASE bt.therapist_code
                WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
                WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(bt.therapist_code, '_', '-')) END)=#{therapistId}))
            GROUP BY c.id, c.nickname, c.mobile, c.member_level ORDER BY last_visit_at DESC
            </script>
            """)
    List<CustomerProfileRow> customerProfiles(@Param("allStores") boolean allStores,
                                              @Param("storeIds") java.util.Set<String> storeIds,
                                              @Param("therapistId") String therapistId);
    @Select("SELECT id FROM store WHERE store_code=#{code} AND deleted=0") Long storeId(String code);
    @Select("SELECT id FROM service_item WHERE service_code=#{code} AND deleted=0") Long serviceId(String code);
    @Select("SELECT member_price_amount FROM service_item WHERE id=#{id}") BigDecimal memberPrice(long id);
    @Select("SELECT id FROM therapist WHERE therapist_code=#{code} AND deleted=0") Long therapistId(String code);
    @Select("SELECT id FROM therapist WHERE id=#{id} AND deleted=0 FOR UPDATE") Long lockTherapist(long id);
    @Select("SELECT id FROM room WHERE id=#{id} AND deleted=0 FOR UPDATE") Long lockRoom(long id);
    @Select("SELECT id FROM room WHERE store_id=#{storeId} AND room_code=#{code} AND deleted=0") Long roomId(@Param("storeId") long storeId, @Param("code") String code);
    @Select("SELECT user_id FROM customer WHERE id=#{id} AND deleted=0") Long customerUserId(long id);
    @Select("SELECT store_code FROM store WHERE id=#{id}") String storeCode(long id);
    @Select("SELECT service_code FROM service_item WHERE id=#{id}") String serviceCode(long id);
    @Select("SELECT therapist_code FROM therapist WHERE id=#{id}") String therapistCode(long id);
    @Select("SELECT room_code FROM room WHERE id=#{id}") String roomCode(long id);
    @Select("SELECT checkin_code FROM checkin_record WHERE booking_id=#{bookingId} AND deleted=0") String checkinCode(long bookingId);
    @Select("""
            SELECT id FROM resource_occupation
            WHERE resource_type=#{resourceType} AND resource_id=#{resourceId}
              AND occupation_status IN ('HELD','OCCUPIED') AND deleted=0
              AND occupied_start_at < #{endAt} AND occupied_end_at > #{startAt}
              AND (booking_id IS NULL OR booking_id <> #{bookingId}) FOR UPDATE
            """)
    List<Long> lockConflicts(@Param("resourceType") String resourceType, @Param("resourceId") long resourceId,
                             @Param("startAt") LocalDateTime startAt, @Param("endAt") LocalDateTime endAt,
                             @Param("bookingId") Long bookingId);
    @Delete("UPDATE resource_occupation SET occupation_status='RELEASED', released_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE booking_id=#{bookingId} AND occupation_status IN ('HELD','OCCUPIED') AND deleted=0")
    int releaseOccupations(long bookingId);
    @Update("UPDATE resource_occupation SET occupation_status='CANCELLED', released_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE booking_id=#{bookingId} AND occupation_status IN ('HELD','OCCUPIED') AND deleted=0")
    int cancelOccupations(long bookingId);
    @Insert("INSERT INTO resource_occupation(resource_type,resource_id,store_id,booking_id,occupied_start_at,occupied_end_at,occupation_status,occupation_reason,created_by) VALUES(#{resourceType},#{resourceId},#{storeId},#{bookingId},#{startAt},#{endAt},#{status},'BOOKING','system')")
    int insertOccupation(@Param("resourceType") String resourceType, @Param("resourceId") long resourceId,
                         @Param("storeId") long storeId, @Param("bookingId") long bookingId,
                         @Param("startAt") LocalDateTime startAt, @Param("endAt") LocalDateTime endAt,
                         @Param("status") String status);
    @Insert("""
            INSERT INTO checkin_record(booking_id,checkin_code,checkin_status) VALUES(#{bookingId},#{code},#{status})
            ON DUPLICATE KEY UPDATE checkin_code=VALUES(checkin_code),checkin_status=VALUES(checkin_status),updated_at=CURRENT_TIMESTAMP
            """) int upsertCheckin(@Param("bookingId") long bookingId, @Param("code") String code, @Param("status") String status);
}
