package com.qiyu.adapter.review;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.booking.BookingAppService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {
    private final BookingAppService bookingAppService;
    private final List<Map<String, Object>> reviews = new ArrayList<>(List.of(
            Map.of("id", "review-jingan-1", "storeId", "store-jingan", "serviceId", "service-neck", "userName", "林女士", "rating", 5,
                    "content", "环境安静，技师会提前确认肩颈重点，结束后放松感很明显。", "tags", List.of("环境安静", "手法专业"), "createdAt", "2026-08-01"),
            Map.of("id", "review-jingan-2", "storeId", "store-jingan", "serviceId", "service-neck", "userName", "周先生", "rating", 5,
                    "content", "到店接待很准时，房间私密性好，适合下班后短暂恢复。", "tags", List.of("准时接待", "独立房间"), "createdAt", "2026-07-29"),
            Map.of("id", "review-jingan-3", "storeId", "store-jingan", "serviceId", "service-neck", "userName", "许女士", "rating", 5,
                    "content", "肩颈热敷时间足，按完之后头颈轻松很多。", "tags", List.of("热敷舒适", "肩颈舒缓"), "createdAt", "2026-07-26"),
            Map.of("id", "review-jingan-4", "storeId", "store-jingan", "serviceId", "service-spa", "userName", "沈女士", "rating", 5,
                    "content", "香氛不刺鼻，服务节奏很放松。", "tags", List.of("芳香疗愈", "环境安静"), "createdAt", "2026-07-24"),
            Map.of("id", "review-jingan-5", "storeId", "store-jingan", "serviceId", "service-neck", "userName", "陆先生", "rating", 4.8,
                    "content", "技师会说明发力点，整体专业稳定。", "tags", List.of("手法专业", "沟通清楚"), "createdAt", "2026-07-21"),
            Map.of("id", "review-xujiahui-1", "storeId", "store-xujiahui", "serviceId", "service-tui-na", "userName", "陈女士", "rating", 5,
                    "content", "茶歇区舒服，整体节奏不催促，体验稳定。", "tags", List.of("茶歇区", "服务细致"), "createdAt", "2026-07-25"),
            Map.of("id", "review-lujiazui-1", "storeId", "store-lujiazui", "serviceId", "service-neck", "userName", "顾先生", "rating", 5,
                    "content", "位置方便，午休时间过来做肩颈很合适。", "tags", List.of("位置方便", "肩颈舒缓"), "createdAt", "2026-07-22")
    ));

    public ReviewController(BookingAppService bookingAppService) {
        this.bookingAppService = bookingAppService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> list(@RequestParam(required = false) String storeId,
                                                 @RequestParam(required = false) String serviceId,
                                                 @RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "2") int pageSize) {
        List<Map<String, Object>> filtered = reviews.stream()
                .filter(review -> storeId == null || storeId.isBlank() || storeId.equals(review.get("storeId")))
                .filter(review -> serviceId == null || serviceId.isBlank() || serviceId.equals(review.get("serviceId")))
                .toList();
        int safePage = Math.max(1, page);
        int safePageSize = Math.max(1, pageSize);
        int fromIndex = Math.min((safePage - 1) * safePageSize, filtered.size());
        int toIndex = Math.min(fromIndex + safePageSize, filtered.size());
        List<Map<String, Object>> items = filtered.subList(fromIndex, toIndex);
        return ApiResponse.success(Map.of(
                "items", items,
                "page", safePage,
                "pageSize", safePageSize,
                "total", filtered.size(),
                "hasMore", toIndex < filtered.size()
        ));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> submit(@Valid @RequestBody ReviewRequest request) {
        Map<String, Object> booking = bookingAppService.detail(request.bookingId());
        Map<String, Object> store = asMap(booking.get("store"));
        Map<String, Object> service = asMap(booking.get("service"));

        Map<String, Object> review = new LinkedHashMap<>();
        review.put("id", "review-" + System.currentTimeMillis());
        review.put("storeId", String.valueOf(store.get("id")));
        review.put("serviceId", String.valueOf(service.get("id")));
        review.put("userName", Boolean.TRUE.equals(request.anonymous()) ? "匿名用户" : String.valueOf(booking.get("customerName")));
        review.put("rating", request.serviceRating());
        review.put("content", request.content() == null ? "" : request.content());
        review.put("tags", request.tags() == null ? List.of() : request.tags());
        review.put("imageUrls", request.imageUrls() == null ? List.of() : request.imageUrls());
        review.put("createdAt", LocalDate.now().toString());
        reviews.add(0, review);
        return ApiResponse.success(Map.of("bookingId", request.bookingId(), "reviewed", true, "review", review));
    }

    @PostMapping("/images")
    public ApiResponse<Map<String, Object>> uploadImage(@Valid @RequestBody ReviewImageUploadRequest request) {
        String safeFileName = request.fileName().replaceAll("[^a-zA-Z0-9._-]", "-");
        return ApiResponse.success(Map.of(
                "imageUrl", "https://mock-cdn.qiyu.local/reviews/" + safeFileName,
                "fileName", safeFileName
        ));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : Map.of();
    }
}
