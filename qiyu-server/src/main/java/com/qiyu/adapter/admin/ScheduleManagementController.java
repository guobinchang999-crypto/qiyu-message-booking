package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.schedule.ScheduleManagementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Thin HTTP adapter for administration therapist schedule CRUD. */
@RestController
@RequestMapping("/admin/schedules")
@SaCheckLogin
public class ScheduleManagementController {
    private final ScheduleManagementService service;

    public ScheduleManagementController(ScheduleManagementService service) { this.service = service; }

    @GetMapping
    public ApiResponse<List<ScheduleManagementService.ScheduleView>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(service.list(startDate, endDate));
    }

    @PostMapping
    public ApiResponse<ScheduleManagementService.ScheduleView> create(
            @RequestBody ScheduleManagementService.ScheduleCommand command) {
        return ApiResponse.success(service.create(command));
    }

    @PutMapping("/{id}")
    public ApiResponse<ScheduleManagementService.ScheduleView> update(
            @PathVariable String id, @RequestBody ScheduleManagementService.ScheduleCommand command) {
        return ApiResponse.success(service.update(id, command));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) { service.delete(id); return ApiResponse.success(null); }
}
