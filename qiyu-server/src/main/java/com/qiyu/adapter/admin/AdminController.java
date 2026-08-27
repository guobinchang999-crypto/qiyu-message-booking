package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.admin.AdminQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@SaCheckLogin
public class AdminController {
    private final AdminQueryService adminQueryService;

    public AdminController(AdminQueryService adminQueryService) { this.adminQueryService = adminQueryService; }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() { return ApiResponse.success(adminQueryService.dashboard()); }

    @GetMapping("/bookings")
    public ApiResponse<Map<String, Object>> bookings(@RequestParam(required = false) String pageNum,
                                                       @RequestParam(required = false) String pageSize,
                                                       @RequestParam(required = false) String status) {
        return ApiResponse.success(adminQueryService.bookings(pageNum, pageSize, status));
    }

    @GetMapping("/schedule-resources")
    public ApiResponse<Map<String, Object>> scheduleResources() { return ApiResponse.success(adminQueryService.scheduleResources()); }

    @GetMapping("/accessible-stores")
    public ApiResponse<List<Map<String, Object>>> accessibleStores() { return ApiResponse.success(adminQueryService.accessibleStores()); }
}
