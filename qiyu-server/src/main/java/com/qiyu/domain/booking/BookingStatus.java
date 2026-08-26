package com.qiyu.domain.booking;

public enum BookingStatus {
    PENDING_PAYMENT("待支付"),
    BOOKED("已预约"),
    CHECKED_IN("已签到"),
    WAITING_SERVICE("待服务"),
    IN_SERVICE("服务中"),
    PENDING_SETTLEMENT("待结算"),
    COMPLETED("已完成"),
    CANCELLED("已取消");

    private final String label;

    BookingStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
