package com.qiyu.application.schedule;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.domain.schedule.BookingTimeRange;
import com.qiyu.domain.schedule.TimeSlotStatus;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ScheduleQueryService {
    private final BookingGateway bookingGateway;
    private final MockCatalogProvider catalogProvider;

    public ScheduleQueryService(BookingGateway bookingGateway, MockCatalogProvider catalogProvider) {
        this.bookingGateway = bookingGateway;
        this.catalogProvider = catalogProvider;
    }

    public List<Map<String, Object>> timeSlots(String storeId, String serviceId, String therapistId, String date) {
        catalogProvider.findStore(storeId);
        Map<String, Object> service = catalogProvider.findService(serviceId);
        catalogProvider.findTherapist(therapistId);
        LocalDate selectedDate = date == null || date.isBlank() ? LocalDate.of(2026, 8, 8) : LocalDate.parse(date);
        int durationMinutes = numberValue(service, "durationMinutes");
        List<LocalTime> times = List.of(LocalTime.of(10, 0), LocalTime.of(10, 30), LocalTime.of(11, 0),
                LocalTime.of(13, 30), LocalTime.of(14, 0), LocalTime.of(15, 30), LocalTime.of(17, 0),
                LocalTime.of(19, 0), LocalTime.of(20, 30));
        return times.stream().map(time -> slot(storeId, selectedDate, time, therapistId, durationMinutes)).toList();
    }

    private Map<String, Object> slot(String storeId, LocalDate date, LocalTime time, String therapistId, int durationMinutes) {
        BookingTimeRange candidateRange = BookingTimeRange.of(date, time, durationMinutes, 10, 10);
        boolean occupied = bookingGateway.findAll().stream().anyMatch(booking -> booking.occupiesResource()
                && booking.storeId().equals(storeId)
                && booking.therapistId().equals(therapistId)
                && booking.timeRange().overlaps(candidateRange));
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
}
