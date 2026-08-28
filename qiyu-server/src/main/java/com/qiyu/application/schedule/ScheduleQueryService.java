package com.qiyu.application.schedule;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.domain.schedule.BookingTimeRange;
import com.qiyu.domain.schedule.TimeSlotStatus;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.infrastructure.persistence.mapper.ScheduleMapper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ScheduleQueryService {
    private final BookingGateway bookingGateway;
    private final CatalogGateway catalogProvider;
    private final ScheduleMapper scheduleMapper;
    private final boolean persistenceEnabled;

    public ScheduleQueryService(BookingGateway bookingGateway, CatalogGateway catalogProvider,
                                ObjectProvider<ScheduleMapper> scheduleMapper,
                                @Value("${qiyu.auth.persistence:false}") boolean persistenceEnabled) {
        this.bookingGateway = bookingGateway;
        this.catalogProvider = catalogProvider;
        this.scheduleMapper = scheduleMapper.getIfAvailable();
        this.persistenceEnabled = persistenceEnabled;
    }

    public List<Map<String, Object>> timeSlots(String storeId, String serviceId, String therapistId, String date) {
        catalogProvider.findStore(storeId);
        Map<String, Object> service = catalogProvider.findService(serviceId);
        Map<String, Object> therapist = catalogProvider.findTherapist(therapistId);
        LocalDate selectedDate = date == null || date.isBlank() ? LocalDate.of(2026, 8, 8) : LocalDate.parse(date);
        int durationMinutes = numberValue(service, "durationMinutes");
        int preparationMinutes = numberValueOrDefault(service, "preparationMinutes", 10);
        int cleanupMinutes = numberValueOrDefault(service, "cleanupMinutes", 10);
        List<LocalTime> times = List.of(LocalTime.of(10, 0), LocalTime.of(10, 30), LocalTime.of(11, 0),
                LocalTime.of(13, 30), LocalTime.of(14, 0), LocalTime.of(15, 30), LocalTime.of(17, 0),
                LocalTime.of(19, 0), LocalTime.of(20, 30));
        return times.stream().map(time -> slot(storeId, selectedDate, time, therapistId, therapist,
                durationMinutes, preparationMinutes, cleanupMinutes)).toList();
    }

    private Map<String, Object> slot(String storeId, LocalDate date, LocalTime time, String therapistId,
                                     Map<String, Object> therapist, int durationMinutes,
                                     int preparationMinutes, int cleanupMinutes) {
        BookingTimeRange candidateRange = BookingTimeRange.of(date, time, durationMinutes, preparationMinutes, cleanupMinutes);
        boolean occupied = bookingGateway.findAll().stream().anyMatch(booking -> booking.occupiesResource()
                && booking.storeId().equals(storeId)
                && therapistId != null && therapistId.equals(booking.therapistId())
                && booking.timeRange().overlaps(candidateRange));
        if (persistenceEnabled && scheduleMapper != null) {
            occupied = occupied || !withinStoreHours(storeId, date, candidateRange)
                    || !withinTherapistSchedule(therapist, date, candidateRange);
        }
        TimeSlotStatus state = occupied ? TimeSlotStatus.FULL
                : time.equals(LocalTime.of(19, 0)) ? TimeSlotStatus.ALMOST_FULL : TimeSlotStatus.AVAILABLE;
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("time", time.toString());
        item.put("status", state.name());
        item.put("label", state.label());
        return item;
    }

    private static int numberValue(Map<String, Object> item, String key) {
        Object value = item.get(key);
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(String.valueOf(value));
    }

    private static int numberValueOrDefault(Map<String, Object> item, String key, int fallback) {
        Object value = item.get(key);
        return value instanceof Number number ? number.intValue() : fallback;
    }

    private boolean withinStoreHours(String storeId, LocalDate date, BookingTimeRange range) {
        Map<String, Object> store = catalogProvider.findStore(storeId);
        String code = storeCode(storeId);
        Map<String, Object> special = scheduleMapper.specialDay(code, date);
        if (special != null && "CLOSED".equals(String.valueOf(special.get("dayStatus")))) return false;
        Map<String, Object> hours = special == null ? scheduleMapper.storeHours(code) : special;
        if (hours == null || hours.get("openTime") == null || hours.get("closeTime") == null) return true;
        LocalTime open = asTime(hours.get("openTime"));
        LocalTime close = asTime(hours.get("closeTime"));
        return !range.serviceFrom().toLocalTime().isBefore(open) && !range.serviceTo().toLocalTime().isAfter(close)
                && !"CLOSED".equals(String.valueOf(store.get("businessStatusCode")));
    }

    private boolean withinTherapistSchedule(Map<String, Object> therapist, LocalDate date, BookingTimeRange range) {
        String code = String.valueOf(therapist.get("id")).replace("therapist-anran", "TH_JA_ANRAN")
                .replace("therapist-yuanyuan", "TH_XH_YUANYUAN").replace("therapist-lin", "TH_LJZ_LIN");
        LocalDateTime start = range.occupiedFrom();
        LocalDateTime end = range.occupiedTo();
        if (scheduleMapper.leaveConflict(code, start, end) > 0) return false;
        return scheduleMapper.scheduleCount(code, date) == 0
                || scheduleMapper.matchingSchedule(code, date, start.toLocalTime(), end.toLocalTime()) > 0;
    }

    private static LocalTime asTime(Object value) {
        return value instanceof LocalTime time ? time : LocalTime.parse(String.valueOf(value));
    }

    private static String storeCode(String storeId) {
        return storeId.replaceFirst("^store-", "").replace('-', '_').toUpperCase();
    }
}
