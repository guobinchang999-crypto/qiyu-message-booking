package com.qiyu.adapter.admin;

import jakarta.validation.constraints.NotBlank;

/** Restricted staff edit: only the appointment time can be changed through this endpoint. */
public record AdminBookingRescheduleRequest(@NotBlank String date, @NotBlank String startTime) { }
