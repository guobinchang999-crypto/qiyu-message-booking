package com.qiyu.application.review;

import com.qiyu.adapter.review.ReviewRequest;
import com.qiyu.application.booking.BookingAppService;
import com.qiyu.application.booking.BookingVO;
import com.qiyu.infrastructure.persistence.entity.ReviewImageEntity;
import com.qiyu.infrastructure.persistence.entity.ReviewTagEntity;
import com.qiyu.infrastructure.persistence.entity.ServiceReviewEntity;
import com.qiyu.infrastructure.persistence.mapper.ReviewImageMapper;
import com.qiyu.infrastructure.persistence.mapper.ReviewMapper;
import com.qiyu.infrastructure.persistence.mapper.ReviewTagMapper;
import com.qiyu.infrastructure.persistence.mapper.PublishedReviewRow;
import com.qiyu.infrastructure.persistence.mapper.BookingReferenceRow;
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

    /** Returns published reviews with bounded pagination. */
    public ReviewResponseModels.Page list(String storeId, String serviceId, int page, int pageSize) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.min(50, Math.max(1, pageSize));
        long total = reviewMapper.countPublished(storeId, serviceId);
        List<ReviewRow> items = reviewMapper.listPublished(
                storeId, serviceId, (safePage - 1) * safePageSize, safePageSize).stream()
                .map(this::withRelations).toList();
        return new ReviewResponseModels.Page(items.stream().map(ReviewRow::toView).toList(), safePage, safePageSize,
                total, (long) safePage * safePageSize < total);
    }

    @Transactional
    /** Validates ownership and completion state before persisting one customer review. */
    public ReviewResponseModels.SubmitResult submit(ReviewRequest request) {
        // detail() applies the same owner/data-scope check as every other booking operation.
        BookingVO bookingView = bookingAppService.detail(request.bookingId());
        if (!"COMPLETED".equals(bookingView.status())) {
            throw new IllegalArgumentException("服务完成后才可以评价");
        }
        BookingReferenceRow reference = reviewMapper.bookingReference(request.bookingId());
        if (reference == null) throw new IllegalArgumentException("预约不存在");

        ServiceReviewEntity entity = new ServiceReviewEntity();
        entity.setBookingId(reference.bookingId());
        entity.setCustomerId(reference.customerId());
        entity.setStoreId(reference.storeId());
        entity.setTherapistId(reference.therapistId());
        entity.setServiceItemId(reference.serviceItemId());
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

        ReviewResponseModels.Review review = new ReviewResponseModels.Review("review-" + entity.getId(), bookingView.store().id(),
                bookingView.service().id(), entity.getAnonymous() == 1 ? "匿名用户" : bookingView.customerName(),
                entity.getServiceRating().doubleValue(), entity.getContent(), tags, images, LocalDate.now().toString());
        return new ReviewResponseModels.SubmitResult(request.bookingId(), true, review);
    }

    private ReviewRow withRelations(PublishedReviewRow source) {
        long reviewId = source.id();
        return new ReviewRow(reviewId, source.storeId(), source.serviceId(), source.userName(), source.rating(),
                source.content(), tagMapper.names(reviewId), imageMapper.urls(reviewId), source.createdAt());
    }

    private record ReviewRow(long id, String storeId, String serviceId, String userName, Double rating, String content,
                             List<String> tags, List<String> imageUrls, String createdAt) {
        private ReviewResponseModels.Review toView() { return new ReviewResponseModels.Review("review-" + id, storeId, serviceId, userName, rating, content, tags, imageUrls, createdAt); }
    }

    private static List<String> safeList(List<String> values) {
        if (values == null) return List.of();
        List<String> result = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) result.add(value.trim());
        }
        return List.copyOf(result);
    }

}
