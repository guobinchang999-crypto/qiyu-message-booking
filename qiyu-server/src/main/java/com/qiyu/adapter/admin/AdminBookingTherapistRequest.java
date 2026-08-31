package com.qiyu.adapter.admin;

import jakarta.validation.constraints.NotBlank;

/** Staff reassignment of the therapist for an existing booking. */
public record AdminBookingTherapistRequest(@NotBlank String therapistId) { }
