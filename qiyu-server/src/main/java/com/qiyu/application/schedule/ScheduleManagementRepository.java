package com.qiyu.application.schedule;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Persistence port for scoped therapist schedule management. */
public interface ScheduleManagementRepository {
    List<ScheduleRecord> list(ScheduleAccess access, LocalDate startDate, LocalDate endDate);
    Optional<ScheduleRecord> find(String scheduleId);
    Optional<TherapistIdentity> findTherapist(String therapistId);
    boolean scheduleOverlaps(long therapistDatabaseId, LocalDate workDate, LocalTime startTime,
                             LocalTime endTime, Long excludedScheduleId);
    boolean bookingOverlaps(long therapistDatabaseId, LocalDate workDate, LocalTime startTime, LocalTime endTime);
    ScheduleRecord save(ScheduleRecord schedule);
    void delete(long databaseId);

    record ScheduleAccess(boolean allStores, Collection<String> storeIds) {}
    record TherapistIdentity(long databaseId, String id, long storeDatabaseId, String storeId, String name) {}
    record ScheduleRecord(Long databaseId, String id, long therapistDatabaseId, String therapistId,
                          String therapistName, long storeDatabaseId, String storeId, LocalDate workDate,
                          LocalTime startTime, LocalTime endTime, String status, String remark,
                          String createdBy, String updatedBy) {}
}
