package com.qiyu.adapter.review;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.booking.BookingAppService;
import com.qiyu.application.booking.BookingVO;
import com.qiyu.application.review.ReviewResponseModels;
import com.qiyu.application.media.MediaAppService;
import com.qiyu.application.review.ReviewAppService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/reviews")
@SaCheckLogin
public class ReviewController {
    private final BookingAppService bookingAppService;
    private final MediaAppService mediaAppService;
    private final ReviewAppService persistentReviewService;
    private final boolean persistenceEnabled;
    private final List<InMemoryReview> reviews;

    /** Creates deterministic review fixtures only for the explicit non-persistent test profile. */
    private static List<InMemoryReview> mockReviews() {
        return List.of(
            new InMemoryReview("review-jingan-1", "store-jingan", "service-neck", "林女士", 5,
                    "环境安静，技师会提前确认肩颈重点，结束后放松感很明显。", List.of("环境安静", "手法专业"), List.of(), "2026-08-01"),
            new InMemoryReview("review-jingan-2", "store-jingan", "service-neck", "周先生", 5,
                    "到店接待很准时，房间私密性好，适合下班后短暂恢复。", List.of("准时接待", "独立房间"), List.of(), "2026-07-29"),
            new InMemoryReview("review-jingan-3", "store-jingan", "service-neck", "许女士", 5,
                    "肩颈热敷时间足，按完之后头颈轻松很多。", List.of("热敷舒适", "肩颈舒缓"), List.of(), "2026-07-26"),
            new InMemoryReview("review-jingan-4", "store-jingan", "service-spa", "沈女士", 5,
                    "香氛不刺鼻，服务节奏很放松。", List.of("芳香疗愈", "环境安静"), List.of(), "2026-07-24"),
            new InMemoryReview("review-jingan-5", "store-jingan", "service-neck", "陆先生", 4.8,
                    "技师会说明发力点，整体专业稳定。", List.of("手法专业", "沟通清楚"), List.of(), "2026-07-21"),
            new InMemoryReview("review-xujiahui-1", "store-xujiahui", "service-tui-na", "陈女士", 5,
                    "茶歇区舒服，整体节奏不催促，体验稳定。", List.of("茶歇区", "服务细致"), List.of(), "2026-07-25"),
            new InMemoryReview("review-lujiazui-1", "store-lujiazui", "service-neck", "顾先生", 5,
                    "位置方便，午休时间过来做肩颈很合适。", List.of("位置方便", "肩颈舒缓"), List.of(), "2026-07-22")
        );
    }

    /** Creates the adapter and resolves the optional persistent application service. */
    public ReviewController(BookingAppService bookingAppService, MediaAppService mediaAppService,
                            ObjectProvider<ReviewAppService> persistentReviewService,
                            @Value("${qiyu.auth.persistence:false}") boolean persistenceEnabled) {
        this.bookingAppService = bookingAppService;
        this.mediaAppService = mediaAppService;
        this.persistentReviewService = persistentReviewService.getIfAvailable();
        this.persistenceEnabled = persistenceEnabled;
        this.reviews = new ArrayList<>(persistenceEnabled ? List.of() : mockReviews());
    }

    /** Lists reviews from persistence or the explicit mock/test in-memory store. */
    @GetMapping
    public ApiResponse<ReviewResponseModels.Page> list(@RequestParam(required = false) String storeId,
                                                 @RequestParam(required = false) String serviceId,
                                                 @RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "2") int pageSize) {
        if (persistentReviewService != null) {
            return ApiResponse.success(persistentReviewService.list(storeId, serviceId, page, pageSize));
        }
        List<InMemoryReview> filtered = reviews.stream()
                .filter(review -> storeId == null || storeId.isBlank() || storeId.equals(review.storeId()))
                .filter(review -> serviceId == null || serviceId.isBlank() || serviceId.equals(review.serviceId()))
                .toList();
        int safePage = Math.max(1, page);
        int safePageSize = Math.max(1, pageSize);
        int fromIndex = Math.min((safePage - 1) * safePageSize, filtered.size());
        int toIndex = Math.min(fromIndex + safePageSize, filtered.size());
        List<ReviewResponseModels.Review> items = filtered.subList(fromIndex, toIndex).stream()
                .map(InMemoryReview::toResponse).toList();
        return ApiResponse.success(new ReviewResponseModels.Page(items, safePage, safePageSize, filtered.size(), toIndex < filtered.size()));
    }

    /** Submits a review through persistence or records it in the explicit mock/test store. */
    @PostMapping
    public ApiResponse<ReviewResponseModels.SubmitResult> submit(@Valid @RequestBody ReviewRequest request) {
        if (persistentReviewService != null) {
            return ApiResponse.success(persistentReviewService.submit(request));
        }
        BookingVO booking = bookingAppService.detail(request.bookingId());

        InMemoryReview review = new InMemoryReview(
                "review-" + System.currentTimeMillis(),
                booking.store().id(),
                booking.service().id(),
                Boolean.TRUE.equals(request.anonymous()) ? "匿名用户" : booking.customerName(),
                request.serviceRating(),
                request.content() == null ? "" : request.content(),
                copyOrEmpty(request.tags()),
                copyOrEmpty(request.imageUrls()),
                LocalDate.now().toString());
        reviews.add(0, review);
        return ApiResponse.success(new ReviewResponseModels.SubmitResult(request.bookingId(), true,
                review.toResponse()));
    }

    /** Uploads a review image to the configured media storage. */
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ReviewResponseModels.ImageUpload> uploadImage(@RequestParam("file") MultipartFile file) throws java.io.IOException {
        String imageUrl = mediaAppService.uploadImage("reviews", file.getOriginalFilename(), file.getContentType(), file.getInputStream(), file.getSize());
        return ApiResponse.success(new ReviewResponseModels.ImageUpload(imageUrl, file.getOriginalFilename() == null ? "image" : file.getOriginalFilename()));
    }

    /** Produces a deterministic test URL only when persistent storage is disabled. */
    @PostMapping(value = "/images", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ReviewResponseModels.ImageUpload> uploadImageMetadata(@Valid @RequestBody ReviewImageUploadRequest request) {
        if (persistenceEnabled) {
            throw new IllegalArgumentException("真实环境必须上传图片文件，不能提交本地临时路径");
        }
        String safeFileName = request.fileName().replaceAll("[^a-zA-Z0-9._-]", "-");
        return ApiResponse.success(new ReviewResponseModels.ImageUpload("https://mock-cdn.qiyu.local/reviews/" + safeFileName, safeFileName));
    }

    /** Copies request collections so stored reviews cannot be changed by their caller. */
    private static List<String> copyOrEmpty(List<String> values) {
        return values == null ? List.of() : List.copyOf(values);
    }

    /** Typed representation used only by the explicit mock/test in-memory adapter. */
    private record InMemoryReview(String id, String storeId, String serviceId, String userName, double rating,
                                  String content, List<String> tags, List<String> imageUrls, String createdAt) {
        /** Converts the in-memory model to the stable application response contract. */
        private ReviewResponseModels.Review toResponse() {
            return new ReviewResponseModels.Review(id, storeId, serviceId, userName, rating, content, tags,
                    imageUrls, createdAt);
        }
    }
}
