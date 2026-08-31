package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Immutable projection for one scoped therapist administration row. */
public record AdminTherapistProfileProjection(String id, String name, String store, String level, String skills,
                                              String status, BigDecimal rating, long todayBookings, String code,
                                              String storeId, String mobile, BigDecimal specifyFee, boolean enabled) {
}
