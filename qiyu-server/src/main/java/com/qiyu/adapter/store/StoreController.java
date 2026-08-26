package com.qiyu.adapter.store;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.infrastructure.mock.MockCatalogProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/stores")
public class StoreController {
    private final MockCatalogProvider catalogProvider;

    public StoreController(MockCatalogProvider catalogProvider) { this.catalogProvider = catalogProvider; }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list() { return ApiResponse.success(catalogProvider.stores()); }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable String id) { return ApiResponse.success(catalogProvider.findStore(id)); }
}
