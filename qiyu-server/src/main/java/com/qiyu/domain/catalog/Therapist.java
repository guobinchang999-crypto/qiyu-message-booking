package com.qiyu.domain.catalog;

import java.util.List;

/**
 * Stable therapist read model used by resource selection and data-scope checks.
 * Read-only snapshot by project convention; assignment rules live in domain services.
 */
public record Therapist(
        String id, String name, String storeId, String level, Double rating,
        Integer experienceYears, Integer serviceCount, List<String> skills, Number extraFee,
        String nextAvailable, String status, String statusLabel,
        String avatarUrl, String portraitUrl, String introduction
) {}
