package com.qiyu.adapter.therapist;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.admin.AdminResponseModels;
import com.qiyu.application.therapist.TherapistManagementService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** HTTP adapter for therapist mutations; the existing AdminController remains the GET owner. */
@RestController
@RequestMapping("/admin/therapists")
@SaCheckLogin
public class TherapistManagementController {
    private final TherapistManagementService service;

    public TherapistManagementController(TherapistManagementService service) {
        this.service = service;
    }

    /** Creates a therapist and returns the same typed profile shape as the existing GET endpoint. */
    @PostMapping
    public ApiResponse<AdminResponseModels.TherapistProfile> create(
            @Valid @RequestBody TherapistManagementService.TherapistCommand command) {
        return ApiResponse.success(service.create(command));
    }

    /** Replaces mutable therapist master data and skill labels. */
    @PutMapping("/{id}")
    public ApiResponse<AdminResponseModels.TherapistProfile> update(
            @PathVariable String id,
            @Valid @RequestBody TherapistManagementService.TherapistCommand command) {
        return ApiResponse.success(service.update(id, command));
    }

    /** Soft-deletes a therapist after application-level booking and scope checks. */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
