package com.qiyu.adapter.admin;

import jakarta.validation.constraints.NotBlank;

/** Staff assignment of the service room for an existing booking. */
public record AdminBookingRoomRequest(@NotBlank String roomId) { }
