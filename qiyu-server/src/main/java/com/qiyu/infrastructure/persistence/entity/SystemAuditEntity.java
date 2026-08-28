package com.qiyu.infrastructure.persistence.entity;

/** Explicit audit write model for system-management mutations. */
public record SystemAuditEntity(long operatorId, String action, String resourceType, String resourceId) { }
