package com.qiyu.application.booking;

import jakarta.validation.constraints.NotBlank;

public record BookingCreateCommand(
        @NotBlank String storeId,
        @NotBlank String serviceId,
        @NotBlank String therapistId,
        String roomId,
        @NotBlank String date,
        @NotBlank String startTime,
        @NotBlank String customerName,
        @NotBlank String mobile,
        String couponId
) { }
