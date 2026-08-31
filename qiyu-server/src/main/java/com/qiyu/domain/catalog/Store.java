package com.qiyu.domain.catalog;

import java.util.List;

/** Stable store read model shared by booking, scheduling and frontend adapters. */
public record Store(
        String id, String name, String address, String phone,
        Double latitude, Double longitude, String distance, Double rating,
        String businessStatusCode, String businessStatusLabel,
        String nextAvailableAt, String businessHours, boolean frequent,
        String coverImageUrl, String galleryImageUrl, List<String> galleryImageUrls,
        List<String> facilities, List<String> highlights, String memberBenefitText
) {}
