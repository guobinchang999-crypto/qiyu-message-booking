package com.qiyu.domain.therapist;

public enum TherapistStatus {
    AVAILABLE("可预约"),
    BUSY("服务中"),
    OFF_DUTY("休息"),
    ON_LEAVE("请假");

    private final String label;

    TherapistStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
