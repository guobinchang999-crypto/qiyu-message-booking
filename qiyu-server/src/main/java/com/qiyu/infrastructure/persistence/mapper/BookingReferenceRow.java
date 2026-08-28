package com.qiyu.infrastructure.persistence.mapper;

/** Typed SQL projection used when attaching a review to a completed booking. */
public record BookingReferenceRow(long bookingId, long customerId, long storeId,
                                  Long therapistId, long serviceItemId) {}
