package com.qiyu.infrastructure.persistence.mapper;

/** Typed identity projection used to rebuild an authenticated principal from the database. */
public record AuthPrincipalRow(long userId, String userType, String displayName, String credentialHash,
                               Long customerId, String therapistCode) {}
