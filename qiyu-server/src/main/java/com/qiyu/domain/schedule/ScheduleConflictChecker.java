package com.qiyu.domain.schedule;

import com.qiyu.domain.booking.Booking;

import java.util.Collection;

public class ScheduleConflictChecker {
    public void ensureAvailable(Booking candidate, Collection<Booking> existingBookings) {
        boolean conflict = existingBookings.stream()
                .filter(Booking::occupiesResource)
                .filter(existing -> existing.storeId().equals(candidate.storeId()))
                .anyMatch(existing -> (sameNonBlank(existing.therapistId(), candidate.therapistId())
                        || sameNonBlank(existing.roomId(), candidate.roomId()))
                        && existing.timeRange().overlaps(candidate.timeRange()));
        if (conflict) {
            throw new IllegalArgumentException("所选技师或房间在该时段已有预约，请重新选择时间");
        }
    }

    private static boolean sameNonBlank(String left, String right) {
        return left != null && !left.isBlank() && left.equals(right);
    }
}
