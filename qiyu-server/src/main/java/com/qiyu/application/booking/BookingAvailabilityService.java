package com.qiyu.application.booking;

import com.qiyu.domain.booking.Booking;
import com.qiyu.domain.booking.BookingDomainService;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.schedule.ScheduleConflictChecker;
import com.qiyu.domain.schedule.WorkingHoursGateway;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

/** The same validation runs on staff previews and all booking writes. */
@Service
public class BookingAvailabilityService {
    private final BookingGateway bookings;
    private final CatalogGateway catalog;
    private final ObjectProvider<WorkingHoursGateway> hours;
    public BookingAvailabilityService(BookingGateway bookings, CatalogGateway catalog, ObjectProvider<WorkingHoursGateway> hours) {
        this.bookings = bookings; this.catalog = catalog; this.hours = hours;
    }
    public void validate(Booking candidate) {
        var rules = new BookingDomainService();
        var therapist = catalog.findTherapist(candidate.therapistId());
        var room = catalog.findRoom(candidate.roomId());
        rules.ensureTherapistBelongsToStore(candidate.storeId(), therapist);
        rules.ensureRoomBelongsToStore(candidate.storeId(), room);
        if ("CLOSED".equals(catalog.findStore(candidate.storeId()).businessStatusCode()))
            throw new IllegalArgumentException("门店当前暂停预约，请选择其他门店");
        if (java.util.Set.of("LEAVE", "REST", "ON_LEAVE", "OFF_DUTY", "DISABLED").contains(therapist.status()))
            throw new IllegalArgumentException("该技师当前不可安排服务");
        if (java.util.Set.of("MAINTENANCE", "CLEANING", "DISABLED").contains(room.status()))
            throw new IllegalArgumentException("该房间正在清洁或维护，请选择其他房间");
        hours.ifAvailable(gateway -> gateway.ensureAvailable(candidate.storeId(), candidate.therapistId(), candidate.timeRange()));
        new ScheduleConflictChecker().ensureAvailable(candidate, bookings.findAll().stream()
                .filter(row -> !row.id().equals(candidate.id())).toList());
    }
}
