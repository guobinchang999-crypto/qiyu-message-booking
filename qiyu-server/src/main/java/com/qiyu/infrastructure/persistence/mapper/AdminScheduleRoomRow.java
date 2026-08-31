package com.qiyu.infrastructure.persistence.mapper;

/** Room resource visible in the administration schedule board. */
public record AdminScheduleRoomRow(String id, String name, String storeId, String status,
                                   String statusLabel, String type, String note) {
}
