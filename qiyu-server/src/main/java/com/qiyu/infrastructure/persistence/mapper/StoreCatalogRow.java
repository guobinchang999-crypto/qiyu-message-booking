package com.qiyu.infrastructure.persistence.mapper;

/** Typed SQL projection for a selectable store. */
public record StoreCatalogRow(String id, String name, String address, String phone, Double latitude,
                              Double longitude, String distance, Double rating, String businessStatusCode,
                              String businessStatusLabel, String nextAvailableAt, String businessHours,
                              boolean frequent, String coverImageUrl, String galleryImageUrl,
                              String galleryImageUrls, String facilities, String highlights,
                              String memberBenefitText) {}
