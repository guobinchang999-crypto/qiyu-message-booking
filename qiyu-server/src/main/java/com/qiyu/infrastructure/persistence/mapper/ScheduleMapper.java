package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

/** SQL read model for the availability calculation; no ORM type crosses the application boundary. */
public interface ScheduleMapper {
    @Select("SELECT open_time openTime, close_time closeTime, business_status businessStatus FROM store WHERE store_code=#{storeCode} AND deleted=0")
    Map<String, Object> storeHours(String storeCode);

    @Select("SELECT d.open_time openTime, d.close_time closeTime, d.day_status dayStatus FROM store_business_day d JOIN store s ON s.id=d.store_id WHERE s.store_code=#{storeCode} AND d.business_date=#{date} AND d.deleted=0")
    Map<String, Object> specialDay(@Param("storeCode") String storeCode, @Param("date") LocalDate date);

    @Select("SELECT COUNT(*) FROM therapist_schedule t JOIN therapist p ON p.id=t.therapist_id WHERE p.therapist_code=#{therapistCode} AND t.work_date=#{date} AND t.schedule_status='WORK' AND t.deleted=0 AND t.start_time<=#{startTime} AND t.end_time>=#{endTime}")
    int matchingSchedule(@Param("therapistCode") String therapistCode, @Param("date") LocalDate date,
                         @Param("startTime") LocalTime startTime, @Param("endTime") LocalTime endTime);

    @Select("SELECT COUNT(*) FROM therapist_schedule t JOIN therapist p ON p.id=t.therapist_id WHERE p.therapist_code=#{therapistCode} AND t.work_date=#{date} AND t.deleted=0")
    int scheduleCount(@Param("therapistCode") String therapistCode, @Param("date") LocalDate date);

    @Select("SELECT COUNT(*) FROM therapist_leave l JOIN therapist p ON p.id=l.therapist_id WHERE p.therapist_code=#{therapistCode} AND l.approval_status='APPROVED' AND l.deleted=0 AND l.leave_start_at < #{endAt} AND l.leave_end_at > #{startAt}")
    int leaveConflict(@Param("therapistCode") String therapistCode, @Param("startAt") LocalDateTime startAt,
                      @Param("endAt") LocalDateTime endAt);
}
