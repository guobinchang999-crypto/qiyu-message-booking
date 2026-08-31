package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Immutable database row for the administration service-item table. */
public record ServiceManagementProjection(Long databaseId, String id, String code, Long categoryId,
                                          String category, String name, int durationMinutes,
                                          int preparationMinutes, int cleanupMinutes, BigDecimal price,
                                          BigDecimal memberPrice, String description, String status,
                                          Integer bookingCount, int sortOrder, String createdBy,
                                          String updatedBy) {}
