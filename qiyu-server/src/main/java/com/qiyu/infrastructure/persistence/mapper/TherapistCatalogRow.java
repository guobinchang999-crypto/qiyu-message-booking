package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed SQL projection for a therapist available to catalog selection. */
public record TherapistCatalogRow(String id, String name, String storeId, String level, Double rating,
                                  Integer experienceYears, Integer serviceCount, String skills, BigDecimal extraFee,
                                  String nextAvailable, String status, String statusLabel, String avatarUrl,
                                  String portraitUrl, String introduction) {}
