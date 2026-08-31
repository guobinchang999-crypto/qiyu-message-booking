package com.qiyu.infrastructure.persistence.mapper;

/** Trusted therapist and store identity resolved from one stable therapist API ID. */
public record ScheduleTherapistIdentityRow(Long databaseId, String id, Long storeDatabaseId,
                                           String storeId, String name) {}
