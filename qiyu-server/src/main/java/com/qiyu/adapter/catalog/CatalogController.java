package com.qiyu.adapter.catalog;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.catalog.CatalogQueryService;
import com.qiyu.application.catalog.dto.ClientCatalogPayload;
import com.qiyu.application.catalog.dto.DictionaryItemVO;
import com.qiyu.application.catalog.dto.DictionaryCollectionVO;
import com.qiyu.application.catalog.dto.ResourceOptionVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {
    private final CatalogQueryService catalogQueryService;

    public CatalogController(CatalogQueryService catalogQueryService) {
        this.catalogQueryService = catalogQueryService;
    }

    @GetMapping("/dictionaries")
    public ApiResponse<DictionaryCollectionVO> dictionaries() {
        return ApiResponse.success(catalogQueryService.dictionaries());
    }

    @GetMapping("/client")
    public ApiResponse<ClientCatalogPayload> clientCatalog() {
        return ApiResponse.success(catalogQueryService.clientCatalog());
    }

    @GetMapping("/dictionaries/{type}")
    public ApiResponse<List<DictionaryItemVO>> dictionary(@PathVariable String type) {
        return ApiResponse.success(catalogQueryService.dictionary(type));
    }

    @GetMapping("/options/stores")
    public ApiResponse<List<ResourceOptionVO>> storeOptions() {
        return ApiResponse.success(catalogQueryService.storeOptions());
    }

    @GetMapping("/options/services")
    public ApiResponse<List<ResourceOptionVO>> serviceOptions() {
        return ApiResponse.success(catalogQueryService.serviceOptions());
    }

    @GetMapping("/options/therapists")
    public ApiResponse<List<ResourceOptionVO>> therapistOptions(@RequestParam(required = false) String storeId,
                                                                @RequestParam(required = false) String serviceId) {
        return ApiResponse.success(catalogQueryService.therapistOptions(storeId, serviceId));
    }

    @GetMapping("/options/rooms")
    public ApiResponse<List<ResourceOptionVO>> roomOptions(@RequestParam(required = false) String storeId,
                                                           @RequestParam(required = false) String status) {
        return ApiResponse.success(catalogQueryService.roomOptions(storeId, status));
    }

    @GetMapping("/options/regions")
    public ApiResponse<List<ResourceOptionVO>> regionOptions() {
        return ApiResponse.success(catalogQueryService.regionOptions());
    }
}
