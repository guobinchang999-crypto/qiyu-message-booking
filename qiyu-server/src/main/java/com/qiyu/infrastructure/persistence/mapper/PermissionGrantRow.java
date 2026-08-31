package com.qiyu.infrastructure.persistence.mapper;

/** One effective allow or deny grant resolved from role and user assignments. */
public record PermissionGrantRow(String permissionCode, String effect) {}
