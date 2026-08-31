package com.qiyu.infrastructure.schedule;

import com.qiyu.application.schedule.ScheduleManagementRepository;
import com.qiyu.infrastructure.persistence.entity.TherapistScheduleEntity;
import com.qiyu.infrastructure.persistence.mapper.ScheduleManagementMapper;
import com.qiyu.infrastructure.persistence.mapper.ScheduleManagementRow;
import com.qiyu.infrastructure.persistence.mapper.ScheduleTherapistIdentityRow;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/** Production schedule repository implemented through MyBatis-Plus and typed mapper queries. */
@Repository
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class MybatisPlusScheduleManagementRepository implements ScheduleManagementRepository {
    private final ScheduleManagementMapper mapper;

    public MybatisPlusScheduleManagementRepository(ScheduleManagementMapper mapper) { this.mapper = mapper; }

    @Override
    public List<ScheduleRecord> list(ScheduleAccess access, LocalDate startDate, LocalDate endDate) {
        return mapper.list(access.allStores(), access.storeIds(), startDate, endDate).stream()
                .map(MybatisPlusScheduleManagementRepository::record).toList();
    }

    @Override
    public Optional<ScheduleRecord> find(String scheduleId) {
        Long id = databaseId(scheduleId);
        return id == null ? Optional.empty() : Optional.ofNullable(mapper.findByDatabaseId(id))
                .map(MybatisPlusScheduleManagementRepository::record);
    }

    @Override
    public Optional<TherapistIdentity> findTherapist(String therapistId) {
        return Optional.ofNullable(mapper.findTherapist(therapistId)).map(MybatisPlusScheduleManagementRepository::therapist);
    }

    @Override
    public boolean scheduleOverlaps(long therapistId, LocalDate date, LocalTime start, LocalTime end, Long excludedId) {
        return mapper.scheduleOverlapCount(therapistId, date, start, end, excludedId) > 0;
    }

    @Override
    public boolean bookingOverlaps(long therapistId, LocalDate date, LocalTime start, LocalTime end) {
        return mapper.bookingOverlapCount(therapistId, date, start, end) > 0;
    }

    @Override
    public ScheduleRecord save(ScheduleRecord value) {
        TherapistScheduleEntity entity = entity(value);
        if (entity.getId() == null) mapper.insert(entity); else mapper.updateById(entity);
        ScheduleManagementRow row = mapper.findByDatabaseId(entity.getId());
        if (row == null) throw new IllegalStateException("排班保存成功但读取模型尚未同步");
        return record(row);
    }

    @Override
    public void delete(long databaseId) { mapper.deleteById(databaseId); }

    private static TherapistScheduleEntity entity(ScheduleRecord value) {
        TherapistScheduleEntity entity = new TherapistScheduleEntity();
        entity.setId(value.databaseId()); entity.setTherapistId(value.therapistDatabaseId());
        entity.setStoreId(value.storeDatabaseId()); entity.setWorkDate(value.workDate());
        entity.setStartTime(value.startTime()); entity.setEndTime(value.endTime());
        entity.setScheduleStatus(value.status()); entity.setRemark(value.remark());
        entity.setCreatedBy(value.createdBy()); entity.setUpdatedBy(value.updatedBy());
        return entity;
    }

    private static ScheduleRecord record(ScheduleManagementRow value) {
        return new ScheduleRecord(value.databaseId(), value.id(), value.therapistDatabaseId(), value.therapistId(),
                value.therapistName(), value.storeDatabaseId(), value.storeId(), value.workDate(), value.startTime(),
                value.endTime(), value.status(), value.remark(), value.createdBy(), value.updatedBy());
    }

    private static TherapistIdentity therapist(ScheduleTherapistIdentityRow value) {
        return new TherapistIdentity(value.databaseId(), value.id(), value.storeDatabaseId(), value.storeId(), value.name());
    }

    private static Long databaseId(String value) {
        if (value == null || !value.matches("schedule-[1-9][0-9]*")) return null;
        try { return Long.valueOf(value.substring("schedule-".length())); }
        catch (NumberFormatException exception) { return null; }
    }
}
