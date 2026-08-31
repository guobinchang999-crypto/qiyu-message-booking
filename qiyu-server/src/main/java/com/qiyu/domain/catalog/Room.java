package com.qiyu.domain.catalog;

/**
 * Stable room read model used by booking and schedule resource selection.
 * Read-only snapshot by project convention; occupancy rules live in the Booking aggregate.
 */
public record Room(
        String id, String name, String storeId, String status,
        String statusLabel, String type, String note, Integer capacity, String roomKind
) {}
