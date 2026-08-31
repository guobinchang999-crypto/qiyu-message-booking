package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed SQL projection for a bookable service item. */
public record ServiceCatalogRow(String id, String name, Integer durationMinutes, Integer preparationMinutes,
                                Integer cleanupMinutes, BigDecimal price, BigDecimal memberPrice,
                                String category, Integer salesCount, String tags, String description,
                                String processSteps, String suitableFor, String notices, String coverImageUrl,
                                String bannerImageUrl) {}
