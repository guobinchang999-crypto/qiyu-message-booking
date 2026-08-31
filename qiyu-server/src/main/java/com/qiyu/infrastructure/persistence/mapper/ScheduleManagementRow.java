package com.qiyu.infrastructure.persistence.mapper;

import java.time.LocalDate;
import java.time.LocalTime;

/** Typed administration projection for one therapist schedule row. */
public record ScheduleManagementRow(Long databaseId, String id, Long therapistDatabaseId,
                                    String therapistId, String therapistName, Long storeDatabaseId,
                                    String storeId, LocalDate workDate, LocalTime startTime,
                                    LocalTime endTime, String status, String remark,
                                    String createdBy, String updatedBy) {}
