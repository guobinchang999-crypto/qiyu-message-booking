package com.qiyu.domain.schedule;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** Service time also occupies preparation and cleaning buffers. */
public record BookingTimeRange(LocalDateTime occupiedFrom, LocalDateTime occupiedTo,
                               LocalDateTime serviceFrom, LocalDateTime serviceTo) {
    public static BookingTimeRange of(LocalDate date, LocalTime startTime, int durationMinutes,
                                      int preparationMinutes, int cleaningMinutes) {
        LocalDateTime serviceFrom = LocalDateTime.of(date, startTime);
        LocalDateTime serviceTo = serviceFrom.plusMinutes(durationMinutes);
        return new BookingTimeRange(serviceFrom.minusMinutes(preparationMinutes),
                serviceTo.plusMinutes(cleaningMinutes), serviceFrom, serviceTo);
    }

    public boolean overlaps(BookingTimeRange other) {
        return occupiedFrom.isBefore(other.occupiedTo) && other.occupiedFrom.isBefore(occupiedTo);
    }
}
