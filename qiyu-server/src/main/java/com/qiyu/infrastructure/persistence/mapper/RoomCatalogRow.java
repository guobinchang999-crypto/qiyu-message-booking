package com.qiyu.infrastructure.persistence.mapper;

/** Typed SQL projection for a store room. */
public record RoomCatalogRow(String id, String name, String storeId, String status, String statusLabel,
                             String type, String note, Integer capacity, String roomKind) {}
