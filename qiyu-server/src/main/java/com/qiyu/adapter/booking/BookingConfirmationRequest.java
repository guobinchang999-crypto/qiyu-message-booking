package com.qiyu.adapter.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BookingConfirmationRequest(
        @NotBlank String storeId,
        @NotBlank String serviceId,
        String therapistId,
        @NotBlank String date,
        @NotBlank String startTime,
        @NotNull Integer guestCount,
        String customerName,
        String remark,
        String couponId
) {
}
