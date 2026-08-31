package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.coupon.CouponManagementService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Thin administration adapter for coupon-template CRUD. */
@RestController
@RequestMapping("/admin/coupon-templates")
@SaCheckLogin
public class CouponManagementController {
    private final CouponManagementService service;
    public CouponManagementController(CouponManagementService service){this.service=service;}
    /** Lists typed coupon templates with real issue and usage counters. */
    @GetMapping public ApiResponse<List<CouponManagementService.CouponView>> list(){return ApiResponse.success(service.list());}
    /** Creates one all-store coupon template. */
    @PostMapping public ApiResponse<CouponManagementService.CouponView> create(@RequestBody CouponManagementService.CouponCommand command){return ApiResponse.success(service.create(command));}
    /** Updates one coupon template while retaining its stable code. */
    @PutMapping("/{id}") public ApiResponse<CouponManagementService.CouponView> update(@PathVariable String id,@RequestBody CouponManagementService.CouponCommand command){return ApiResponse.success(service.update(id,command));}
    /** Soft-deletes only a template with no issuance history. */
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(@PathVariable String id){service.delete(id);return ApiResponse.success(null);}
}
