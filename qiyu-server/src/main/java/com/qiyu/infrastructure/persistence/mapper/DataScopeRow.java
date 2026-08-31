package com.qiyu.infrastructure.persistence.mapper;

/** One persisted scope definition before store and region assignments are expanded. */
public record DataScopeRow(String resourceCode, String actionCode, String scopeType) {}
