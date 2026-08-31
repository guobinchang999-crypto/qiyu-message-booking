package com.qiyu.application.therapist.dto;

import java.math.BigDecimal;
import java.util.List;

/** Typed administration response returned after a therapist mutation. */
public record TherapistView(String id, String code, String storeId, String store, String name, String mobile,
                            String level, List<String> skills, String status, BigDecimal rating,
                            long todayBookings, BigDecimal specifyFee, boolean enabled) {
}
