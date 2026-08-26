package com.qiyu.adapter.booking;

import jakarta.validation.constraints.NotBlank;

public record BookingRescheduleRequest(
        @NotBlank(message = "预约日期不能为空") String date,
        @NotBlank(message = "预约时间不能为空") String startTime,
        String therapistId,
        String roomId
) { }
