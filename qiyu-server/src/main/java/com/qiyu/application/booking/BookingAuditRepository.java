package com.qiyu.application.booking;

import com.qiyu.application.booking.dto.ReceptionModels.Audit;
import java.util.List;

public interface BookingAuditRepository {
    List<Audit> list(String bookingId);
}
