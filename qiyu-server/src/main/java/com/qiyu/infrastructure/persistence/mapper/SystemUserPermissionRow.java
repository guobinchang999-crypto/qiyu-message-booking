package com.qiyu.infrastructure.persistence.mapper;

/** Typed persistence projection for one user-level permission grant. */
public record SystemUserPermissionRow(String permissionCode, String effect) { }
