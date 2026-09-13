package com.qiyu.application.review.dto;

import java.util.List;

/** Typed review responses used by the client review workflow. */
public final class ReviewResponseModels {
    private ReviewResponseModels() {}
    public record Review(String id, String storeId, String serviceId, String userName, Double rating,
                         String content, List<String> tags, List<String> imageUrls, String createdAt) {}
    public record Page(List<Review> items, int page, int pageSize, long total, boolean hasMore) {}
    public record SubmitResult(String bookingId, boolean reviewed, Review review) {}
    public record ImageUpload(String imageUrl, String fileName) {}
}
