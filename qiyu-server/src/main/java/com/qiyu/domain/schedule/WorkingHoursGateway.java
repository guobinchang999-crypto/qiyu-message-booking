package com.qiyu.domain.schedule;

/** Validates operational hours without leaking SQL into booking use cases. */
public interface WorkingHoursGateway {
    void ensureAvailable(String storeId, String therapistId, BookingTimeRange range);
}
