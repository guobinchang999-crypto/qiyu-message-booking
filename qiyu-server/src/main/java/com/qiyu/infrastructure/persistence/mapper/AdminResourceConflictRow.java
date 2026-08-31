package com.qiyu.infrastructure.persistence.mapper;

import java.time.LocalDateTime;

/** A real overlapping resource occupation detected by the database read model. */
public record AdminResourceConflictRow(String storeName, String resourceName, LocalDateTime conflictAt) {
}
