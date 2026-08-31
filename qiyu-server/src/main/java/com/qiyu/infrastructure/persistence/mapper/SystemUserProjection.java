package com.qiyu.infrastructure.persistence.mapper;

import java.time.LocalDateTime;

/** Typed persistence projection for one system user list row. */
public record SystemUserProjection(long id, String username, String displayName, String phone,
                                   String departmentName, String roleNames, String dataScopes,
                                   String status, LocalDateTime lastLoginAt) {
}
