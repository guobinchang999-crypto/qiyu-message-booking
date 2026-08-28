package com.qiyu.adapter.store;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.catalog.CatalogQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stores")
public class StoreController {
    private final CatalogQueryService catalogService;

    public StoreController(CatalogQueryService catalogService) { this.catalogService = catalogService; }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list() { return ApiResponse.success(catalogService.stores()); }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable String id) { return ApiResponse.success(catalogService.store(id)); }
}
