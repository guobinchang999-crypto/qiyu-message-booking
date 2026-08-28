package com.qiyu.adapter.therapist;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.catalog.CatalogQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/therapists")
public class TherapistController {
    private final CatalogQueryService catalogService;

    public TherapistController(CatalogQueryService catalogService) { this.catalogService = catalogService; }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@RequestParam(required = false) String storeId,
                                                        @RequestParam(required = false) String serviceId) {
        return ApiResponse.success(catalogService.therapists(storeId, serviceId));
    }
}
