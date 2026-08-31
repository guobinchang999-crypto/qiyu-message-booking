package com.qiyu.infrastructure.persistence.mapper;

/** Typed projection for one administration room row. */
public record RoomManagementRow(Long databaseId, String id, Long storeDatabaseId, String storeId, String storeName,
                                String code, String name, String kind, Integer capacity, String status,
                                String note, Integer sortOrder, Boolean enabled) {
}
