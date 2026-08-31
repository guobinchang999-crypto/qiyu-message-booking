package com.qiyu.infrastructure.persistence.mapper;

/** Typed persistence projection for one system organization list row. */
public record SystemOrganizationProjection(long id, Long parentId, String deptCode, String deptName,
                                           String leader, int sortOrder, String status) {
}
