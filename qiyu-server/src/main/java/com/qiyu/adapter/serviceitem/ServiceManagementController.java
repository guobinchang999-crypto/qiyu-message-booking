package com.qiyu.adapter.serviceitem;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.serviceitem.dto.ServiceManagementModels;
import com.qiyu.application.serviceitem.ServiceManagementService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** HTTP adapter for the administration service-item CRUD contract. */
@RestController
@RequestMapping("/admin/services")
@SaCheckLogin
public class ServiceManagementController {
    private final ServiceManagementService service;

    public ServiceManagementController(ServiceManagementService service) {
        this.service = service;
    }

    /** Returns all service items visible to administration users with service:read. */
    @GetMapping
    public ApiResponse<List<ServiceManagementModels.ServiceResource>> list() {
        return ApiResponse.success(service.list());
    }

    /** Creates one persistent service item after bean and business validation. */
    @PostMapping
    public ApiResponse<ServiceManagementModels.ServiceResource> create(
            @Valid @RequestBody ServiceManagementModels.ServiceCommand command) {
        return ApiResponse.success(service.create(command));
    }

    /** Replaces mutable service-item fields while preserving its stable identifier. */
    @PutMapping("/{id}")
    public ApiResponse<ServiceManagementModels.ServiceResource> update(
            @PathVariable String id,
            @Valid @RequestBody ServiceManagementModels.ServiceCommand command) {
        return ApiResponse.success(service.update(id, command));
    }

    /** Soft-deletes an unreferenced service item after service:manage authorization. */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
