package com.qiyu.adapter.therapist;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/therapists")
public class TherapistController {
    private final MockCatalogProvider catalogProvider;

    public TherapistController(MockCatalogProvider catalogProvider) { this.catalogProvider = catalogProvider; }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@RequestParam(required = false) String storeId,
                                                        @RequestParam(required = false) String serviceId) {
        return ApiResponse.success(catalogProvider.therapists(storeId, serviceId));
    }
}
