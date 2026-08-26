package com.qiyu.domain.room;

public enum RoomStatus {
    AVAILABLE("空闲"),
    BOOKED("已预约"),
    IN_USE("使用中"),
    CLEANING("清洁中"),
    MAINTENANCE("维护中");

    private final String label;

    RoomStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
