package com.qiyu.application.therapist.dto;

import java.math.BigDecimal;
import java.util.List;

/** Typed administration request for creating or replacing mutable therapist data. */
public record TherapistCommand(String code, String storeId, String name, String mobile, String level,
                               List<String> skills, String status, BigDecimal rating,
                               BigDecimal specifyFee, Integer sortOrder, Boolean enabled) {
}
