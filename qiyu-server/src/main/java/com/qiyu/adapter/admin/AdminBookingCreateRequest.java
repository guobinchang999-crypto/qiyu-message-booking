package com.qiyu.adapter.admin;

import jakarta.validation.constraints.NotBlank;

/** Staff booking input; customer identity is resolved by the server from the mobile number. */
public record AdminBookingCreateRequest(
        @NotBlank String storeId, @NotBlank String serviceId, String therapistId, String roomId,
        @NotBlank String date, @NotBlank String startTime, @NotBlank String customerName,
        @NotBlank String mobile, String couponId,
        @NotBlank(message = "缺少幂等请求标识") String requestId) { }
