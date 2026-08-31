package com.qiyu.infrastructure.persistence.mapper;

import java.time.LocalDateTime;

/** Typed projection for one representative row of a uniform user-level scope override. */
public record UserDataScopeRow(String scopeType, LocalDateTime validFrom, LocalDateTime validUntil) {
}

