package com.qiyu.domain.booking;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** Booking number: the stable external identifier shown to customers and staff. */
public record BookingNo(String value) {
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

    public BookingNo {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("预约编号不能为空");
        }
    }

    public static BookingNo timestamped() {
        return new BookingNo("BK-" + TIMESTAMP.format(LocalDateTime.now()));
    }

    public static BookingNo demo(int sequence) {
        return new BookingNo("BK-202608-" + sequence);
    }
}
