package com.qiyu.infrastructure.booking;

import com.qiyu.application.booking.BookingAuditRepository;
import com.qiyu.application.booking.dto.ReceptionModels.Audit;
import com.qiyu.infrastructure.persistence.mapper.ReceptionMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
@ConditionalOnProperty(name="qiyu.auth.persistence", havingValue="true")
public class MybatisBookingAuditRepository implements BookingAuditRepository {
    private final ReceptionMapper mapper;
    public MybatisBookingAuditRepository(ReceptionMapper mapper) { this.mapper=mapper; }
    public List<Audit> list(String bookingId) { return mapper.bookingAudit(bookingId); }
}
