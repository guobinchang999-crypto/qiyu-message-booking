package com.qiyu.infrastructure.persistence.mapper;

/** Therapist resource visible in the administration schedule board. */
public record AdminScheduleTherapistRow(String id, String name, String storeId, String status,
                                        String statusLabel, String skills) {
}
