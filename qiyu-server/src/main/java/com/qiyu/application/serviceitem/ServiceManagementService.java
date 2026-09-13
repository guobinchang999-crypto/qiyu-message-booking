package com.qiyu.application.serviceitem;

import com.qiyu.application.serviceitem.dto.ServiceManagementModels;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/** Orchestrates authorized service-item master-data reads and mutations. */
@Service
public class ServiceManagementService {
    private static final String ON_SHELF = "ON_SHELF";
    private static final String OFF_SHELF = "OFF_SHELF";

    private final AuthAppService authAppService;
    private final ServiceManagementRepository repository;

    public ServiceManagementService(AuthAppService authAppService, ServiceManagementRepository repository) {
        this.authAppService = authAppService;
        this.repository = repository;
    }

    /** Returns the complete service catalog after enforcing administration read permission. */
    @Transactional(readOnly = true)
    public List<ServiceManagementModels.ServiceResource> list() {
        authAppService.requirePermission("service:read");
        return repository.findAll().stream().map(ServiceManagementService::resource).toList();
    }

    /** Creates one service item with an immutable, globally unique business code. */
    @Transactional
    public ServiceManagementModels.ServiceResource create(ServiceManagementModels.ServiceCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("service:manage");
        String code = normalizeCode(command.code());
        if (repository.codeExists(code)) {
            throw new IllegalArgumentException("服务项目编码已存在");
        }
        Long categoryId = resolveCategory(command.category());
        validatePrices(command);
        ServiceManagementRepository.ServiceMaster saved = repository.save(new ServiceManagementRepository.ServiceMaster(
                null, serviceId(code), code, categoryId, command.category().trim(), command.name().trim(),
                command.durationMinutes(), command.preparationMinutes(), command.cleanupMinutes(), command.price(),
                command.memberPrice(), trimToNull(command.description()), databaseStatus(command), 0, 0,
                String.valueOf(principal.userId()), String.valueOf(principal.userId())));
        return resource(saved);
    }

    /** Updates mutable values while retaining the existing stable ID and business code. */
    @Transactional
    public ServiceManagementModels.ServiceResource update(
            String serviceId, ServiceManagementModels.ServiceCommand command) {
        AuthPrincipal principal = authAppService.requirePermission("service:manage");
        ServiceManagementRepository.ServiceMaster current = repository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("服务项目不存在"));
        validateUnchangedCode(current.code(), command.code());
        if (!databaseStatus(command).equals(current.databaseStatus()) && repository.countUnfinishedBookings(current.databaseId())>0)
            throw new IllegalArgumentException("项目仍有未完成预约，请先查看并处理预约再调整上下架状态");
        validatePrices(command);
        Long categoryId = resolveCategory(command.category());
        ServiceManagementRepository.ServiceMaster saved = repository.save(new ServiceManagementRepository.ServiceMaster(
                current.databaseId(), current.id(), current.code(), categoryId, command.category().trim(),
                command.name().trim(), command.durationMinutes(), command.preparationMinutes(), command.cleanupMinutes(),
                command.price(), command.memberPrice(), trimToNull(command.description()), databaseStatus(command),
                current.sortOrder(), current.bookingCount(), current.createdBy(), String.valueOf(principal.userId())));
        return resource(saved);
    }

    /** Soft-deletes an unreferenced service item and preserves every historical booking invariant. */
    @Transactional
    public void delete(String serviceId) {
        authAppService.requirePermission("service:manage");
        ServiceManagementRepository.ServiceMaster current = repository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("服务项目不存在"));
        if (repository.countBookingReferences(current.databaseId()) > 0) {
            throw new IllegalArgumentException("服务项目已被预约引用，不能删除");
        }
        repository.delete(current.databaseId());
    }

    /** Resolves a category name and rejects values outside the maintained category dictionary. */
    private Long resolveCategory(String categoryName) {
        String normalized = categoryName == null ? "" : categoryName.trim();
        return repository.findCategoryId(normalized)
                .orElseThrow(() -> new IllegalArgumentException("服务分类不存在或已停用"));
    }

    /** Prevents replacement-style updates from silently changing stable external identifiers. */
    private static void validateUnchangedCode(String currentCode, String requestedCode) {
        if (!currentCode.equals(normalizeCode(requestedCode))) {
            throw new IllegalArgumentException("服务项目编码创建后不能修改");
        }
    }

    /** Enforces the commercial invariant that a member price cannot exceed the standard price. */
    private static void validatePrices(ServiceManagementModels.ServiceCommand command) {
        if (command.memberPrice().compareTo(command.price()) > 0) {
            throw new IllegalArgumentException("会员价格不能高于标准价格");
        }
    }

    /** Normalizes external status labels into the database enum and lets enabled fail closed. */
    private static String databaseStatus(ServiceManagementModels.ServiceCommand command) {
        if (!Boolean.TRUE.equals(command.enabled())) {
            return OFF_SHELF;
        }
        return switch (command.status().trim().toUpperCase(Locale.ROOT)) {
            case "上架", ON_SHELF -> ON_SHELF;
            case "下架", OFF_SHELF -> OFF_SHELF;
            default -> throw new IllegalArgumentException("服务项目状态不正确");
        };
    }

    /** Maps persistence values to the stable administration response contract. */
    private static ServiceManagementModels.ServiceResource resource(ServiceManagementRepository.ServiceMaster value) {
        boolean enabled = ON_SHELF.equals(value.databaseStatus());
        return new ServiceManagementModels.ServiceResource(value.id(), value.code(), value.name(), value.category(),
                value.durationMinutes(), value.preparationMinutes(), value.cleanupMinutes(), value.price(),
                value.memberPrice(), value.description(), enabled ? "上架" : "下架", value.bookingCount(), enabled);
    }

    /** Produces the canonical code accepted by database uniqueness and API ID generation. */
    private static String normalizeCode(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("服务项目编码不能为空");
        }
        String code = value.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        if (!code.matches("[A-Z0-9_]{2,32}")) {
            throw new IllegalArgumentException("服务项目编码只能包含字母、数字和下划线");
        }
        return code;
    }

    /** Derives a stable opaque API ID from the immutable service code. */
    public static String serviceId(String code) {
        return "service-" + code.toLowerCase(Locale.ROOT).replace('_', '-');
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
