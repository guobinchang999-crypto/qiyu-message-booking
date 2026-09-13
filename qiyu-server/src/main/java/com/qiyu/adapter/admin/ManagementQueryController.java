package com.qiyu.adapter.admin;

import com.qiyu.application.admin.ManagementQueryService;
import com.qiyu.application.admin.dto.ManagementModels.*;
import com.qiyu.adapter.common.ApiResponse;
import org.springframework.web.bind.annotation.*;

/** Backward-compatible administration query surface. */
@RestController
@RequestMapping("/admin/management")
public class ManagementQueryController {
    private final ManagementQueryService service;
    public ManagementQueryController(ManagementQueryService service){this.service=service;}
    @GetMapping("/store-options") public Object stores(@RequestParam String resource){return ApiResponse.success(service.stores(resource));}
    @GetMapping("/customers") public Object customers(@ModelAttribute Query query){return ApiResponse.success(service.customers(query,false));}
    @GetMapping("/members") public Object members(@ModelAttribute Query query){return ApiResponse.success(service.customers(query,true));}
    @GetMapping("/members/{id}/ledger") public Object ledger(@PathVariable String id,@ModelAttribute Query query){return ApiResponse.success(service.ledger(id,query));}
    @GetMapping("/coupon-records") public Object couponRecords(@RequestParam(required=false) String templateId,@ModelAttribute Query query){return ApiResponse.success(service.couponRecords(templateId,query));}
    @GetMapping("/analytics") public Object analytics(@RequestParam(defaultValue="false") boolean dashboard,@ModelAttribute Query query){return ApiResponse.success(service.analytics(query,dashboard));}
    @GetMapping("/analytics/export") public Object export(@ModelAttribute Query query){return ApiResponse.success(java.util.Map.of("csv",service.export(query)));}
    @GetMapping("/{resource}/{id}/impact") public Object impact(@PathVariable String resource,@PathVariable String id){return ApiResponse.success(java.util.Map.of("count",service.impact(resource,id)));}
    @GetMapping("/{resource}") public Object resources(@PathVariable String resource,@ModelAttribute Query query){return ApiResponse.success(service.resources(resource,query));}
}
