package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed database projection used to rebuild the existing administration therapist contract. */
public record TherapistManagementProjection(String id, String name, String store, String level, String skills,
                                             String status, BigDecimal rating, long todayBookings, String code,
                                             String storeId, String mobile, BigDecimal specifyFee, boolean enabled) {
}
