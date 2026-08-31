package com.qiyu.infrastructure.persistence.mapper;

/** Typed persistence projection for one system role list row. */
public record SystemRoleProjection(long id, String roleCode, String roleName, String permissionCodes,
                                   String deniedPermissionCodes, String dataScopes, long userCount, String status) {
}
