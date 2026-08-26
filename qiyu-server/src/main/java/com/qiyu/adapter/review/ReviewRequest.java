package com.qiyu.adapter.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record ReviewRequest(
        @NotBlank(message = "预约编号不能为空") String bookingId,
        @Min(value = 1, message = "评分范围为 1-5") @Max(value = 5, message = "评分范围为 1-5") int storeRating,
        @Min(value = 1, message = "评分范围为 1-5") @Max(value = 5, message = "评分范围为 1-5") int therapistRating,
        @Min(value = 1, message = "评分范围为 1-5") @Max(value = 5, message = "评分范围为 1-5") int serviceRating,
        List<String> tags,
        String content,
        Boolean anonymous,
        List<String> imageUrls
) { }
