package com.qiyu.infrastructure.persistence.mapper;

/** Typed stable store identity used by room mutations. */
public record RoomStoreIdentityRow(Long databaseId, String id, String name) {
}
