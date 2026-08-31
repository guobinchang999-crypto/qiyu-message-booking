package com.qiyu.infrastructure.persistence.mapper;

import java.time.LocalDate;
import java.time.LocalTime;

/** One persisted therapist schedule entry in the current calendar week. */
public record AdminScheduleEntryRow(String therapistId, LocalDate workDate, LocalTime startTime,
                                    LocalTime endTime, String status, String remark) {
}
