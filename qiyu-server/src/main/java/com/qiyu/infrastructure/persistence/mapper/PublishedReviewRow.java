package com.qiyu.infrastructure.persistence.mapper;

/** Typed SQL projection for a published review before tags and images are joined. */
public record PublishedReviewRow(long id, String storeId, String serviceId, String userName,
                                 Double rating, String content, String createdAt) {}
