package com.qiyu.domain.catalog;

import java.util.List;

/**
 * Stable store read model shared by booking, scheduling and frontend adapters.
 * Presentation fields are allowed here by project convention: catalog records are read-only
 * snapshots, while behavior-bearing rules live in the Booking aggregate and domain services.
 */
public record Store(
        String id, String name, String address, String phone,
        Double latitude, Double longitude, String distance, Double rating,
        String businessStatusCode, String businessStatusLabel,
        String nextAvailableAt, String businessHours, boolean frequent,
        String coverImageUrl, String galleryImageUrl, List<String> galleryImageUrls,
        List<String> facilities, List<String> highlights, String memberBenefitText
) {}
