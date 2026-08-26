package com.qiyu.domain.payment;

public enum PaymentStatus {
    UNPAID("待支付"),
    DEPOSIT_PAID("已付订金"),
    PAID("已支付"),
    REFUNDED("已退款"),
    CLOSED("已关闭");

    private final String label;

    PaymentStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
