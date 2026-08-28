package com.qiyu.domain.catalog;

/** Stable room read model used by booking and schedule resource selection. */
public record Room(
        String id, String name, String storeId, String status,
        String statusLabel, String type, String note, Integer capacity, String roomKind
) {}
