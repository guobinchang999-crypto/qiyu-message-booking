package com.qiyu.adapter.serviceitem;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/services")
public class ServiceItemController {
    private final MockCatalogProvider catalogProvider;

    public ServiceItemController(MockCatalogProvider catalogProvider) { this.catalogProvider = catalogProvider; }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list() { return ApiResponse.success(catalogProvider.services()); }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable String id) { return ApiResponse.success(catalogProvider.findService(id)); }
}
