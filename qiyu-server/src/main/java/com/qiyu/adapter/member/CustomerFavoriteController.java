package com.qiyu.adapter.member;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.member.CustomerFavoriteService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Customer adapter for persisted store and service favorites. */
@RestController
@RequestMapping("/member/favorites")
@SaCheckLogin
public class CustomerFavoriteController {
    private final CustomerFavoriteService service;

    public CustomerFavoriteController(CustomerFavoriteService service) {
        this.service = service;
    }

    /** Reads whether the current customer has favorited the requested resource. */
    @GetMapping("/{resourceType}/{resourceId}")
    public ApiResponse<CustomerFavoriteService.FavoriteView> get(
            @PathVariable String resourceType,
            @PathVariable String resourceId
    ) {
        return ApiResponse.success(service.get(resourceType, resourceId));
    }

    /** Adds or restores one favorite idempotently. */
    @PutMapping("/{resourceType}/{resourceId}")
    public ApiResponse<CustomerFavoriteService.FavoriteView> add(
            @PathVariable String resourceType,
            @PathVariable String resourceId
    ) {
        return ApiResponse.success(service.add(resourceType, resourceId));
    }

    /** Removes one favorite without exposing another customer's records. */
    @DeleteMapping("/{resourceType}/{resourceId}")
    public ApiResponse<CustomerFavoriteService.FavoriteView> remove(
            @PathVariable String resourceType,
            @PathVariable String resourceId
    ) {
        return ApiResponse.success(service.remove(resourceType, resourceId));
    }
}
