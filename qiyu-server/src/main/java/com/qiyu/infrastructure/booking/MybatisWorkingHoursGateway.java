package com.qiyu.infrastructure.booking;

import com.qiyu.domain.schedule.BookingTimeRange;
import com.qiyu.domain.schedule.WorkingHoursGateway;
import com.qiyu.infrastructure.persistence.mapper.ScheduleMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisWorkingHoursGateway implements WorkingHoursGateway {
    private final ScheduleMapper mapper;
    public MybatisWorkingHoursGateway(ScheduleMapper mapper) { this.mapper = mapper; }
    @Override public void ensureAvailable(String storeId, String therapistId, BookingTimeRange range) {
        String storeCode = storeId.replaceFirst("^store-", "").replace('-', '_').toUpperCase();
        String therapistCode = switch (therapistId) {
            case "therapist-anran" -> "TH_JA_ANRAN";
            case "therapist-yuanyuan" -> "TH_XH_YUANYUAN";
            case "therapist-lin" -> "TH_LJZ_LIN";
            default -> therapistId.replaceFirst("^therapist-", "").replace('-', '_').toUpperCase();
        };
        var date = range.serviceFrom().toLocalDate();
        var special = mapper.specialDay(storeCode, date);
        var hours = special == null ? mapper.storeHours(storeCode) : special;
        if (hours == null || hours.openTime() == null || hours.closeTime() == null)
            throw new IllegalArgumentException("门店营业时间未配置，请先完善营业时间");
        if ("CLOSED".equals(hours.dayStatus()) || "CLOSED".equals(hours.businessStatus())
                || !range.serviceTo().toLocalDate().equals(date)
                || range.serviceFrom().toLocalTime().isBefore(hours.openTime())
                || range.serviceTo().toLocalTime().isAfter(hours.closeTime()))
            throw new IllegalArgumentException("所选服务时间不在门店营业时段内");
        if (mapper.leaveConflict(therapistCode, range.occupiedFrom(), range.occupiedTo()) > 0
                || (mapper.scheduleCount(therapistCode, date) > 0 && mapper.matchingSchedule(therapistCode, date,
                    range.occupiedFrom().toLocalTime(), range.occupiedTo().toLocalTime()) == 0))
            throw new IllegalArgumentException("该时段超出技师排班或与请假冲突（含准备和清洁时间）");
    }
}
