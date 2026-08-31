package com.qiyu.infrastructure.persistence.mapper;

/** Actual appointment and scheduled-work minutes used to calculate therapist utilization. */
public record AdminTherapistUtilizationRow(String name, long bookingCount, long scheduledMinutes,
                                           long bookedMinutes) {
}
