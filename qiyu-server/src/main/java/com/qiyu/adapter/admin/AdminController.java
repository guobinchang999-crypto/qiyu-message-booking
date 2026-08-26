package com.qiyu.adapter.admin;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.admin.AdminQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
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
}
