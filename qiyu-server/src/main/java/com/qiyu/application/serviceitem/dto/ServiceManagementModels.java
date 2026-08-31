package com.qiyu.application.serviceitem.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Typed commands and responses for service-item administration use cases. */
public final class ServiceManagementModels {
    private ServiceManagementModels() {
    }

    /** Carries validated mutable service-item values across the HTTP/application boundary. */
    public record ServiceCommand(
            @NotBlank String code,
            @NotBlank String name,
            @NotBlank String category,
            @NotNull @Min(1) Integer durationMinutes,
            @NotNull @Min(0) Integer preparationMinutes,
            @NotNull @Min(0) Integer cleanupMinutes,
            @NotNull @DecimalMin("0.00") BigDecimal price,
            @NotNull @DecimalMin("0.00") BigDecimal memberPrice,
            String description,
            @NotBlank String status,
            @NotNull Boolean enabled
    ) {
    }

    /** Stable administration projection returned after reads and successful mutations. */
    public record ServiceResource(
            String id,
            String code,
            String name,
            String category,
            Integer durationMinutes,
            Integer preparationMinutes,
            Integer cleanupMinutes,
            BigDecimal price,
            BigDecimal memberPrice,
            String description,
            String status,
            long bookingCount,
            boolean enabled
    ) {
    }
}
