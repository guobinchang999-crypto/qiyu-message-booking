package com.qiyu.application.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record BookingCreateCommand(
        @NotBlank String storeId,
        @NotBlank String serviceId,
        // Blank means the backend should assign the first eligible available therapist.
        String therapistId,
        String roomId,
        @NotBlank String date,
        @NotBlank String startTime,
        @NotBlank String customerName,
        @NotBlank String mobile,
        String couponId,
        @NotBlank String requestId
) { }
