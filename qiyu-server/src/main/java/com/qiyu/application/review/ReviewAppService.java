package com.qiyu.application.review;

import com.qiyu.adapter.review.ReviewRequest;
import com.qiyu.application.booking.BookingAppService;
import com.qiyu.infrastructure.persistence.entity.ReviewImageEntity;
import com.qiyu.infrastructure.persistence.entity.ReviewTagEntity;
import com.qiyu.infrastructure.persistence.entity.ServiceReviewEntity;
import com.qiyu.infrastructure.persistence.mapper.ReviewImageMapper;
import com.qiyu.infrastructure.persistence.mapper.ReviewMapper;
import com.qiyu.infrastructure.persistence.mapper.ReviewTagMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Persistent review use cases used outside explicit Mock mode. */
@Service
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class ReviewAppService {
    private final BookingAppService bookingAppService;
    private final ReviewMapper reviewMapper;
    private final ReviewTagMapper tagMapper;
    private final ReviewImageMapper imageMapper;

    public ReviewAppService(BookingAppService bookingAppService, ReviewMapper reviewMapper,
                            ReviewTagMapper tagMapper, ReviewImageMapper imageMapper) {
        this.bookingAppService = bookingAppService;
        this.reviewMapper = reviewMapper;
        this.tagMapper = tagMapper;
        this.imageMapper = imageMapper;
    }

    public Map<String, Object> list(String storeId, String serviceId, int page, int pageSize) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.min(50, Math.max(1, pageSize));
        long total = reviewMapper.countPublished(storeId, serviceId);
        List<Map<String, Object>> items = reviewMapper.listPublished(
                storeId, serviceId, (safePage - 1) * safePageSize, safePageSize).stream()
                .map(this::withRelations).toList();
        return Map.of("items", items, "page", safePage, "pageSize", safePageSize,
                "total", total, "hasMore", (long) safePage * safePageSize < total);
    }

    @Transactional
    public Map<String, Object> submit(ReviewRequest request) {
        // detail() applies the same owner/data-scope check as every other booking operation.
        Map<String, Object> bookingView = bookingAppService.detail(request.bookingId());
        if (!"COMPLETED".equals(bookingView.get("status"))) {
            throw new IllegalArgumentException("服务完成后才可以评价");
        }
        Map<String, Object> reference = reviewMapper.bookingReference(request.bookingId());
        if (reference == null || reference.isEmpty()) throw new IllegalArgumentException("预约不存在");

        ServiceReviewEntity entity = new ServiceReviewEntity();
        entity.setBookingId(number(reference, "bookingId"));
        entity.setCustomerId(number(reference, "customerId"));
        entity.setStoreId(number(reference, "storeId"));
        entity.setTherapistId(nullableNumber(reference, "therapistId"));
        entity.setServiceItemId(number(reference, "serviceItemId"));
        entity.setTherapistRating(request.therapistRating());
        entity.setEnvironmentRating(request.storeRating());
        entity.setServiceRating(request.serviceRating());
        entity.setTags(String.join(",", safeList(request.tags())));
        entity.setContent(request.content() == null ? "" : request.content().trim());
        entity.setAnonymous(Boolean.TRUE.equals(request.anonymous()) ? 1 : 0);
        entity.setStatus("PUBLISHED");
        entity.setDeleted(0);
        try {
            reviewMapper.insert(entity);
        } catch (DuplicateKeyException exception) {
            throw new IllegalArgumentException("该预约已经评价过");
        }

        List<String> tags = safeList(request.tags());
        for (String tag : tags) {
            ReviewTagEntity tagEntity = new ReviewTagEntity();
            tagEntity.setReviewId(entity.getId());
            tagEntity.setTagName(tag);
            tagEntity.setTagType("SATISFACTION");
            tagMapper.insert(tagEntity);
        }
        List<String> images = safeList(request.imageUrls());
        for (int index = 0; index < images.size(); index++) {
            ReviewImageEntity image = new ReviewImageEntity();
            image.setReviewId(entity.getId());
            image.setImageUrl(images.get(index));
            image.setSortOrder(index);
            imageMapper.insert(image);
        }

        Map<String, Object> review = new LinkedHashMap<>();
        review.put("id", "review-" + entity.getId());
        review.put("storeId", nestedId(bookingView, "store"));
        review.put("serviceId", nestedId(bookingView, "service"));
        review.put("userName", entity.getAnonymous() == 1 ? "匿名用户" : bookingView.get("customerName"));
        review.put("rating", entity.getServiceRating());
        review.put("content", entity.getContent());
        review.put("tags", tags);
        review.put("imageUrls", images);
        review.put("createdAt", LocalDate.now().toString());
        return Map.of("bookingId", request.bookingId(), "reviewed", true, "review", review);
    }

    private Map<String, Object> withRelations(Map<String, Object> source) {
        Map<String, Object> item = new LinkedHashMap<>(source);
        long reviewId = ((Number) source.get("id")).longValue();
        item.put("id", "review-" + reviewId);
        item.put("tags", tagMapper.names(reviewId));
        item.put("imageUrls", imageMapper.urls(reviewId));
        return item;
    }

    private static List<String> safeList(List<String> values) {
        if (values == null) return List.of();
        List<String> result = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) result.add(value.trim());
        }
        return List.copyOf(result);
    }

    @SuppressWarnings("unchecked")
    private static String nestedId(Map<String, Object> source, String key) {
        Object nested = source.get(key);
        return nested instanceof Map<?, ?> map ? String.valueOf(((Map<String, Object>) map).get("id")) : "";
    }

    private static long number(Map<String, Object> row, String key) {
        return ((Number) row.get(key)).longValue();
    }

    private static Long nullableNumber(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value instanceof Number number ? number.longValue() : null;
    }
}
