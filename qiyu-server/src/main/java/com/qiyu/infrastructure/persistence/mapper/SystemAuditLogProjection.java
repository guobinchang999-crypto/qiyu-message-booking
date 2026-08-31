package com.qiyu.infrastructure.persistence.mapper;

import java.time.LocalDateTime;

/** Typed persistence projection for one enriched system audit-log row. */
public record SystemAuditLogProjection(long id, String operatorName, String actionCode, String resourceType,
                                       String resourceId, String organizationName, String requestId,
                                       String detail, LocalDateTime createdAt) {
}
