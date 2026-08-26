package com.qiyu.domain.schedule;

public enum TimeSlotStatus {
    AVAILABLE("可预约"),
    ALMOST_FULL("即将约满"),
    FULL("已约满"),
    CLOSED("不可预约");

    private final String label;

    TimeSlotStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
