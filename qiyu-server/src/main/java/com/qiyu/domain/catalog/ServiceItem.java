package com.qiyu.domain.catalog;

import java.util.List;

/**
 * Stable service-item read model with the values required for booking validation and display.
 * Read-only snapshot by project convention; booking invariants live in domain services.
 */
public record ServiceItem(
        String id, String name, Integer durationMinutes, Integer preparationMinutes,
        Integer cleanupMinutes, Number price, Number memberPrice, String category,
        Integer salesCount, List<String> tags, String description, List<String> processSteps,
        String suitableFor, String notices, String coverImageUrl, String bannerImageUrl,
        String image
) {}
