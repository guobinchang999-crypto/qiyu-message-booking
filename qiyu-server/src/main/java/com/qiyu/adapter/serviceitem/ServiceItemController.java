package com.qiyu.adapter.serviceitem;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.catalog.CatalogQueryService;
import com.qiyu.application.catalog.dto.CatalogResourceVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/services")
public class ServiceItemController {
    private final CatalogQueryService catalogService;

    public ServiceItemController(CatalogQueryService catalogService) { this.catalogService = catalogService; }

    @GetMapping
    public ApiResponse<List<CatalogResourceVO.ServiceItemVO>> list() { return ApiResponse.success(catalogService.services()); }

    @GetMapping("/{id}")
    public ApiResponse<CatalogResourceVO.ServiceItemVO> detail(@PathVariable String id) { return ApiResponse.success(catalogService.service(id)); }
}
