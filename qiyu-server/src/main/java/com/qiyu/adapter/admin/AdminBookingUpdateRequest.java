package com.qiyu.adapter.admin;

/**
 * Atomic booking update for staff workflows: schedule, therapist and room changes are applied
 * in a single transaction, so a partial failure cannot leave the booking half-modified.
 */
public record AdminBookingUpdateRequest(
        String date, String startTime, String therapistId, String roomId) { }
