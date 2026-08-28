package com.qiyu.application.schedule;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.domain.schedule.BookingTimeRange;
import com.qiyu.domain.schedule.TimeSlotStatus;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;
import com.qiyu.infrastructure.persistence.mapper.ScheduleMapper;
import com.qiyu.infrastructure.persistence.mapper.StoreHoursRow;
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

    /** Calculates selectable time slots after applying booking conflicts and working-hour rules. */
    public List<TimeSlotVO> timeSlots(String storeId, String serviceId, String therapistId, String date) {
        catalogProvider.findStore(storeId);
        ServiceItem service = catalogProvider.findService(serviceId);
        Therapist therapist = catalogProvider.findTherapist(therapistId);
        LocalDate selectedDate = date == null || date.isBlank() ? LocalDate.of(2026, 8, 8) : LocalDate.parse(date);
        int durationMinutes = service.durationMinutes();
        int preparationMinutes = service.preparationMinutes() == null ? 10 : service.preparationMinutes();
        int cleanupMinutes = service.cleanupMinutes() == null ? 10 : service.cleanupMinutes();
        List<LocalTime> times = List.of(LocalTime.of(10, 0), LocalTime.of(10, 30), LocalTime.of(11, 0),
                LocalTime.of(13, 30), LocalTime.of(14, 0), LocalTime.of(15, 30), LocalTime.of(17, 0),
                LocalTime.of(19, 0), LocalTime.of(20, 30));
        return times.stream().map(time -> slot(storeId, selectedDate, time, therapistId, therapist,
                durationMinutes, preparationMinutes, cleanupMinutes)).toList();
    }

    private TimeSlotVO slot(String storeId, LocalDate date, LocalTime time, String therapistId,
                                     Therapist therapist, int durationMinutes,
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
        return new TimeSlotVO(time.toString(), state.name(), state.label());
    }

    private boolean withinStoreHours(String storeId, LocalDate date, BookingTimeRange range) {
        Store store = catalogProvider.findStore(storeId);
        String code = storeCode(storeId);
        StoreHoursRow special = scheduleMapper.specialDay(code, date);
        if (special != null && "CLOSED".equals(special.dayStatus())) return false;
        StoreHoursRow hours = special == null ? scheduleMapper.storeHours(code) : special;
        if (hours == null || hours.openTime() == null || hours.closeTime() == null) return true;
        LocalTime open = hours.openTime();
        LocalTime close = hours.closeTime();
        return !range.serviceFrom().toLocalTime().isBefore(open) && !range.serviceTo().toLocalTime().isAfter(close)
                && !"CLOSED".equals(store.businessStatusCode());
    }

    private boolean withinTherapistSchedule(Therapist therapist, LocalDate date, BookingTimeRange range) {
        String code = therapist.id().replace("therapist-anran", "TH_JA_ANRAN")
                .replace("therapist-yuanyuan", "TH_XH_YUANYUAN").replace("therapist-lin", "TH_LJZ_LIN");
        LocalDateTime start = range.occupiedFrom();
        LocalDateTime end = range.occupiedTo();
        if (scheduleMapper.leaveConflict(code, start, end) > 0) return false;
        return scheduleMapper.scheduleCount(code, date) == 0
                || scheduleMapper.matchingSchedule(code, date, start.toLocalTime(), end.toLocalTime()) > 0;
    }

    private static String storeCode(String storeId) {
        return storeId.replaceFirst("^store-", "").replace('-', '_').toUpperCase();
    }

    /** JSON-compatible slot response consumed by the mini program and admin schedule views. */
    public record TimeSlotVO(String time, String status, String label) {}
}
