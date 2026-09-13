package com.qiyu.adapter.booking;

import jakarta.validation.constraints.NotBlank;

public record BookingCreateRequest(
        @NotBlank(message = "门店不能为空") String storeId,
        @NotBlank(message = "服务项目不能为空") String serviceId,
        // Blank means the backend should assign the first eligible available therapist.
        String therapistId,
        String roomId,
        @NotBlank(message = "预约日期不能为空") String date,
        @NotBlank(message = "预约时间不能为空") String startTime,
        @NotBlank(message = "客户姓名不能为空") String customerName,
        @NotBlank(message = "手机号不能为空") String mobile,
        String couponId,
        @NotBlank(message = "缺少幂等请求标识") String requestId
) { }
